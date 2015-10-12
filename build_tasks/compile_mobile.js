var bump     = require('gulp-bump'),
    uuid     = require('node-uuid'),
    rename   = require('gulp-rename'),
    replace  = require('gulp-replace'),
    jsonfile = require('jsonfile'),
    _        = require('underscore'),
    del      = require('del'),
    os       = require('os'),
    path     = require('path'),
    fs       = require('fs');
  
exports.addTasks = function(gulp) {
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

      if ( !props || !('Name' in props) || (props.Name.toString().length < 1) ) {
        console.error("Invalid package name");
        process.exit(1);
      }

      _mod_name = props.name;
    }

    return _mod_name;
  };

  var getModuleDir = function() {
    return path.join( process.cwd(), 'deploy', getModuleName() );
  };
  
  gulp.task('bump', function() {
    return gulp.src(['package.json'])
      .pipe(bump())
      .pipe(gulp.dest('./'));
  });
  
  gulp.task('clean', function(cb) {
    del(['deploy']);
    //fs.mkdirSync('deploy');
    cb();
  });
  
  gulp.task('init', ['clean', 'bump']);
  
  gulp.task('make_module.xml', ['init'], function() {
    try {
      var props = jsonfile.readFileSync( path.join(process.cwd(),'module.properties.json') );
    }
    catch (error) {
      console.error("You must include a file named 'module.properties.json' in the root of the module.  Received the following error: ", error);
      process.exit(1);
    }
    var stream = gulp.src([ path.join(__dirname,'../template_files/module.template.xml') ])
     
    // Generate an EnlistmentId
    props.EnlistmentId = uuid.v4();
  
    var json = getPackageProperties();
  
    // Get the build time and other stuff
    props.Author     = json.author;
    props.BuildTime  = getBuildTimestamp();
    props.BuildOS    = os.type();
    props.BuildUser  = process.env.USER;
    props.BuildPath  = path.join( getModuleDir(), 'mobile.module' );
    props.Label      = json.description;
    props.License    = props.license;
    props.Name       = getModuleName();
    props.SourcePath = getModuleDir();
    props.Version    = json.version;
    props.Revision   = 'Not built from a Subversion source tree';
  
    // Replace all of the keys in the configuration
    _.each(props, function(value, key) {
      stream = stream.pipe(replace('@@' + key + '@@', props[key]));
    });
  
    // Rename the file and write it out
    stream.pipe(rename('module.xml')).pipe(gulp.dest( path.join(getModuleDir(),'config'));
  });
  
  gulp.task('copy_files', ['init'], function() {
    var core = gulp.src([ path.join(__dirname,'../module_files/**') ])
      .pipe(gulp.dest( getModuleDir() ));
  
    var content = gulp.src([ path.join( process.cwd(), 'content/**') ])
      .pipe(gulp.dest( path.join(getModuleDir(), 'resources/web/mobile/content') ));
  });
  
  gulp.task('build_mobile', ['make_module.xml', 'copy_files']);
};
