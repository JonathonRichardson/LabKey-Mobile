var gulp       = require('gulp'),
    requireDir = require('require-dir'),
    path       = require('path');

exports.addTasks = require( path.join( __dirname, 'build_tasks', 'compile_mobile') ).addTasks;
