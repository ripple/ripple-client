
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

angular
  .module('authinfo', [])
  .factory('rpAuthInfo', ['$rootScope', 'rpRippleTxt', '$http',
  function ($scope, $txt, $http)
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
      callback(new Error("Unable to load ripple.txt of authentication provider"));
    }

    function processTxt(txt) {
      if (txt.authinfo_url) {
        $.ajax({
          url: txt.authinfo_url,
          dataType: "json",
          data: {
            domain: domain,
            username: username
          },
          error: function () {
            $scope.$apply(function() {
              callback(new Error("Cannot connect to our login system, please try again later or contact support@ripple.com."));
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

  AuthInfo.getByRippleAddress = function (domain, rippleAddress, callback) {
    $http({
      method: 'GET',
      url: 'http://' + domain + ':8081/v1/user/' + rippleAddress
    })
    .success(function(data, status, headers, config) {
      callback(null, data);
    })
    .error(function(data, status, headers, config) {
      callback(new Error("Failed to get the account - XHR error"));
    });
  };

  return AuthInfo;
}]);
