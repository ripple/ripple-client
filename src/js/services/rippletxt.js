/**
 * RIPPLE.TXT
 *
 * The ripple.txt service looks up and caches ripple.txt files.
 *
 * These files are used to do DNS-based verifications autonomously on the
 * client-side. Quite neat when you think about it and a decent solution until
 * we have a network-internal nickname system.
 */

var module = angular.module('rippletxt', []);

module.factory('rpRippleTxt', ['$q', '$rootScope', '$http', function ($q, $scope, $http) {
  var promises = {};

  function get(domain) {
    if (promises[domain]) {
      return promises[domain];
    }

    var txtPromise = $q.defer();

    // TODO at some point we should only allow one of these
    var urls = [
      'https://www.' + domain + '/ripple.txt',
      'https://' + domain + '/ripple.txt',
      'https://ripple.' + domain + '/ripple.txt'
    ].reverse();

    var next = function () {
      if (!urls.length) {
        txtPromise.reject(new Error("No ripple.txt found"));
        return;
      }

      var url = urls.pop();

      $http.get(url)
        .success(function(data) {
          txtPromise.resolve(parse(data));
        })
        .error(next);
    };

    next();

    return promises[domain] = txtPromise.promise;
  }

  function parse(txt) {
    txt = txt.replace('\r\n', '\n');
    txt = txt.replace('\r', '\n');
    txt = txt.split('\n');

    var currentSection = "", sections = {};
    for (var i = 0, l = txt.length; i < l; i++) {
      var line = txt[i];
      if (!line.length || line[0] === '#') {
        continue;
      }
      else if (line[0] === '[' && line[line.length - 1] === ']') {
        currentSection = line.slice(1, line.length - 1);
        sections[currentSection] = [];
      }
      else {
        line = line.replace(/^\s+|\s+$/g, '');
        if (sections[currentSection]) {
          sections[currentSection].push(line);
        }
      }
    }

    return sections;
  }

  return {
    get: get,
    parse: parse
  };
}]);
