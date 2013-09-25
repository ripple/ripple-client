/**
 * AUTH INFO
 *
 * The auth info service is responsible for downloading the authentication
 * metadata.
 *
 * The authentication metadata contains information about the authentication
 * procedure the user needs to go through in order to decrypt their blob
 * successfully.
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('authinfo', []);

module.factory('rpAuthInfo', ['$rootScope', 'rpRippleTxt', function ($scope, $txt)
{
  var AuthInfo = {};

  AuthInfo.get = function (domain, username, callback) {
    var txtPromise = $txt.get(domain);

    if (txtPromise) {
      if ("function" === typeof txtPromise.then) {
        txtPromise.then(processTxt, handleNoTxt);
      } else {
        processTxt(txtPromise);
      }
    } else {
      handleNoTxt();
    }

    function handleNoTxt() {
      callback(new Error("Unable to load ripple.txt"));
    }

    function processTxt(txt) {
      if (txt.authinfo_url) {
        $.ajax({
          url: txt.federation_url[0],
          dataType: "json",
          data: {
            domain: domain,
            user: user
          },
          error: function () {
            $scope.$apply(function() {
              callback(new Error("Authinfo server unreachable"));
            });
          },
          success: function (data) {
            $scope.$apply(function() {
              callback(null, data);
            });
          }
        });
      } else {
        callback(new Error("Authentication is not supported on "+domain));
      }
    }
  };

  return AuthInfo;
}]);
