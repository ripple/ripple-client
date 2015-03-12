'use strict';

var gulp = require('gulp');
var modRewrite = require('connect-modrewrite');
var BannerPlugin = require('webpack/lib/BannerPlugin');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'del', 'browser-sync']
});

var buildDirPath = 'buildGulp';

// Clean the build folder
gulp.task('clean', function () {
  $.del([buildDirPath + '/dev/*', buildDirPath + '/dist/*']);
});

gulp.task('bower', function() {
  return $.bower();
});

// Webpack
gulp.task('webpack', function() {
  // TODO jshint
  // TODO move to js/entry.js
  // TODO prod and languages
  return gulp.src('src/js/entry/web.js')
    .pipe($.webpack({
      module: {
        loaders: [
          { test: /\.jade$/, loader: "jade-loader" },
          { test: /\.json$/, loader: "json-loader" }
        ]
      },
      output: {
        filename: "app.js"
      },
      cache: true,
      plugins: [
        //new BannerPlugin('Ripple Client v<%= meta.version %>\nCopyright (c) <%= grunt.template.today(\'yyyy\') %> <%= pkg.author.name %>\nLicensed under the <%= pkg.license %> license.')
      ],
      debug: true,
      devtool: 'eval'
    }))
    .pipe(gulp.dest(buildDirPath + '/dev/js/'))
    .pipe($.browserSync.reload({stream:true}));
});

// Html
gulp.task('html', function() {
  return gulp.src('src/index.html')
    .pipe(gulp.dest(buildDirPath + '/dev'))
    .pipe($.browserSync.reload({stream:true}))
});

// TODO SASS
// Less
gulp.task('less', function () {
  return gulp.src('src/less/ripple/web.less')
    .pipe($.less({
      paths: ['src/less']
    }))
    .pipe(gulp.dest(buildDirPath + '/dev/css'))
    .pipe($.browserSync.reload({stream:true}));
});

// Images
// TODO images:prod
gulp.task('images:dev', function () {
  return gulp.src('img/**/*')
    .pipe(gulp.dest(buildDirPath + '/dev/img/'))
    .pipe($.browserSync.reload({stream:true}));
});

// Static server
gulp.task('serve:dev', function() {
  $.browserSync({
    server: {
      baseDir: [".", buildDirPath + "/dev"],
      middleware: [
        modRewrite([
          '!\\.html|\\.js|\\.css|\\.png|\\.jpg|\\.gif|\\.svg|\\.txt|\\.eot|\\.woff|\\.woff2|\\.ttf$ /index.html [L]'
        ])
      ]
    }
  });
});

// TODO e2e tests

// Config
// TODO load using webpack
gulp.task('config', function () {
  return gulp.src('config.js')
    .pipe(gulp.dest(buildDirPath + '/dev'))
    .pipe($.browserSync.reload({stream:true}));
});

// Dependencies
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  return gulp.src('src/index.html')
    .pipe(wiredep({
      directory: 'deps'
    }))
    .pipe(gulp.dest('src'));
});

// Default Task (Dev environment)
gulp.task('default', ['clean', 'dev', 'serve:dev'], function() {
  // Webpack
  gulp.watch(['src/js/**/*.js', 'src/jade/**/*.jade'], ['webpack']);

  // Htmls
  gulp.watch('src/*.html', ['html']);

  // Config
  gulp.watch('config.js', ['config']);

  // TODO watch on config

  gulp.watch('src/less/**/*', ['less']);

  // Images
  gulp.watch('img/**/*', ['images:dev']);
});

// Development
gulp.task('dev', ['bower', 'webpack', 'less', 'html', 'images:dev', 'config']);

// Distribution
gulp.task('dist', [], function () {
});