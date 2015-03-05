var path = require('path'),
    fs = require('fs'),
    languages = require('./l10n/languages.json').active;

var languageCodes = languages.map(function(i) { return i.code; }).join(' ');

var BannerPlugin = require('webpack/lib/BannerPlugin');

module.exports = function(grunt) {
  // grunt.loadTasks('scripts/grunt');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-jade-l10n-extractor');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-webfont');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-lesslint');
  grunt.loadNpmTasks('grunt-jscs');

  // Ripple client dependencies
  var deps = ['deps/js/jquery/dist/jquery.js',
              'deps/js/authy.js',
              'deps/js/swfobject.js',
              'deps/js/setImmediate.js',
              'deps/js/underscore/underscore.js',
              'deps/js/downloadify.js',
              'deps/js/angular/angular.js',
              'deps/js/angular-route/angular-route.js',
              'deps/js/angular-messages/angular-messages.js',
              'deps/js/store.js/store.js',
              'deps/js/d3/d3.js',
              'deps/js/ripple/ripple-debug.js',
              'deps/js/ripple-sjcl.js',
              'deps/js/moment/moment.js',
              'deps/js/ripple-vault-client/ripple-vault-client-debug.js',
              'deps/js/bootstrap-modal.js',
              'deps/js/bootstrap-tooltip.js',
              'deps/js/bootstrap-popover.js',
              'deps/js/angular-bootstrap/ui-bootstrap-tpls.js',
              'deps/js/bootstrap-datepicker.js',
              'deps/js/spin.js/spin.js',
              'deps/js/snapjs/snap.js',
              'deps/js/ng-sortable/dist/ng-sortable.js',
              'deps/js/charts/pricechart.js'];

  var compatIE = ['compat/ie/base64/base64.js',
                  'compat/ie/ws/web_socket.js',
                  'compat/ie/ws/config.js',
                  'compat/ie/xdr/xdr.js'];

  var compatNW = ['compat/nw/setImmediate/setImmediate.js'];

  /**
   * Returns true if the source is newer than the destination.
   */
  var isNewer = function (src, dest) {
    if (!fs.existsSync(dest)) {
      return true;
    }
    var fromstat = fs.statSync(src);
    var tostat = fs.statSync(dest);
    return fromstat.mtime > tostat.mtime;
  };

  /**
   * Where there are many files that compile to one, this returns true
   * if any of the input files are newer than the output.
   */
  var manyToOne = function (dest, src) {
    var compile = true;
    if (fs.existsSync(dest)) {
      var from = grunt.file.expand(src);
      var tostat = fs.statSync(dest);
      compile = false;
      for (var i = from.length - 1; i >= 0; i--) {
        if (fs.statSync(from[i]).mtime > tostat.mtime) {
          compile = true;
          break;
        }
      }
    }
    return [{dest:dest, src:compile ? src : []}];
  };

  /**
   * Add a prefix to a filename or array of filenames.
   */
  var prefix = function (pre, f) {
    if (Array.isArray(f)) {
      return f.map(prefix.bind(this, pre));
    } else if ('string' === typeof f) {
      return pre + f;
    } else {
      return f;
    }
  };

  grunt.registerTask('version', 'Describes current git commit', function (prop) {
    var done = this.async();

    grunt.log.write('Version: ');

    grunt.util.spawn({
      cmd:  'git',
      args: ['describe', '--tags', '--always', '--dirty']
    }, function (err, result) {
      if (err) {
        grunt.config(prop || 'meta.version', 'unknown');
        grunt.log.writeln('Unable to determine version, continuing'.red);
        return done();
      }

      grunt.config(prop || 'meta.version', result.stdout);

      grunt.log.writeln(result.stdout.green);

      done(result);
    });
  });

  grunt.registerTask('versionBranch', 'Describes current git branch', function (prop) {
    var done = this.async();

    grunt.log.write('Branch: ');

    grunt.util.spawn({
      cmd:  'git',
      args: ['rev-parse', '--abbrev-ref', 'HEAD']
    }, function (err, result) {
      if (err) {
        grunt.config(prop || 'meta.versionBranch', 'unknown');
        grunt.log.writeln('Unable to determine branch, continuing'.red);
        return done();
      }

      grunt.config(prop || 'meta.versionBranch', result.stdout);

      grunt.log.writeln(result.stdout.green);

      done(result);
    });
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {},
    shell: {
      options: {
        stdout: true,
        failOnError: true
      },
      startdevserver: {
        command:
          process.platform === 'darwin' ? 'sudo node ./scripts/web-server.js'
                                        : 'node ./scripts/web-server.js'
      },
    },
    recess: {
      web: {
        src: ['src/less/ripple/web.less'],
        dest: 'build/dist/ripple.css',
        options: {
          compile: true
        }
      }
    },
    concat: {
      deps: {
        src: prefix('build/', deps),
        dest: 'build/dist/deps.js',
        separator: ';'
      },
      depsDebug: {
        src: deps,
        dest: 'build/dist/deps-debug.js',
        separator: ';'
      },
      compatIE: {
        src: prefix('build/', compatIE),
        dest: 'build/dist/compat_ie.js'
      },
      compatIEDebug: {
        src: compatIE,
        dest: 'build/dist/compat_ie-debug.js'
      },
      compatNW: {
        src: prefix('build/', compatNW),
        dest: 'build/dist/compat_nw.js'
      },
      compatNWDebug: {
        src: compatNW,
        dest: 'build/dist/compat_nw-debug.js'
      }
    },
    uglify: {
      // JavaScript dependencies
      deps: {
        expand: true,
        src: deps,
        dest: 'build/',
        filter: function (from) {
          return isNewer(from, 'build/' + from);
        }
      },
      individualDeps: {
        expand: false,
        files: {
          'build/bundle/web/js/deps/mixpanel.js': 'deps/js/mixpanel.js',
          'build/bundle/web/js/deps/modernizr.js': 'deps/js/modernizr.js'
        }
      },
      compatIE: {
        expand: true,
        src: compatIE,
        dest: 'build/',
        filter: function (from) {
          return isNewer(from, 'build/' + from);
        }
      },
      compatNW: {
        expand: true,
        src: compatNW,
        dest: 'build/',
        filter: function (from) {
          return isNewer(from, 'build/' + from);
        }
      }
    },
    preprocess: {
      web: {
        src: 'src/index.html',
        dest: 'build/dist/web/index.html',
        options: {
          context: {
            MODE: 'release',
            TARGET: 'web',
            VERSION: '<%= meta.version %>',
            VERSIONBRANCH: '<%= meta.versionBranch %>',
            LANGUAGES: languageCodes
          }
        }
      },
      webDebug: {
        src: 'src/index.html',
        dest: 'build/dist/web/index_debug.html',
        options: {
          context: {
            MODE: 'debug',
            TARGET: 'web',
            VERSION: '<%= meta.version %>',
            VERSIONBRANCH: '<%= meta.versionBranch %>',
            LANGUAGES: languageCodes
          }
        }
      }
    },
    webfont: {
      icons: {
        options: {
          engine: 'fontforge',
          stylesheet: 'less',
          classPrefix: 'icon-',
          mixinPrefix: 'icon-',
          relativeFontPath: '../res/icons/font',
          syntax: 'bootstrap',
          htmlDemo: false
        },
        src: 'res/icons/svg/*.svg',
        dest: 'res/icons/font/'
      }
    },
    copy: {
      // TODO clear destination folders before copying
      web: {
        files: [
          {expand: true, src: ['build/dist/*.js'],
            dest: 'build/bundle/web/js', flatten: true},
          {expand: true, src: ['build/dist/web/*.js'],
            dest: 'build/bundle/web/js', flatten: true},
          {expand: true, src: ['build/dist/*.css'],
            dest: 'build/bundle/web/css', flatten: true},
          {expand: true, src: ['res/fonts/*'], dest: 'build/bundle/web/fonts', flatten: true},
          {expand: true, src: ['res/icons/font/*'], dest: 'build/bundle/web'},
          {expand: true, src: ['img/**'], dest: 'build/bundle/web'},
          {src: 'build/dist/web/index.html', dest: 'build/bundle/web/index.html'},
          {src: 'build/dist/web/index_debug.html', dest: 'build/bundle/web/index_debug.html'},
          {src: 'src/js/config.js', dest: 'build/bundle/web/config.js'},
          {src: 'scripts/livereload.js', dest: 'build/bundle/web/livereload.js'},
          {src: 'deps/downloadify.swf', dest: 'build/bundle/web/swf/downloadify.swf' },
          {src: 'ripple.txt', dest: 'build/bundle/web/ripple.txt' },
          {src: 'src/callback.html', dest: 'build/bundle/web/callback.html'}
        ]
      }
    },
    cssmin: {
      options: {
        rebase: false
      },
      target: {
        files: [{
          'build/dist/ripple.min.css': 'build/dist/ripple.css',
          'res/fonts/stylesheet.min.css': 'res/fonts/stylesheet.css'
        }]
      }
    },
    imagemin: {
      // note, this is done after 'copy' task so as not to rewrite the original img files
      dynamic: {
        files: [{
          expand: true,
          cwd: 'build/bundle/web/img/',
          src: ['**/*.{png,svg,gif}'],
          dest: 'build/bundle/web/img/'
        }]
      }
    },
    jade_l10n_extractor: {
      templates: {
        options: {
        },
        files: [
          { src: ['src/jade/**/*.jade'], dest: 'l10n/templates/messages.pot' }
        ]
      }
    },
    watch: {
      livereload: {
        files: ['build/css/**/*.css'],
        tasks: [],
        options: { livereload: true }
      },
      scriptsDebug: {
        files: ['src/js/**/*.js', 'src/jade/**/*.jade'],
        tasks: ['version', 'versionBranch', 'webpack:webDebug', 'copy'],
        options: { spawn: false, livereload: true }
      },
      deps: {
        files: deps,
        tasks: ['version', 'versionBranch', 'uglify:deps', 'uglify:individualDeps', 'concat:depsDebug', 'copy'],
        options: { livereload: true }
      },
      styles: {
        files: 'src/less/**/*.less',
        tasks: ['version', 'versionBranch', 'recess', 'cssmin', 'copy'],
        options: { livereload: true }
      },
      index: {
        files: ['src/index.html'],
        tasks: ['version', 'versionBranch', 'preprocess:webDebug', 'copy'],
        options: { livereload: true }
      },
      callback: {
        files: ['src/callback.html'],
        tasks: ['copy']
      },
      config: {
        files: ['src/js/config.js'],
        options: { livereload: true }
      },
      txt: {
        files: ['ripple.txt'],
        tasks: ['copy'],
        options: { livereload: true }
      }
    },
    connect: {
      debug: {
        options: {
          hostname: 'localhost',
          port: 8005,
          base: '.',
          open: false,
          middleware: function(connect, options) {
            return [
              connect.static(options.base)
            ];
          }
        }
      },
      sauce: {
        options: {
          hostname: 'localhost',
          port: 9001,
          base: 'build/bundle/web',
          keepalive: true
        }
      }
    },
    bower: {
      install: {
        options: {
          targetDir: './deps/js'
        }
      }
    },
    lesslint: {
      options: {
        imports: ['src/less/ripple/*.less'],
        csslint: {
          ids: false,
          'adjoining-classes': false,
          'known-properties': false
        }
      },
      src: ['src/less/ripple/web.less']
    }
  });

  // Webpack
  var webpack = {
    options: {
      module: {
        preLoaders: [
          {
            test: /\.js$/,
            include: pathToRegExp(path.join(__dirname, 'src', 'js')),
            loader: 'jshint-loader'
          }
        ]
      },
      output: {
        path: 'build/dist/'
      },
      cache: true,
      jshint: {
        validthis: true,
        laxcomma:  true,
        laxbreak:  true,
        browser:   true,
        eqnull:    true,
        debug:     true,
        devel:     true,
        boss:      true,
        expr:      true,
        asi:       true,
        sub:       true,
        jquery:    true,
        predef: [
          '_',
          'angular',
          'Options',
          'ripple',
          'setImmediate',
          'store',
          'rippleVaultClient'
        ]
      },
      plugins: [
        new BannerPlugin('Ripple Client v<%= meta.version %>\nCopyright (c) <%= grunt.template.today(\'yyyy\') %> <%= pkg.author.name %>\nLicensed under the <%= pkg.license %> license.')
      ]
    },
    webDebug: {
      entry: {
        web: './src/js/entry/web.js'
      },
      module: {
        loaders: [
          { test: /\.jade$/, loader: 'jade-l10n-loader' },
          { test: /\.json$/, loader: 'json-loader' }
        ]
      },
      output: {
        filename: 'web/<%= pkg.name %>-<%= meta.version %>-debug.js'
      },
      debug: true,
      devtool: 'eval',
      cache: false
    }
  };

  languages.forEach(function(language){
    webpack['webL10n-' + language.name] = {
      entry: {
        web: './src/js/entry/web.js'
      },
      module: {
        loaders: [
          { test: /\.jade$/, loader: 'jade-l10n-loader?languageFile=./l10n/' + language.code + '/messages.po' },
          { test: /\.json$/, loader: 'json-loader' }
        ]
      },
      output: {
        filename: 'web/<%= pkg.name %>-<%= meta.version %>-' + language.code + '.js'
      },
      optimize: {
        // TODO Minimization breaks our l10n mechanisms
//        minimize: true
      }
    };
  });

  grunt.config.set('webpack', webpack);

  // Tasks
  // -----

  // Default - builds the web version of the client
  grunt.registerTask('default', ['bower:install',
                                 'version',
                                 'versionBranch',
                                 'preprocess',
                                 'webpack',
                                 'recess',
                                 'cssmin',
                                 'deps',
                                 'copy',
                                 'imagemin']);

  // Dev - builds the web version of the client excluding any locales
  // Be sure to use English version for testing
  grunt.registerTask('dev', ['bower:install',
                             'version',
                             'versionBranch',
                             'preprocess',
                             'webpack:webDebug',
                             'webpack:webL10n-english',
                             'recess',
                             'cssmin',
                             'deps',
                             'copy']);

  // Deps only - only rebuilds the dependencies
  grunt.registerTask('deps', ['uglify:deps', 'uglify:individualDeps',
                              'concat:deps', 'concat:depsDebug',
                              'uglify:compatIE',
                              'concat:compatIE', 'concat:compatIEDebug',
                              'uglify:compatNW',
                              'concat:compatNW', 'concat:compatNWDebug']);

  // Node.js server to serve built files
  grunt.registerTask('devserver', ['shell:startdevserver']);

  // Start server with auto-recompilation
  grunt.registerTask('serve', ['connect:debug', 'watch']);
};

// Helpers
function escapeRegExpString(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'); }
function pathToRegExp(p) { return new RegExp('^' + escapeRegExpString(p)); }
