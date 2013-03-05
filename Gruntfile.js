var path = require("path");
module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

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
        minimize: true
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
        src: ["deps/js/jquery.js",
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
              "deps/js/bootstrap-popover.js"],
        dest: 'build/dist/deps-debug.js',
        separator: ';'
      },
      deps_ie: {
        src: ["compat/ie/base64/base64.js",
              "compat/ie/ws/web_socket.js",
              "compat/ie/ws/config.js",
              "compat/ie/xdr/xdr.js"],
        dest: 'build/dist/deps_ie-debug.js'
      }
    },
    uglify: {
      // JavaScript dependencies
      deps: {
        files: {
          'build/dist/deps.js': ["build/dist/deps-debug.js"]
        }
      },
      deps_ie: {
        files: {
          'build/dist/deps_ie.js': ["build/dist/deps_ie-debug.js"]
        }
      }
    },
    watch: {
      scripts: {
        files: ['src/js/**/*.js', 'src/jade/**/*.jade'],
        tasks: ['webpack:desktop_debug', 'webpack:desktop'],
        options: { nospawn: true }
      },
      deps: {
        files: ['<%= concat.deps.src %>'],
        tasks: ['concat:deps', 'uglify:deps']
      },
      styles: {
        files: 'src/less/**/*.less',
        tasks: 'recess'
      }
    }
  });

  // Tasks
  grunt.registerTask('default', ['webpack', 'recess',
                                 'concat:deps', 'uglify:deps',
                                 'concat:deps_ie', 'uglify:deps_ie']);
  grunt.registerTask('deps', ['concat:deps', 'min:deps']);
};
// Helpers
function escapeRegExpString(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); }
function pathToRegExp(p) { return new RegExp("^" + escapeRegExpString(p)); }
