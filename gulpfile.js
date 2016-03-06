var gulp = require('gulp');
var connect = require('gulp-connect');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var jshint = require('gulp-jshint');
var clean = require('gulp-clean');

gulp.task('connect', function () {
    connect.server({
            base: 'http://localhost',
            port: 9000,
            root: './build',
            livereload: true
    });
});

gulp.task('clean', function () {
    return gulp.src('./build/*', {read: false})
    .pipe(clean());
});

gulp.task('jshint', function () {
    return gulp.src('./src/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('run', function () {
    browserify('main.js')
    .transform(babelify.configure({presets: ['es2015']}))
    .bundle()
    .pipe(source('yoda-player.js'))
    .pipe(gulp.dest('./build'))
    .pipe(connect.reload());
});

gulp.task('watch', function () {
    gulp.watch('./src/**/*.js', ['make']);
    gulp.watch('main.js', ['make']);
});

gulp.task('make', ['jshint', 'clean', 'run'], function () {

});

gulp.task('default', ['make', 'watch'], function () {

});
