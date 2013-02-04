module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-webpack');

  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    lint: {
      files: ['src/js/**/*.js']
    },
    jshint: {
      options: {
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
      desktop: {
        src: "src/js/entry/desktop.js",
        dest: "build/dist/<%= pkg.name %>-desktop.js",
        minimize: true
      },
      desktop_debug: {
        src: "src/js/entry/desktop.js",
        dest: "build/dist/<%= pkg.name %>-desktop-debug.js",
        debug: true
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
              "deps/js/bootstrap-tooltip.js"],
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
    min: {
      // JavaScript dependencies
      deps: {
        src: ["build/dist/deps-debug.js"],
        dest: 'build/dist/deps.js'
      },
      deps_ie: {
        src: ["build/dist/deps_ie-debug.js"],
        dest: 'build/dist/deps_ie.js'
      }
    },
    watch: {
      scripts: {
        files: ['<config:lint.files>', 'src/jade/**/*.jade'],
        tasks: 'lint webpack:desktop webpack:desktop_debug'
      },
      deps: {
        files: ['<config:concat.deps.src>'],
        tasks: 'concat:deps min:deps'
      },
      styles: {
        files: 'src/less/**/*.less',
        tasks: 'recess'
      }
    }
  });

  // Tasks
  grunt.registerTask('default', 'lint webpack recess concat:deps min:deps ' +
                     'concat:deps_ie min:deps_ie');
  grunt.registerTask('deps', 'concat:deps min:deps');
};
