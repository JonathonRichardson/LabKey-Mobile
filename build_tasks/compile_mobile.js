var bump     = require('gulp-bump'),
    debug    = require('gulp-debug'),
    uuid     = require('node-uuid'),
    rename   = require('gulp-rename'),
    replace  = require('gulp-replace'),
    jsonfile = require('jsonfile'),
    _        = require('underscore'),
    del      = require('del'),
    os       = require('os'),
    path     = require('path'),
    gutil    = require('gulp-util'),
    fs       = require('fs');

var licenseUtil = require('./license-util.js');

exports.addTasks = function(gulp) {
  var cleanFiles = function() {
    del.sync(['deploy']);
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
  
  gulp.task('LKM - Compile module.xml', ['LKM - Init', 'LKM - Copy Core Files'], function(cb) {
    try {
      var props = jsonfile.readFileSync( path.join(process.cwd(),'module.properties.json') );
    }
    catch (error) {
      die("You must include a file named 'module.properties.json' in the root of the module.  Received the following error: ", error);
    }
    var stream = gulp.src([ path.join(__dirname,'../template_files/module.template.xml') ])
     
    // Generate an EnlistmentId
    props.EnlistmentId = uuid.v4();
  
    var json = getPackageProperties();
  
    // Get the build time and other stuff
    props.Author      = json.author;
    props.BuildTime   = getBuildTimestamp();
    props.BuildOS     = os.type();
    props.BuildUser   = process.env.USER;
    props.BuildPath   = path.join( getModuleDir(), 'mobile.module' );
    props.Label       = json.description;
    props.License     = json.license;
    props.LicenseURL  = licenseUtil.getLicenseURL(json.license);
    props.ModuleClass = "org.labkey.mobile.mobileModule";
    props.Name        = getModuleName();
    props.SourcePath  = getModuleDir();
    props.Version     = json.version;
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
    return core.pipe(gulp.dest( getModuleDir() ));
  });
  
  gulp.task('LKM - Copy Content Files', ['LKM - Copy Core Files'], function() {
    var content = gulp.src([ path.join( process.cwd(), 'content/**') ]);
    return content.pipe(gulp.dest( path.join(getModuleDir(), 'resources/web/mobile/content') ));
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

  gulp.task('LKM - Deploy', ['LKM - Clean-Deployed'], deployTask );
  
  gulp.task('build_mobile', ['LKM - Compile module.xml', 'LKM - Copy Content Files', 'LKM - Compile module.iml'], function() {
    try {
      checkLABKEYROOT(true);

      cleanDeployedtask();
      deployTask();
    }
    catch(error) {
      gutil.log(gutil.colors.yellow("LABKEY_ROOT is not properly defined, so we will not attempt to deploy module." + error));
    }
  });
};