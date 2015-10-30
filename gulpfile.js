var gulp = require('gulp');
var gutil = require('gulp-util');
var $ = require('gulp-load-plugins')({lazy: true});
var bower = require('bower');
var sh = require('shelljs');
var _ = require('lodash');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var browserSync = require('browser-sync').create();

var paths = {
    sass: ['./assets/sass/**/*.scss'],
    css: ['./assets/css/**/*.css'],
    js: ['./assets/js/**/*.min.js']
};

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

gulp.task('build', ['inject']);

gulp.task('watch', function () {
    gulp.watch([].concat(paths.sass, paths.js), ['build']);
});

gulp.task('serve', ['build'], function() {

    browserSync.init({
        server: './'
    });

    gulp.watch([].concat(paths.sass, paths.js), ['build']);
    gulp.watch(['./index.html'].concat(paths.js, paths.css)).on('change', browserSync.reload);
});

gulp.task('sass', function (done) {
    gulp.src(paths.sass)
        .pipe($.sass({
            errLogToConsole: true
        }))
        .pipe(gulp.dest('./assets/css/'))
        .pipe($.minifyCss({
            keepSpecialComments: 0
        }))
        .pipe($.rename({extname: '.min.css'}))
        .pipe(gulp.dest('./assets/css/'))
        .on('end', done);
});

gulp.task('imagemin', function () {
    return gulp.src('./images/**/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('./images/'));
});

gulp.task('install', ['git-check'], function () {
    return bower.commands.install()
        .on('log', function (data) {
            gutil.log('bower', gutil.colors.cyan(data.id), data.message);
        });
});

gulp.task('git-check', function (done) {
    if (!sh.which('git')) {
        console.log(
            '  ' + gutil.colors.red('Git is not installed.'),
            '\n  Git, the version control system, is required to download Ionic.',
            '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
            '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
        );
        process.exit(1);
    }
    done();
});

gulp.task('inject', ['sass'], function () {
    return gulp
        .src('./index.html')
        .pipe(inject(paths.js,
            '',
            {
                read: false,
                relative: true
            },
            [
                'assets/lib/jquery.min.js',
                '**/*.js',
                '**/main.min.js'
            ]
        ))
        .pipe(inject('./assets/css/**/*.min.css', '', {read: false, relative: true}))
        .pipe(gulp.dest('./'));
});

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Object} options The options for injection
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, options, order) {
    if (label) {
        options.name = 'inject:' + label;
    }

    return $.inject(orderSrc(src, order), options);
}

/**
 * Order a stream
 * @param   {Stream} src   The gulp.src stream
 * @param   {Array} order Glob array pattern
 * @returns {Stream} The ordered stream
 */
function orderSrc(src, order) {
    return gulp
        .src(src)
        .pipe($.if(order, $.order(order)));
}
