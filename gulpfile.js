var gulp = require('gulp'),
    requireDir = require('require-dir');

requireDir('./build_tasks');

gulp.task('default', ['build_mobile']);
