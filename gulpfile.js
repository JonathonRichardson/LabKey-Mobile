var gulp = require('gulp');

require('./build_tasks/compile_mobile.js').addTasks(gulp);

gulp.task('default', ['build_mobile']);
