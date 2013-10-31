/**
 * FEDERATION
 *
 * The federation service looks up and caches federation queries.
 *
 * These files are used to do DNS-based verifications autonomously on the
 * client-side. Quite neat when you think about it and a decent solution until
 * we have a network-internal nickname system.
 */

var module = angular.module('federation', []);

module.factory('rpFederation', ['$q', '$rootScope', 'rpRippleTxt',
                               function ($q, $scope, $txt) {
  var txts = {};

  function check_email(email) {
    var federationPromise = $q.defer();

    var tmp = email.split('@');
    var domain = tmp.pop();
    var user = tmp.join('@');

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

    return federationPromise.promise;

    function handleNoTxt() {
      federationPromise.reject({
        result: "error",
        error: "noRippleTxt",
        error_message: "Ripple.txt not available for the requested domain."
      });
    }
    function processTxt(txt) {
      if (txt.federation_url) {
        $.ajax({
          url: txt.federation_url[0],
          dataType: "json",
          data: {
            type: 'federation',
            domain: domain,
            destination: user,
            // DEPRECATED "destination" is a more neutral name for this field
            //   than "user"
            user: user
          },
          error: function () {
            $scope.$apply(function() {
              federationPromise.reject({
                result: "error",
                error: "unavailable",
                error_message: "Federation gateway did not respond."
              });
            });
          },
          success: function (data) {
            $scope.$apply(function() {
              if ("object" === typeof data &&
                  "object" === typeof data.federation_json &&
                  data.federation_json.type === "federation_record" &&
                  (data.federation_json.user === user ||
                   data.federation_json.destination === user) &&
                  data.federation_json.domain === domain) {
                federationPromise.resolve(data.federation_json);
              } else if ("string" === typeof data.error) {
                federationPromise.reject({
                  result: "error",
                  error: "remote",
                  error_remote: data.error,
                  error_message: data.error_message
                    ? "Service error: " + data.error_message
                    : "Unknown remote service error."
                });
              } else {
                federationPromise.reject({
                  result: "error",
                  error: "unavailable",
                  error_message: "Federation gateway's response was invalid."
                });
              }
            });
          }
        });
      } else {
        federationPromise.reject({
          result: "error",
          error: "noFederation",
          error_message: "Federation is not available on the requested domain."
        });
      }
    }
  }

  return {
    check_email: check_email
  };
}]);
