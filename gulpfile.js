var gulp = require('gulp'),
    requireDir = require('require-dir');

requireDir('./build-tasks');

gulp.task('default', ['build_mobile']);
