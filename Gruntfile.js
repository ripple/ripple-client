var path = require("path"),
    fs = require("fs");

var BannerPlugin = require("webpack/lib/BannerPlugin");

module.exports = function(grunt) {
  grunt.loadTasks('scripts/grunt');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-preprocess');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-concurrent');

  // Ripple client dependencies
  var deps = ["deps/js/jquery.js",
              "deps/js/swfobject.js",
              "deps/js/jquery.easing.js",
              "deps/js/json.js",
              "deps/js/setImmediate.js",
              "deps/js/psm.js",
              "deps/js/underscore.js",
              "deps/js/downloadify.js",
              "deps/js/angular.js",
              "deps/js/store.js",
              "deps/js/ripple.js",
              "deps/js/ripple-sjcl.js",
              "deps/js/moment.js",
              "deps/js/bootstrap-modal.js",
              "deps/js/bootstrap-tooltip.js",
              "deps/js/bootstrap-popover.js",
              "deps/js/bootstrap-datepicker.js",
              "deps/js/jquery.qrcode.min.js",
              "deps/js/spin.js",
              "deps/js/snap.js"];

  var deps_ie = ["compat/ie/base64/base64.js",
                 "compat/ie/ws/web_socket.js",
                 "compat/ie/ws/config.js",
                 "compat/ie/xdr/xdr.js"];

  /**
   * Returns true if the source is newer than the destination.
   */
  var isNewer = function (src,dest) {
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
    return [{dest:dest, src:compile?src:[]}];
  };

  grunt.registerTask("version", "Describes current git commit", function (prop) {
    var done = this.async();

    grunt.log.write("Version: ");

    grunt.util.spawn({
      cmd : "git",
      args : [ "describe", "--tags", "--always", "--dirty" ]
    }, function (err, result) {
      if (err) {
        grunt.log.error(err);
        return done(false);
      }

      grunt.config(prop || "meta.version", result.stdout);

      grunt.log.writeln(result.stdout.green);

      done(result);
    });
  });

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {},
    recess: {
      web: {
        src: ['src/less/ripple/web.less'],
        dest: 'build/dist/ripple-web.css',
        options: {
          compile: true
        }
      },
      desktop: {
        src: ['src/less/ripple/desktop.less'],
        dest: 'build/dist/ripple-desktop.css',
        options: {
          compile: true
        }
      }
    },
    webpack: {
      options: {
        entry: "./src/js/entry/desktop.js",
        module: {
          loaders: [
            { test: /\.jade$/, loader: "jade-loader" }
          ],
          preLoaders: [
            {
              test: /\.js$/,
              include: pathToRegExp(path.join(__dirname, 'src', 'js')),
              loader: "jshint-loader"
            }
          ]
        },
        output: {
          path: "build/dist/"
        },
        cache: true,
        jshint: {
          "validthis": true,
          "laxcomma" : true,
          "laxbreak" : true,
          "browser"  : true,
          "eqnull"   : true,
          "debug"    : true,
          "devel"    : true,
          "boss"     : true,
          "expr"     : true,
          "asi"      : true,
          "sub"      : true
        },
        plugins: [
          new BannerPlugin("Ripple Client v<%= meta.version %>\nCopyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>\nLicensed under the <%= pkg.license %> license.")
        ]
      },
      desktop: {
        output: {
          filename: "<%= pkg.name %>-desktop.js"
        },
        optimize: {
          minimize: true
        }
      },
      desktop_debug: {
        output: {
          filename: "<%= pkg.name %>-desktop-debug.js"
        },
        debug: true,
        devtool: 'eval'
      }
    },
    concat: {
      deps: {
        src: deps,
        cwd: 'build/',
        dest: 'build/dist/deps.js',
        separator: ';'
      },
      deps_ie: {
        src: deps_ie,
        cwd: 'build/',
        dest: 'build/dist/deps_ie.js'
      },
      deps_debug: {
        src: deps,
        dest: 'build/dist/deps-debug.js',
        separator: ';'
      },
      deps_ie_debug: {
        src: deps_ie,
        dest: 'build/dist/deps_ie-debug.js'
      }
    },
    uglify: {
      // JavaScript dependencies
      deps: {
        expand: true,
        src: deps,
        dest: "build/",
        filter: function (from) {
          return isNewer(from, "build/"+from);
        }
      },
      deps_ie: {
        expand: true,
        src: deps_ie,
        dest: "build/",
        filter: function (from) {
          return isNewer(from, "build/"+from);
        }
      }
    },
    preprocess: {
      web: {
        src: 'index.html',
        dest: 'build/dist/index.html',
        options: {
          context: {
            MODE_RELEASE: true,
            TARGET_WEB: true,
            VERSION: "<%= meta.version %>"
          }
        }
      },
      web_debug: {
        src: 'index.html',
        dest: 'build/dist/index_debug.html',
        options: {
          context: {
            MODE_DEBUG: true,
            TARGET_WEB: true,
            VERSION: "<%= meta.version %>"
          }
        }
      },
      desktop: {
        src: 'index.html',
        dest: 'build/dist/index_desktop.html',
        options: {
          context: {
            MODE_RELEASE: true,
            TARGET_DESKTOP: true,
            VERSION: "<%= meta.version %>"
          }
        }
      },
      desktop_debug: {
        src: 'index.html',
        dest: 'build/dist/index_desktop_debug.html',
        options: {
          context: {
            MODE_DEBUG: true,
            TARGET_DESKTOP: true,
            VERSION: "<%= meta.version %>"
          }
        }
      }
    },
    copy: {
      web: {
        files: [
          {expand: true, src: ['build/dist/*.js'], dest: 'build/bundle/web'},
          {expand: true, src: ['build/dist/*.css'], dest: 'build/bundle/web'},
          {expand: true, src: ['build/dist/*.html'], dest: 'build/bundle/web', flatten: true},
          {expand: true, src: ['fonts/*'], dest: 'build/bundle/web'},
          {expand: true, src: ['img/*'], dest: 'build/bundle/web'},
          {expand: true, src: ['deps/js/modernizr*.js'], dest: 'build/bundle/web'},
          {expand: true, src: ['deps/js/mixpanel.js'], dest: 'build/bundle/web'},
          {src: 'config-example.js', dest: 'build/bundle/web/config-example.js'}
        ]
      },
      nw_linux: {
        files: [
          {expand: true, src: ['build/dist/*.js'], dest: 'build/bundle/nw-linux'},
          {expand: true, src: ['build/dist/*.css'], dest: 'build/bundle/nw-linux'},
          {expand: true, src: ['fonts/*'], dest: 'build/bundle/nw-linux'},
          {expand: true, src: ['img/*'], dest: 'build/bundle/nw-linux'},
          {expand: true, src: ['deps/js/modernizr*.js'], dest: 'build/bundle/nw-linux'},
          {expand: true, src: ['deps/js/mixpanel.js'], dest: 'build/bundle/nw-linux'},
          {src: 'build/dist/index_desktop.html', dest: 'build/bundle/nw-linux/index.html'},
          {src: 'res/nw/package_linux.json', dest: 'build/bundle/nw-linux/package.json'},
          {src: 'config-example.js', dest: 'build/bundle/nw-linux/config-example.js'}
        ]
      },
      nw_linux_debug: {
        files: [
          {expand: true, src: ['build/dist/*.js'], dest: 'build/bundle/nw-linux-debug'},
          {expand: true, src: ['build/dist/*.css'], dest: 'build/bundle/nw-linux-debug'},
          {expand: true, src: ['fonts/*'], dest: 'build/bundle/nw-linux-debug'},
          {expand: true, src: ['img/*'], dest: 'build/bundle/nw-linux-debug'},
          {expand: true, src: ['deps/js/modernizr*.js'], dest: 'build/bundle/nw-linux-debug'},
          {expand: true, src: ['deps/js/mixpanel.js'], dest: 'build/bundle/nw-linux-debug'},
          {src: 'build/dist/index_desktop_debug.html', dest: 'build/bundle/nw-linux-debug/index.html'},
          {src: 'res/nw/package_linux_debug.json', dest: 'build/bundle/nw-linux-debug/package.json'},
          {src: 'config-example.js', dest: 'build/bundle/nw-linux-debug/config-example.js'}
        ]
      }
    },
    l10n: {
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
      scripts_debug: {
        files: ['src/js/**/*.js', 'src/jade/**/*.jade'],
        tasks: ['webpack:desktop_debug'],
        options: { nospawn: true, livereload: true }
      },
      deps: {
        files: ['<%= concat.deps.src %>'],
        tasks: ['concat:deps_debug'],
        options: { livereload: true }
      },
      styles: {
        files: 'src/less/**/*.less',
        tasks: 'recess',
        options: { livereload:true }
      },
      index: {
        files: ['index.html'],
        tasks: ['preprocess'],
        options: { livereload:true }
      },
      config: {
        files: ['config.js'],
        options: { livereload:true }
      }
    },
    connect: {
      dev: {
        options: {
          hostname: 'localhost',
          port: 8005,
          base: '.',
          open: false,
          keepalive: true,
          middleware: function(connect, options) {
            return [
              connect['static'](options.base)
            ]
          }
        }
      }
    },
    concurrent: {
        options: {
            logConcurrentOutput: true
        },

        serve: ['watch', 'connect:dev']
    }
  });

  // Tasks
  grunt.registerTask('default', ['version',
                                 'preprocess',
                                 'webpack', 'recess',
                                 'uglify:deps',
                                 'concat:deps','concat:deps_debug',
                                 'uglify:deps_ie',
                                 'concat:deps_ie', 'concat:deps_ie_debug']);
  grunt.registerTask('deps', ['uglify:deps', 'uglify:deps_ie',
                              'concat:deps', 'concat:deps_ie',
                              'concat:deps_debug', 'concat:deps_ie_debug']);
  grunt.registerTask('dist', ['default',
                              'copy:web', 'copy:nw_linux', 'copy:nw_linux_debug']);
  grunt.registerTask('serve', ['concurrent:serve']);
};
// Helpers
function escapeRegExpString(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); }
function pathToRegExp(p) { return new RegExp("^" + escapeRegExpString(p)); }
