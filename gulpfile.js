'use strict';

var gulp = require('gulp'),
  modRewrite = require('connect-modrewrite'),
  BannerPlugin = require('gulp-webpack/node_modules/webpack/lib/BannerPlugin'),

  meta = require('./package.json'),
  languages = require('./l10n/languages.json').active,
  languageCodes = languages.map(function(i) { return i.code; }).join(' ');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'del', 'browser-sync']
});

var buildDirPath = 'build';

// Clean the build folder
gulp.task('clean:dev', function () {
  $.del.sync([buildDirPath + '/dev/*']);
});

gulp.task('clean:dist', function () {
  $.del.sync([buildDirPath + '/dist/*']);
});

gulp.task('bower', function() {
  return $.bower();
});

// Webpack
gulp.task('webpack:dev', function() {
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
      debug: true,
      devtool: 'eval'
    }))
    .pipe(gulp.dest(buildDirPath + '/dev/js/'))
    .pipe($.browserSync.reload({stream:true}));
});

gulp.task('webpack:dist', function() {
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
      plugins: [
        new BannerPlugin('Ripple Client v' + meta.version + '\nCopyright (c) ' + new Date().getFullYear() + ' ' + meta.author.name + '\nLicensed under the ' + meta.license + ' license.')
      ],
      debug: false
    }))
    .pipe(gulp.dest(buildDirPath + '/dist/js/'));
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

gulp.task('images', function () {
  return gulp.src('img/**/*')
    .pipe($.imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(buildDirPath + '/dist/img/'));
});

// Static server
gulp.task('serve:dev', function() {
  $.browserSync({
    server: {
      baseDir: [".", buildDirPath + "/dev", buildDirPath, buildDirPath + "/dist", "./res", "./deps/js"],
      middleware: [
        modRewrite([
          '!\\.html|\\.js|\\.css|\\.png|\\.jpg|\\.gif|\\.svg|\\.txt|\\.eot|\\.woff|\\.woff2|\\.ttf$ /index.html [L]'
        ])
      ]
    }
  });
});

gulp.task('serve:dist', function() {
  $.browserSync({
    server: {
      baseDir: [buildDirPath + "/dist"],
      middleware: [
        modRewrite([
          '!\\.html|\\.js|\\.css|\\.png|\\.jpg|\\.gif|\\.svg|\\.txt|\\.eot|\\.woff|\\.woff2|\\.ttf$ /index.html [L]'
        ])
      ]
    }
  });
});

// Fonts
gulp.task('fonts', function() {
  return gulp.src(['res/fonts/**/*'])
    .pipe(gulp.dest(buildDirPath + '/dist/fonts/'));
});

// Ripple.txt
gulp.task('static', function() {
  return gulp.src(['ripple.txt', 'deps/js/mixpanel.js'])
    .pipe(gulp.dest(buildDirPath + '/dist/'));
});

// Version branch
gulp.task('gitVersion', function (cb) {
  require('child_process').exec('git rev-parse --abbrev-ref HEAD', function(err, stdout) {
    meta.gitVersionBranch = stdout;

    require('child_process').exec('git describe --tags --always --dirty', function(err, stdout) {
      meta.gitVersion = stdout;

      cb(err)
    })
  })
});

// Preprocess
gulp.task('preprocess:dev', ['gitVersion'], function() {
  gulp.src('src/index.html')
    .pipe($.preprocess({
      context: {
        MODE: 'dev',
        VERSION: meta.gitVersion,
        VERSIONBRANCH: meta.gitVersionBranch,
        LANGUAGES: languageCodes
      }
    }))
    .pipe(gulp.dest(buildDirPath + '/dev/'))
    .pipe($.browserSync.reload({stream:true}))
});

gulp.task('preprocess:dist', ['gitVersion'], function() {
  gulp.src('src/index.html')
    .pipe($.preprocess({
      context: {
        MODE: 'dist',
        VERSION: meta.gitVersion,
        VERSIONBRANCH: meta.gitVersionBranch,
        LANGUAGES: languageCodes
      }
    }))
    .pipe(gulp.dest(buildDirPath + '/dist/'))
});

// Default Task (Dev environment)
gulp.task('default', ['dev', 'serve:dev'], function() {
  // Webpack
  gulp.watch(['src/js/**/*.js', 'src/jade/**/*.jade'], ['webpack:dev']);

  // Htmls
  gulp.watch('src/*.html', ['preprocess:dev']);

  // TODO Config

  gulp.watch('src/less/**/*', ['less']);
});

// Development
gulp.task('dev', ['clean:dev', 'bower', 'webpack:dev', 'less', 'preprocess:dev']);

// Distribution
gulp.task('dist', ['clean:dist', 'dev', 'webpack:dist', 'preprocess:dist', 'static', 'fonts', 'images'], function () {
  var assets = $.useref.assets();

  return gulp.src([buildDirPath + '/dist/index.html'])
    // Concatenates asset files from the build blocks inside the HTML
    .pipe(assets)
    // Appends hash to extracted files app.css → app-098f6bcd.css
    .pipe($.rev())
    // Adds AngularJS dependency injection annotations
    .pipe($.if('*.js', $.ngAnnotate()))
    // Uglifies js files
    .pipe($.if('*.js', $.uglify()))
    // Minifies css files
    .pipe($.if('*.css', $.csso()))
    // Brings back the previously filtered HTML files
    .pipe(assets.restore())
    // Parses build blocks in html to replace references to non-optimized scripts or stylesheets
    .pipe($.useref())
    // Rewrites occurences of filenames which have been renamed by rev
    .pipe($.revReplace())
    // Minifies html
    .pipe($.if('*.html', $.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    })))
    // Creates the actual files
    .pipe(gulp.dest(buildDirPath + '/dist/'))
    // Print the file sizes
    .pipe($.size({ title: buildDirPath + '/dist/', showFiles: true }));
});