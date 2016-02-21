'use strict';

import gulp from 'gulp';
import eslint from 'gulp-eslint';
import 'gulp-watch';
import runSequence from 'run-sequence';
import connect from 'gulp-connect';
import child_process from 'child_process';
import uglify from 'gulp-uglify';
import del from 'del';

const paths = {
  build: './dist',
  elmSrc: './src',
  elmBuild: './elm-stuff/dist/elm.js',
  staticSrc: './static'
};

function exec_(command, callback) {
  child_process.exec(command, (err, stdout, stderr) => {
    console.log(stdout); // eslint-disable-line no-console
    console.log(stderr); // eslint-disable-line no-console
    callback(err);
  });
}

gulp.task('lint', () => {
  return gulp.src([
    '**/*.js',
    '!node_modules/**',
    `!${paths.elmSrc}/elm-stuff/**`,
    `!${paths.build}/**`,
    `!${paths.elmBuild}`])

    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('clean', () => del([`${paths.build}/**/*`]));

gulp.task('build:elm-package-install', (cb) => {
  exec_(`npm run elm-package-install`, cb);
});

gulp.task('build:elm-make', (cb) => {
  exec_(`npm run elm-build`, cb);
});

gulp.task('build:elm-copy-and-uglify', () => {
  return gulp.src(paths.elmBuild)
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest(paths.build));
});

gulp.task('build:elm-build', (cb) => {
  runSequence('build:elm-make', 'build:elm-copy-and-uglify', cb);
});

gulp.task('build:elm-copy-output', () => {
  return gulp.src(paths.elmBuild)
    .pipe(gulp.dest(paths.build))
    .pipe(connect.reload());
});

gulp.task('build:elm-dev-build', (cb) => {
  runSequence('build:elm-make', 'build:elm-copy-output', cb);
});

gulp.task('build:elm', (cb) => {
  runSequence('build:elm-package-install', 'build:elm-build', cb);
});

gulp.task('build:static', () => {
  return gulp.src(`${paths.staticSrc}/**/*`)
    .pipe(gulp.dest(paths.build))
    .pipe(connect.reload());
});

gulp.task('watch', () => {
  gulp.watch(`${paths.staticSrc}/**/*`, ['build:static']);
  gulp.watch(`${paths.elmSrc}/**/*`, ['build:elm-dev-build']);
});

gulp.task('connect', () => {
  connect.server({
    root: paths.build,
    livereload: true,
    port: 8000
  });
});

gulp.task('build', (cb) => {
  runSequence('clean', ['build:elm', 'build:static'], cb);
});

gulp.task('dev', ['connect', 'watch']);
gulp.task('default', ['dev']);
