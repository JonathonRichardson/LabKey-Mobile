var babel    = require('gulp-babel'),
    bump     = require('gulp-bump'),
    debug    = require('gulp-debug'),
    insert   = require('gulp-insert'),
    concat   = require('gulp-concat'),
    uuid     = require('node-uuid'),
    rename   = require('gulp-rename'),
    replace  = require('gulp-replace'),
    filter   = require('gulp-filter'),
    jsonfile = require('jsonfile'),
    _        = require('underscore'),
    del      = require('del'),
    os       = require('os'),
    glob     = require('glob'),
    path     = require('path'),
    gutil    = require('gulp-util'),
    formatJSON = require('format-json'),
    spawn    = require('child_process').spawn;
fs       = require('fs');

var licenseUtil = require('./license-util.js');

exports.addTasks = function(gulp) {
    var cleanFiles = function() {
        del.sync(['deploy']);
    };

    var buildTasksDir = path.join(__dirname);

    //
    // This function uses a filter for .es6/.jsx/.js6 files and compiles them down to
    // ES5 .js files using babel.  It has the 2015 standard, plus the addition of
    // async functions.
    var babelDisclaimer = fs.readFileSync(path.join(buildTasksDir, 'Babel-Disclaimer.txt')) + '\n\n';
    var babelCompile = function(stream) {
        // Set a filter to just grab the stuff we want...
        var jsFilter = filter(['**/*.jsx', '**/*.es6', '**/*.js6'], {restore: true});
        stream = stream.pipe(jsFilter);

        // Now, transform async functions to ES6 generators...
        stream = stream.pipe(babel({
            "plugins": ["transform-async-to-generator"]

        }));

        // And, transform all of that es6 down to es5...
        stream = stream.pipe(babel({
            "presets": ["es2015"]
        }));

        // Rename all of the files, now that they're plain old javascript...
        stream = stream.pipe(rename({extname: ".js"}));

        // Prepend the disclaimer to note their origin and explain their odd syntax.
        stream = stream.pipe(insert.prepend(babelDisclaimer));

        // Finally, restore the stream to it's pre-filter glory.
        stream = stream.pipe(jsFilter.restore);
        return stream
    };

    var die = function() {
        var args = Array.prototype.slice.call(arguments);
        args = _.map(args, function(value) {
            if ( typeof(value) === 'string' ) {
                value = gutil.colors.red(value);
            }
            return value;
        });
        gutil.log.apply(this, args);
        cleanFiles();
        process.exit(1);
    };

    var getBuildTimestamp = function() {
        var time = new Date();

        var ampm = time.getHours() >= 12 ? 'pm' : 'am';

        var monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        return monthNames[time.getMonth()] + ' ' + time.getDate() + ' ' + time.getFullYear() + ', '
            + (time.getHours() % 12) + ':' + time.getMinutes() + ' ' + ampm;
    };

    var getPackageProperties = function() {
        var json = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return json;
    };

    var getVersion = function() {
        var pad = function(n, width, z) {
            z = z || '0';
            n = n + '';
            return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
        }

        var parts = getPackageProperties().version.split('.');
        return parts[0] + '.' + pad(parts[1],3) + pad(parts[2],5);
    };

    var _mod_name = null;
    var getModuleName = function() {
        if ( _mod_name === null ) {
            var props = getPackageProperties();

            if ( !props || !('name' in props) || (props.name.toString().length < 1) ) {
                die("Invalid or missing package name.");
            }

            _mod_name = props.name.replace(/-/g,"_");
        }

        return _mod_name;
    };

    var getModuleDir = function() {
        return path.join( process.cwd(), 'deploy', getModuleName() );
    };

    gulp.task('LKM - Bump Build Version', function() {
        return gulp.src(['package.json'])
            .pipe(bump())
            .pipe(gulp.dest('./'));
    });

    gulp.task('LKM - Clean', function(cb) {
        cleanFiles();
        cb();
    });

    gulp.task('LKM - Init', ['LKM - Clean', 'LKM - Bump Build Version']);

    gulp.task('LKM - Compile module.iml', ['LKM - Copy Core Files'], function() {
        var stream = gulp.src([ path.join( __dirname, '../template_files/module.iml' ) ]);
        return stream.pipe(replace('{{ModuleName}}', getModuleName()))
            .pipe(rename( getModuleName() + ".iml" ))
            .pipe(gulp.dest( getModuleDir() ));
    });

    gulp.task('LKM - Compile module.properties', ['LKM - Init', 'LKM - Copy Core Files'], function(cb) {
        try {
            var props = jsonfile.readFileSync( path.join(process.cwd(),'module.properties.json') );
        }
        catch (error) {
            die("You must include a file named 'module.properties.json' in the root of the module.  Received the following error: ", error);
        }

        // Generate an EnlistmentId
        props.EnlistmentId = uuid.v4();

        var json = getPackageProperties();

        // Get the build time and other stuff
        props.Author      = json.author;
        props.BuildTime   = getBuildTimestamp();
        props.BuildOS     = os.type();
        props.BuildUser   = process.env.USER;
        props.BuildPath   = path.join( getModuleDir(), getModuleDir() + '.module' );
        props.Label       = json.description;
        props.License     = json.license;
        props.LicenseURL  = licenseUtil.getLicenseURL(json.license);
        props.ModuleClass = "org.labkey." + getModuleName() + "." + getModuleName() + "Module";
        props.Name        = getModuleName();
        props.SourcePath  = getModuleDir();
        props.Version     = getVersion();
        props.Revision    = 'Not built from a Subversion source tree';

        // Replace all of the keys in the configuration
        var fileText = "";
        _.each(props, function(value, key) {
            fileText += key + "=" + value + '\n';
        });

        // Rename the file and write it out
        var propFile = path.join(getModuleDir(), 'module.properties');
        gutil.log("Writing " + propFile);
        fs.writeFile( propFile, fileText, function() {
            cb();
        });
    });

    gulp.task('LKM - Copy Core Files', ['LKM - Init'], function() {
        var core = gulp.src([ path.join(__dirname,'../module_files/**') ]);

        // Replace the default module name with our package name in paths
        core = core.pipe(rename(function(path) {
            _.each(path, function(pieceValue, pieceName) {
                path[pieceName] = pieceValue.replace('labkey_mobile', getModuleName() );
            });
        }));

        var staticContentFilter = filter(['**/*.es6', '**/*.jsx','**/*.js', '**/*.html', '**/*.java', '**/*.jsp', '**/*.css'], {restore: true});
        core = core.pipe(staticContentFilter);
        core = core.pipe(replace('labkey_mobile', getModuleName()));

        core = babelCompile(core);

        var keywords = {
            Version: getVersion(),
            ModuleName: getModuleName()
        };
        _.each(keywords, function(value, keyword) {
            core = core.pipe(replace('{@{' + keyword + '}@}', value));
        });

        core = core.pipe(staticContentFilter.restore);

        return core.pipe(gulp.dest( getModuleDir() ));
    });

    gulp.task('LKM - Copy Content Files', ['LKM - Copy Core Files'], function() {
        var content    = gulp.src([ path.join( process.cwd(), 'content', '**') ]);
        var contentDir = path.join(getModuleDir(), 'resources/web/' + getModuleName() + '/content');
        gutil.log( 'Writing content to: ' + contentDir );

        var keywords = {
            Version: getVersion(),
            ModuleName: getModuleName()
        };
        _.each(keywords, function(value, keyword) {
            content = content.pipe(replace('{@{' + keyword + '}@}', value));
        });

        content = babelCompile(content);

        return content.pipe(gulp.dest( contentDir ));
    });

    gulp.task('LKM - Copy JS Files', ['LKM - Copy Core Files'], function() {
        var js    = gulp.src([ path.join( process.cwd(), 'js', '**') ]);
        var jsDir = path.join(getModuleDir(), 'resources/web/' + getModuleName() + '/js');
        gutil.log( 'Writing content to: ' + jsDir );

        var keywords = {
            Version: getVersion(),
            ModuleName: getModuleName()
        };
        _.each(keywords, function(value, keyword) {
            js = js.pipe(replace('{@{' + keyword + '}@}', value));
        });

        js = babelCompile(js);

        return js.pipe(gulp.dest( jsDir ));
    });

    gulp.task('LKM - Compile Content Manifest', ['LKM - Copy Content Files'], function(cb) {
        var contentDir = path.join(getModuleDir(), 'resources', 'web', getModuleName(), "content/");
        var files = glob.sync(contentDir + '/**', {mark: true});

        var fileMap = {};
        _.each(files, function(file) {
            var relPath = path.relative(contentDir, file);

            var parsedPath = path.parse(relPath);
            var key = path.join( parsedPath.dir, parsedPath.name );

            if (!(key in fileMap)) {
                fileMap[key] = {
                    hasVM: false,
                    hasHTML: false,
                    data: {}
                };
            }

            if (parsedPath.ext === ".js") {
                fileMap[key].hasVM = true;
            }
            else if (parsedPath.ext === ".html") {
                fileMap[key].hasHTML = true;
            }
            else if (parsedPath.ext === ".json") {
                var data = JSON.parse(fs.readFileSync(file));
                fileMap[key].data = data;
            }
        });

        var startOfModule = 'define([],function(){ return ';
        var endOfModule = '});';

        var module = startOfModule + formatJSON.plain(fileMap) + endOfModule;

        var manifestPath = path.join(getModuleDir(), 'resources', 'web', getModuleName(), 'corelib', 'content-manifest.js');
        fs.writeFileSync(manifestPath, module);

        cb();
    });

    gulp.task('LKM - Generate Credits JSON', ['LKM - Copy Images'], function(cb) {
        var imageDir = path.join(getModuleDir(), 'resources', 'web', getModuleName(), 'images');
        var files = glob.sync( imageDir + "/**/*.json");

        var imageCredits = [];
        _.each(files, function(filename) {
            // Grab file contents
            var info = JSON.parse(fs.readFileSync(filename));

            // Get name of config file without ".json"
            var baseName = path.parse(filename);
            baseName.ext = "";
            baseName.base = baseName.name;
            baseName = path.format(baseName);

            // Find the corresponding image file for that file.
            var imageFiles = glob.sync( baseName + "*");
            if ( imageFiles.length > 0 ) {
                imageURL = imageFiles[0];
            }
            else {
                imageURL = "";
            }
            imageURL = path.relative( path.join(imageDir, ".."), imageURL);

            var credits = {
                path: filename,
                info: info,
                imageUrl: imageURL
            };
            imageCredits.push(credits);
        });

        var creditsJSON = {
            images: imageCredits
        };

        var creditsFilePath = path.join(getModuleDir(), 'resources', 'web', getModuleName(), 'content', 'Admin', 'Credits.json');
        fs.writeFileSync(creditsFilePath, formatJSON.plain(creditsJSON));

        cb();
    });

    gulp.task('LKM - Copy Stylesheets', ['LKM - Copy Core Files'], function() {
        var css    = gulp.src([ path.join( process.cwd(), 'stylesheets', '**', '*.css') ]);
        var cssDir = path.join(getModuleDir(), 'resources', 'web', getModuleName(), 'css');
        return css.pipe(gulp.dest( cssDir ));
    });

    gulp.task('LKM - Copy Images', ['LKM - Copy Core Files'], function() {
        var css    = gulp.src([ path.join( process.cwd(), 'images', '**') ]);
        var cssDir = path.join(getModuleDir(), 'resources', 'web', getModuleName(), 'images');
        return css.pipe(gulp.dest( cssDir ));
    });

    gulp.task('LKM - Copy Components', ['LKM - Copy Core Files'], function() {
        var components     = gulp.src([ path.join( process.cwd(), 'components', '**') ]);
        var componentsDir  = path.join(getModuleDir(), 'resources', 'web', getModuleName(), 'components');

        var keywords = {
            Version: getVersion(),
            ModuleName: getModuleName()
        };
        _.each(keywords, function(value, keyword) {
            components = components.pipe(replace('{@{' + keyword + '}@}', value));
        });

        return components.pipe( gulp.dest(componentsDir) );
    });

    var checkLABKEYROOT = function(no_die) {
        var safe_dir;
        if (no_die) {
            safe_die = function() {
                var args = Array.prototype.slice.call(arguments);
                throw args.join("");
            }
        }
        else {
            safe_die = die;
        }

        if ('LABKEY_ROOT' in process.env) {
            try {
                var stats = fs.lstatSync(process.env.LABKEY_ROOT);
                if ( !stats.isDirectory() ) {
                    throw "LABKEY_ROOT needs to be a directory path.";
                }
            }
            catch (error) {
                safe_die("An error occurred while trying to deploy: ", error);
            }
        }
        else {
            safe_die("You need to define LABKEY_ROOT before using gulp to deploy your mobile module.");
        }

        return path.join( process.env.LABKEY_ROOT, 'server', 'optionalModules' );
    };

    var cleanDeployedtask = function() {
        var optionalModulesPath = checkLABKEYROOT();
        var deployedModulePath  = path.join( optionalModulesPath, getModuleName() );

        gutil.log("Clearing out " + deployedModulePath);
        del.sync([ deployedModulePath ], {force: true});
    };

    gulp.task('LKM - Clean-Deployed', function(cb) {
        cleanDeployedtask();
        cb();
    });

    var deployTask = function() {
        var optionalModulesPath = checkLABKEYROOT();
        var deployedModulePath  = path.join( optionalModulesPath, getModuleName() );

        gutil.log("Copying " + getModuleDir() + " to " + deployedModulePath);
        gulp.src( path.join(getModuleDir(),'**') ).pipe(gulp.dest( deployedModulePath ));
    };

    gulp.task('LKM - Deploy', ['LKM - Clean-Deployed'], function(cb) {
        deployTask();
        cb();
    });

    gulp.task('build_mobile', ['LKM - Copy Components',
                               'LKM - Copy Stylesheets',
                               'LKM - Copy Images',
                               'LKM - Compile module.properties',
                               'LKM - Copy Content Files',
                               'LKM - Generate Credits JSON',
                               'LKM - Copy JS Files',
                               'LKM - Compile module.iml',
                               'LKM - Compile Content Manifest'], function() {
        try {
            checkLABKEYROOT(true);

            cleanDeployedtask();
            deployTask();
        }
        catch(error) {
            gutil.log(gutil.colors.yellow("LABKEY_ROOT is not properly defined, so we will not attempt to deploy module." + error));
        }
    });

    gulp.task('LKM - Build', ['LKM - Deploy'], function(cb) {
        var optionalModulesPath = checkLABKEYROOT();
        var labkeyRoot          = path.join(optionalModulesPath, '..', '..');
        var antExecutable       = path.join(labkeyRoot, 'external', 'ant', 'bin', 'ant');
        var buildXML            = path.join(labkeyRoot, 'server', 'build.xml');
        var modulePath          = path.join(optionalModulesPath, getModuleName());

        var child = spawn(antExecutable, ['-buildfile', buildXML, '-DmoduleDir=' + modulePath, 'build_module']);
        child.stdout.on('data', function(data) {
            console.log("" + data);
        });
        child.stderr.on('data', function(data) {
            gutil.log(gutil.colors.red("" + data));
        });
        child.on('exit', function() {
            cb();
        });
    });
};
