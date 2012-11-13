var pkg = require('../../package.json');
var webpack = require("webpack");
var async = require("async");
var extend = require("extend");

var cfg = {
  // General settings
  baseName: pkg.name,

  // CLI-configurable options
  watch: false,
  outputDir: __dirname + "/../../build"
};
for (var i = 0, l = process.argv.length; i < l; i++) {
  var arg = process.argv[i];
  if (arg === '-w' || arg === '--watch') {
    cfg.watch = true;
  } else if (arg === '-o') {
    cfg.outputDir = process.argv[++i];
  }
};

var builds = [{
  programPath: __dirname + "/../../src/js/entry/desktop.js",
  filename: cfg.baseName + '-' + pkg.version + '.js'
},{
  programPath: __dirname + "/../../src/js/entry/desktop.js",
  filename: cfg.baseName + '-' + pkg.version + '-debug.js',
  debug: true
},{
  programPath: __dirname + "/../../src/js/entry/desktop.js",
  filename: cfg.baseName + '-' + pkg.version + '-min.js',
  minimize: true
},{
  programPath: __dirname + "/../../src/js/entry/graph.js",
  filename: 'graph.js'
}];

var defaultOpts = {
  watch: cfg.watch
};

function build(opts) {
  opts = extend({}, defaultOpts, opts);
  opts.output = cfg.outputDir + "/"+opts.filename;
  return function (callback) {
    var filename = opts.filename;
    webpack(opts.programPath, opts, function (err, result) {
      if (err) {
        console.error(err.stack);
        return;
      }
      console.log(' '+filename, result.hash, '['+result.modulesCount+']');
      if ("function" === typeof callback) {
        callback(err);
      }
    });
  }
}

if (!cfg.watch) {
  console.log('Compiling Ripple JavaScript...');
  async.series(builds.map(build), function (err) {
    if (err) {
      console.error(err);
    }
  });
} else {
  console.log('Watching files for changes...');
  builds.map(build).forEach(function (build) {
    build();
  });
}
