var gulp = require('gulp');
var connect = require('gulp-connect');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');

gulp.task('connect', function () {
    connect.server({
            base: 'http://localhost',
            port: 9000,
            root: './build',
            livereload: true
    });
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
    gulp.watch('./src/**/*.js', ['run']);
    gulp.watch('main.js', ['run']);
});

gulp.task('default', ['run', 'watch'], function () {

});
