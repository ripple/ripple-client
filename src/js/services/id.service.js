'use strict';

/**
 * ID
 *
 * The id service is used for user identification and authorization.
 */

var util = require('util'),
    webutil = require('../util/web'),
    settings = require('../util/settings'),
    Base58Utils = require('../util/base58'),
    RippleAddress = require('../util/types').RippleAddress;

var module = angular.module('id', ['authflow', 'blob', 'oldblob']);

module.factory(
  'rpId', ['$rootScope', '$location', '$route', '$routeParams', '$timeout',
  'rpAuthFlowIDS', 'rpBlobIDS', '$q', '$http',
  function($scope, $location, $route, $routeParams, $timeout,
                                 $authflow, $blob, $q, $http) {
    /**
     * Identity manager
     *
     * This class manages the encrypted blob and all user-specific state.
     */
    var Id = function()
    {
      this.account = null;
      this.loginStatus = false;
      // name resolution cache
      this.resolvedNames = [];
      this.serviceInvoked = [];
    };

    // This object defines the minimum structure of the blob.
    //
    // This is used to ensure that the blob we get from the server has at least
    // these fields and that they are of the right types.
    Id.minimumBlob = {
      data: {
        contacts: [],
        preferred_issuer: {},
        preferred_second_issuer: {}
      },
      meta: []
    };

    // The default blob is the blob that a new user gets.
    //
    // Right now this is equal to the minimum blob, but we may define certain
    // default values here in the future.
    Id.defaultBlob = Id.minimumBlob;

    /**
     * Reduce username to standardized form.
     *
     * This creates the version of the username that is displayed in the UI.
     */
    Id.normalizeUsernameForDisplay = function(username) {
      username = '' + username;

      // Strips whitespace at beginning and end.
      username = username.trim();

      return username;
    };

    /**
     * Reduce username to standardized form.
     *
     * This version is used in the login system and it's the version sent to
     * servers.
     */
    Id.normalizeUsernameForInternals = function(username) {
      username = '' + username;

      // Strips whitespace at beginning and end.
      username = username.trim();

      // Remove hyphens
      username = username.replace(/-/g, '');

      // All lowercase
      username = username.toLowerCase();

      return username;
    };

    Id.prototype.init = function()
    {
      var self = this;

      // Initializing sjcl.random doesn't really belong here, but there is no other
      // good place for it yet.
      for (var i = 0; i < 8; i++) {
        sjcl.random.addEntropy(Math.random(), 32, 'Math.random()');
      }

      $scope.userBlob = Id.defaultBlob;
      $scope.userCredentials = {};

      $scope.$watch('userBlob', function() {
        // XXX Maybe the blob service should handle this stuff?
        $scope.$broadcast('$blobUpdate');

        // XXX What's the equivalent in the new login API?
        /*
        if (self.username && self.password) {
          $oldblob.set(...,
                    self.username.toLowerCase(), self.password,
                    $scope.userBlob,function(){
                      $scope.$broadcast('$blobSave');
                    });
        }
        */
      }, true);

      $scope.$on('$blobUpdate', function() {
        if (!settings.blobIsValid($scope.userBlob)) return;

        $scope.ripple_exchange_selection_trade = settings.getSetting($scope.userBlob, 'rippleExchangeSelectionTrade', false);

        var d = $scope.userBlob.data;
        Options.advanced_feature_switch = settings.getSetting($scope.userBlob, 'trust.advancedMode', false);
        Options.historyApi = settings.getSetting($scope.userBlob, 'historyApi', Options.historyApi).replace(/[\/]*$/, '');
        Options.max_tx_network_fee = settings.getSetting($scope.userBlob, 'maxNetworkFee', Options.max_tx_network_fee);

        // confirmation
        // Replace default settings with user settings from blob, if blob is empty, then reuse the original value
        Options.confirmation = $.extend(true, {}, settings.getSetting($scope.userBlob, 'confirmation', Options.confirmation));

        var blobServers = settings.getSetting($scope.userBlob, 'server.servers', []);
        if (_.isArray(blobServers) && blobServers.length > 0 && !_.isEqual(blobServers, settings.getClearServers(Options.server.servers))) {
          Options.server.servers = blobServers;
          // Save in local storage
          if (!store.disabled) {
            store.set('ripple_settings', JSON.stringify(Options));
            // Reload
            // A force reload is necessary here because we have to re-initialize
            // the network object with the new server list.
            location.reload();
          }
        }

        // Account address
        if (!$scope.address && d.account_id) {
          $scope.address = d.account_id;
        }

        // migrate user data to clients.rippletradecom
        if (_.has(d, 'advancedFeatureSwitch')) {
          if (!settings.hasSetting($scope.userBlob, 'trust.advancedMode')) {
            $scope.userBlob.set('/clients/rippletradecom/trust/advancedMode', d.advancedFeatureSwitch);
          }
          $scope.userBlob.unset('/advancedFeatureSwitch');
        }

        if (_.has(d, 'persistUnlock')) {
          $scope.userBlob.set('/clients/rippletradecom/persistUnlock', d.persistUnlock);
          $scope.userBlob.unset('/persistUnlock');
        }

        if (_.has(d, 'lastSeenTxDate')) {
          $scope.userBlob.set('/clients/rippletradecom/lastSeenTxDate', d.lastSeenTxDate);
          $scope.userBlob.unset('/lastSeenTxDate');
        }

        if (_.has(d, 'trade_currency_pairs')) {
          $scope.userBlob.set('/clients/rippletradecom/trade_currency_pairs', d.trade_currency_pairs);
          $scope.userBlob.unset('/trade_currency_pairs');
        }

        var tradeCurrencyPairs = settings.getSetting($scope.userBlob, 'trade_currency_pairs', []);
        if (_.isArray(tradeCurrencyPairs) && tradeCurrencyPairs.length > 0) {
          var changed = false;
          if (_.find(tradeCurrencyPairs, _.partial(_.has, _, '$$hashKey'))) {
            // clear $$hashKey
            tradeCurrencyPairs = angular.fromJson(angular.toJson(tradeCurrencyPairs));
            changed = true;
          }
          var tradeCurrencyPairsUniq = _.uniq(tradeCurrencyPairs, false, function(o) {
            return o.name;
          });
          if (tradeCurrencyPairsUniq.length !== tradeCurrencyPairs.length) {
            tradeCurrencyPairs = tradeCurrencyPairsUniq;
            changed = true;
          }

          if (changed) {
            $scope.userBlob.set('/clients/rippletradecom/trade_currency_pairs', tradeCurrencyPairs);
          }
        }

        if (_.has(d, 'txQueue')) {
          $scope.userBlob.set('/clients/rippletradecom/txQueue', d.txQueue);
          $scope.userBlob.unset('/txQueue');
        }
      });

      if (!!store.get('backend_token')) {
        self.relogin(function(err, blob) {
          if (!blob) {
            self.logout();
            $location.path('/login');
          }
        });
      }

      $scope.showLogin = true;

      $(window).bind('storage', function(e) {
        // http://stackoverflow.com/questions/18476564/ie-localstorage-event-misfired
        if (document.hasFocus()) return;

        if (e.originalEvent.key == 'backend_token' && e.originalEvent.oldValue && !e.originalEvent.newValue) {
          $timeout(function() { $scope.$broadcast('$idRemoteLogout'); }, 0);
        }

        if (e.originalEvent.key == 'backend_token' && !e.originalEvent.oldValue && e.originalEvent.newValue) {
          $timeout(function() { $scope.$broadcast('$idRemoteLogin'); }, 0);
        }
      });
    };

    Id.prototype.setUsername = function(username)
    {
      this.username = username;
      $scope.userCredentials.username = username;
      $scope.$broadcast('$idUserChange', {username: username});
    };

    Id.prototype.setAccount = function(accId)
    {
      if (this.account !== null) {
        $scope.$broadcast('$idAccountUnload', {account: accId});
      }
      this.account = accId;
      $scope.userCredentials.account = accId;
      $scope.$broadcast('$idAccountLoad', {account: accId});
    };

    Id.prototype.isReturning = function()
    {
      return !!store.get('ripple_known');
    };

    Id.prototype.isLoggedIn = function()
    {
      return this.loginStatus;
    };

    Id.prototype.storeBackendToken = function(token)
    {
      store.set('backend_token', token);
    };

    Id.prototype.exists = function(username, callback)
    {
      username = Id.normalizeUsernameForDisplay(username);

      $authflow.exists(Id.normalizeUsernameForInternals(username), function(err, data) {
        if (!err && data) {
          // Blob found, new auth method
          callback(null, true);
        } else {
          // No blob found
          callback(null, false);
        }
      });
    };

    Id.prototype.login = function(backend_token, callback) {
      var self = this;

      // Callback is optional
      if (typeof callback !== 'function') {
        callback = $.noop;
      }

      if (store.disabled) {
        callback(new Error('Local storage is disabled, unable to login!'));
        return;
      }

      store.set('backend_token', backend_token);

      var blobObj = new $blob();

      // init returns a promise
      blobObj.init().then(function(blob) {
        // Ensure certain properties exist
        $.extend(true, blob, Id.minimumBlob);

        $scope.userBlob = blob;
        self.setUsername(blob.ripple_name);
        self.setAccount(blob.data.account_id);
        self.loginStatus = true;
        $scope.loginStatus = true;
        $scope.$broadcast('$blobUpdate');
        store.set('ripple_known', true);

        callback(null);

      }, function(err) {
        // TODO Divide responsibilities between controller/id/auth/blob on handling unsuccessful login
        self.logout();
        // $location.path('/login');

        callback(new Error(err));
      });
    };

    Id.prototype.relogin = function(callback) {
      var self = this;
      var backend_token = store.get('backend_token');

      // Callback is optional
      if (typeof callback !== 'function') {
        callback = $.noop;
      }

      if (!backend_token) {
        return callback(new Error('Missing backend token'));
      }
      // XXX This is technically not correct, since we don't know yet whether
      //     the login will succeed. But we need to set it now, because the page
      //     controller will likely query it long before we get a response from
      //     the login system.
      //
      //     Will work fine as long as any relogin error triggers a logout and
      //     logouts trigger a full page reload.
      // self.loginStatus = true;
      // $scope.loginStatus = true;

      var blobObj = new $blob();

      // init returns a promise
      blobObj.init().then(function(blob) {
        // Ensure certain properties exist
        $.extend(true, blob, Id.minimumBlob);

        $scope.userBlob = blob;
        self.setUsername(blob.ripple_name);
        self.setAccount(blob.data.account_id);
        self.loginStatus = true;
        $scope.loginStatus = true;
        $scope.$broadcast('$blobUpdate');
        store.set('ripple_known', true);

        callback(null, blob);

      }, function(err) {
        callback(new Error(err));
      });
    };

    Id.prototype.logout = function()
    {
      store.remove('backend_token');

      // TODO make it better
      // this.account = '';
      // this.keys = {};
      // this.loginStatus = false;
      // $scope.loginStatus = false;
      // this.username = '';
      // $scope.address = '';
  //    $location.path('/login');

      // problem?
      // reload will not work, as some pages are also available for guests.
      // Logout will show the same page instead of showing login page.
      // This line redirects user to root (login) page
  //    var port = location.port.length > 0 ? ":" + location.port : "";
  //    location.href = location.protocol + '//' + location.hostname  + port + location.pathname;
    };

    Id.prototype.unlock = function(username, password, callback) {
      var self = this;

      // Callback is optional
      if ('function' !== typeof callback) callback = $.noop;

      // username = Id.normalizeUsernameForDisplay(username);
      // password = Id.normalizePassword(password);

      $authflow.unlock(username, password, function(err, resp) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, resp.secret);
      });
    };

    /**
     * Go to an identity page.
     *
     * Redirects the user to a page where they can identify. This could be the
     * login tab most likely.
     */
    Id.prototype.goId = function () {
      if (!this.isLoggedIn()) {
        if (_.size($routeParams)) {
          var tab = $route.current.tabName;
          $location.search('tab', tab);
          $location.path('/login');
          return;
        }

        $location.path('/login');
      }
    };

    /**
     * Find Ripple Name
     *
     * Find a ripple name for a given ripple address
     */
    Id.prototype.resolveNameSync = function(address, options) {
      if (!this.resolvedNames[address]) {
        if (!this.serviceInvoked[address]) {
          this.resolveName(address, options);
        }
        return address;
      }
      return this.resolvedNames[address];
    };

    /**
     *
     */
    Id.prototype.addressDontHaveName = function(address) {
      return this.resolvedNames[address] === address;
    };

    /**
     * Find Ripple Name
     *
     * Find a ripple name for a given ripple address
     */
    Id.prototype.resolveName = function(address, options) {
      var self = this;
      var deferred = $q.defer();
      var strippedValue = webutil.stripRippleAddress(address);
      var rpAddress = ripple.UInt160.from_json(strippedValue);
      if (!rpAddress.is_valid()) {
        deferred.resolve(address);
        return deferred.promise;
      }

      var opts = jQuery.extend(true, {}, options);

      if (!this.resolvedNames[address]) {
        if (!this.serviceInvoked[address]) {
          this.serviceInvoked[address] = deferred;

          // Get the blobvault url
          rippleVaultClient.AuthInfo.get(Options.domain, strippedValue, function(err, data) {
            if (err) {
              self.serviceInvoked[address] = false;
              deferred.reject(err);
              return;
            }

            if (data.username) {
              if (opts.tilde === true) {
                self.resolvedNames[address] = '~'.concat(data.username);
              } else {
                self.resolvedNames[address] = data.username;
              }
            } else {
              // Show the ripple address if there's no name associated with it
              self.resolvedNames[address] = address;
            }

            self.serviceInvoked[address] = true;
            deferred.resolve(self.resolvedNames[address]);
          });
        } else {
          if (!_.isBoolean(this.serviceInvoked[address]) && _.isFunction(this.serviceInvoked[address].resolve)) {
            return this.serviceInvoked[address].promise;
          } else {
            deferred.resolve(address);
          }
        }
      } else {
        deferred.resolve(self.resolvedNames[address]);
      }
      return deferred.promise;
    };

    $scope.$watch('loginStatus', function(loginStatus) {
      if (loginStatus) {
        $scope.showLogin = false;
      }
    });

    $scope.$on('$routeChangeStart', function(ev, next) {
      if (!$scope.loginStatus) {
        var tab = next.tabName;
        var allTabs = ['login', 'recover', '404', 'privacypolicy', 'tou'];
        if (allTabs.indexOf(tab) !== -1) {
          $scope.showLogin = false;
        }
        else {
          $scope.showLogin = true;
          return;
        }
      }
    });

    return new Id();
  }]
);
