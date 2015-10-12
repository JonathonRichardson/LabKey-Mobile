var gulp     = require('gulp'),
    bump     = require('gulp-bump'),
    uuid     = require('node-uuid'),
    rename   = require('gulp-rename'),
    replace  = require('gulp-replace'),
    jsonfile = require('jsonfile'),
    _        = require('underscore'),
    fs       = require('fs');

gulp.task('bump', function() {
  return gulp.src(['package.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

gulp.task('clean', function(cb()) {
  del(['deploy']);
  fs.mkdirSync('deploy');
  cb();
});

gulp.task('init', ['clean', 'bump']);

gulp.task('make_module.xml', ['init'], function() {
  var props = jsonfile.readFileSync('config/module.properties.json');
  var stream = gulp.src(['template_files/module.template.xml'])
   
  // Generate an EnlistmentId
  props.EnlistmentId = uuid.v4();

  // Replace all of the keys in the configuration
  _.each(props, function(value, key) {
    stream = stream.pipe(replace('@@' + key + '@@', props[key]));
  });

  // Rename the file and write it out
  stream.pipe(rename('module.xml')).pipe(gulp.dest('./deploy/config'));
});

gulp.task('copy_files', ['init'], function() {
  return gulp.src(['module_files/**'])
    .pipe(gulp.dest('./deploy');
});


gulp.task('default', ['copy_files', 'make_module.xml']);
