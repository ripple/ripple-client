/**
 *
 *
 */

(function() {
  'use strict';

  var fs = require('fs');
  var privateDevPath = 'selenium/tests-private-dev';
  var privatePath = 'selenium/tests-private/PrivateTests';

  function dump(contObj, num) {
    var resStr = JSON.stringify(contObj, null, 2);
    fs.writeFileSync(privatePath + num + '.json', resStr);
  }

  function main() {
    var dirs = fs.readdirSync(privateDevPath);
    //console.log(dirs);
    var resObj = null;
    var c = 0;
    var x = 0;
    for (var i = 0; i < dirs.length; i++) {
      console.log(dirs[i]);
      var content = fs.readFileSync(privateDevPath + '/' + dirs[i]);
      var obj = JSON.parse(content);
      if (resObj === null) {
        resObj = obj;
      } else {
        resObj.steps = resObj.steps.concat(obj.steps);
      }
      if (++c == 4) {
        c = 0;
        dump(resObj, x++);
        resObj = null;
      }
    }
    if (resObj) {
      dump(resObj, x++);
    }
  }

  main();

})();
