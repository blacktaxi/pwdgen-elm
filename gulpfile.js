'use strict'; // eslint-disable-line

var gulp = require('gulp');
var eslint = require('gulp-eslint');
require('gulp-watch');
var runSequence = require('run-sequence');
var connect = require('gulp-connect');
var child_process = require('child_process');
var uglify = require('gulp-uglify');
var del = require('del');

var paths = {
  build: './dist',
  elmSrc: './src',
  elmBuild: './elm-stuff/dist/elm.js',
  staticSrc: './static'
};

function exec_(command, callback) {
  child_process.exec(command, function(err, stdout, stderr) {
    console.log(stdout); // eslint-disable-line no-console
    console.log(stderr); // eslint-disable-line no-console
    callback(err);
  });
}

gulp.task('lint', function() {
  return gulp.src([
    'gulpfile.js',
    '**/*.js',
    '!node_modules/**',
    '!./elm-stuff/**/*',
    '!' + paths.build + '/**/*',
    '!' + paths.elmBuild])

    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('clean', function() {
  return del(['' + paths.build + '/**/*']);
});

gulp.task('build:elm-package-install', function(cb) {
  exec_('npm run elm-package-install', cb);
});

gulp.task('build:elm-make', function(cb) {
  exec_('npm run elm-build', cb);
});

gulp.task('build:elm-copy-and-uglify', function() {
  return gulp.src(paths.elmBuild)
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest(paths.build));
});

gulp.task('build:elm-build', function(cb) {
  runSequence('build:elm-make', 'build:elm-copy-and-uglify', cb);
});

gulp.task('build:elm-copy-output', function() {
  return gulp.src(paths.elmBuild)
    .pipe(gulp.dest(paths.build))
    .pipe(connect.reload());
});

gulp.task('build:elm-dev-build', function(cb) {
  runSequence('build:elm-make', 'build:elm-copy-output', cb);
});

gulp.task('build:elm', function(cb) {
  runSequence('build:elm-package-install', 'build:elm-build', cb);
});

gulp.task('build:static', function() {
  return gulp.src('' + paths.staticSrc + '/**/*')
    .pipe(gulp.dest(paths.build))
    .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch('' + paths.staticSrc + '/**/*', ['build:static']);
  gulp.watch('' + paths.elmSrc + '/**/*', ['build:elm-dev-build']);
});

gulp.task('connect', function() {
  connect.server({
    root: paths.build,
    livereload: true,
    port: 8000
  });
});

gulp.task('build', function(cb) {
  runSequence('clean', ['lint', 'build:elm', 'build:static'], cb);
});

gulp.task('dev', ['connect', 'watch']);
gulp.task('default', ['dev']);
