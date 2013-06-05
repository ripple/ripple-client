var path = require("path"),
    fs = require("fs");
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

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
              "deps/js/jquery.qrcode.min.js",
              "deps/js/spin.js"];

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

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    recess: {
      dist: {
        src: ['src/less/ripple/desktop.less'],
        dest: 'build/css/ripple-desktop.css',
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
        }
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
    watch: {
      scripts_debug: {
        files: ['src/js/**/*.js', 'src/jade/**/*.jade'],
        tasks: ['webpack:desktop_debug'],
        options: { nospawn: true }
      },
      scripts: {
        files: ['src/js/**/*.js', 'src/jade/**/*.jade'],
        tasks: ['webpack:desktop_debug', 'webpack:desktop'],
        options: { nospawn: true }
      },
      deps: {
        files: ['<%= concat.deps.src %>'],
        tasks: ['concat:deps_debug', 'uglify:deps', 'concat:deps']
      },
      styles: {
        files: 'src/less/**/*.less',
        tasks: 'recess'
      }
    }
  });

  // Tasks
  grunt.registerTask('default', ['webpack', 'recess',
                                 'uglify:deps',
                                 'concat:deps','concat:deps_debug',
                                 'uglify:deps_ie',
                                 'concat:deps_ie', 'concat:deps_ie_debug']);
  grunt.registerTask('deps', ['concat:deps', 'min:deps']);
};
// Helpers
function escapeRegExpString(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); }
function pathToRegExp(p) { return new RegExp("^" + escapeRegExpString(p)); }
