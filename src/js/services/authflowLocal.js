/**
 * AUTH FLOW
 *
 * This auth flow service manages the login and registration procedures for the desktop client.
 */

var module = angular.module('authflow', []);

module.factory('rpAuthFlow', ['$rootScope', 'rpBlob',
  function ($scope, $blob)
  {
    var AuthFlow = {};

    /**
     * Login
     *
     * @param {object} opts
     * @param {string} opts.password
     * @param {string} opts.walletfile
     * @param {function} callback
     */
    AuthFlow.login = function (opts, callback) {
      var password = opts.password;

      $blob.init(opts.walletfile, password, function (err, blob) {
        if (err) {
          callback(err);
          return;
        }

        console.log("client: authflow: login succeeded", blob);
        callback(null, blob, '', 'local');
      });
    };

    /**
     * Register an account
     *
     * @param {object} opts
     * @param {string} opts.password
     * @param {string} opts.account
     * @param {string} opts.masterkey
     * @param {string} opts.walletfile
     * @param {function} callback
     */
    AuthFlow.register = function (opts, callback) {
      $blob.create({
        'account': opts.account,
        'password': opts.password,
        'masterkey': opts.masterkey,
        'walletfile': opts.walletfile
      },
      function (err, blob) {
        if (err) {
          callback(err);
          return;
        }

        console.log("client: authflow: registration succeeded", blob);
        callback(null, blob, 'local');
      });
    };

    return AuthFlow;
  }]);
