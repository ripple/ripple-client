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
        dest: "build/dist/js/<%= pkg.name %>-desktop-<%= pkg.version %>-min.js"
      },
      desktop_debug: {
        src: "src/js/entry/desktop.js",
        dest: "build/js/<%= pkg.name %>-desktop-debug.js",
        debug: true
      }
    },
    concat: {
      deps: {
        src: ["deps/js/jquery.js",
              "deps/js/jquery-ui.js",
              "deps/js/jquery.combobox.js",
              "deps/js/json.js",
              "deps/js/setImmediate.js",
              "deps/js/psm.js",
              "deps/js/sjcl.js",
              "deps/js/sjcl-secp256k1.js",
              "deps/js/sjcl-ripemd160.js",
              "deps/js/underscore.js",
              "deps/js/swfobject.js",
              "deps/js/downloadify.js",
              "deps/js/angular.js",
              "deps/js/store.js",
              "deps/js/ripple.js",
              "deps/js/moment.js",
              "deps/js/bootstrap-modal.js",
              "deps/js/bootstrap-tooltip.js"],
        dest: 'build/dist/deps-debug.js'
      }
    },
    min: {
      // JavaScript dependencies
      deps: {
        src: ["deps/js/jquery.js",
              "deps/js/jquery-ui.js",
              "deps/js/jquery.combobox.js",
              "deps/js/json.js",
              "deps/js/setImmediate.js",
              "deps/js/psm.js",
              "deps/js/sjcl.js",
              "deps/js/sjcl-secp256k1.js",
              "deps/js/sjcl-ripemd160.js",
              "deps/js/underscore.js",
              "deps/js/swfobject.js",
              "deps/js/downloadify.js",
              "deps/js/angular.js",
              "deps/js/store.js",
              "deps/js/ripple.js",
              "deps/js/moment.js",
              "deps/js/bootstrap-modal.js",
              "deps/js/bootstrap-tooltip.js"],
        dest: 'build/dist/deps.js'
      }
    },
    watch: {
      scripts: {
        files: ['<config:lint.files>', 'src/jade/**/*.jade'],
        tasks: 'lint webpack:desktop webpack:desktop_debug'
      },
      styles: {
        files: 'src/less/**/*.less',
        tasks: 'recess'
      }
    }
  });

  // Tasks
  grunt.registerTask('default', 'lint webpack recess');
  grunt.registerTask('deps', 'concat:deps min:deps');
};
