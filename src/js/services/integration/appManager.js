/**
 * APP MANAGER
 *
 * The app manager service is used to communicate with the Ripple apps
 * and connect them to the client.
 */

var module = angular.module('appManager', ['domainalias','integrationProfileManager']);

module.service('rpAppManager', ['$rootScope', '$http', 'rpDomainAlias', 'rpRippleTxt', 'rpProfileManager',
  function($scope, $http, aliasService, txt, profileManager)
{
  var log = function(){
    var mainArguments = Array.prototype.slice.call(arguments);
    mainArguments[0] = '%c ' + mainArguments[0] + ' ';
    mainArguments.splice(1, 0, 'background: green; color: white');
    console.log.apply(console,mainArguments);
  };

  /**
   * Load all apps
   */
  var init = function () {
    $scope.$watch('userBlob.data.apps', function(apps){
      if (apps && apps.length) {
        apps.forEach(function(appInBlob){
          loadApp(appInBlob.rippleAddress, function(err, app){
            $scope.apps[appInBlob.rippleAddress] = app;
          });
        });
      }
    });
  };

  // Loaded apps
  $scope.apps = {};

  /**
   * App object
   *
   * @param manifest
   * @constructor
   */
  var App = function(manifest){
    this.name = manifest.name;
    this.description = manifest.description;
    this.image = manifest.imageUrl;
    this.rippleAddress = manifest.rippleAddress;
    this.profiles = [];

    var self = this;

    _.each(manifest.profiles, function(profile,key){
      self.profiles[key] = profileManager.getProfile(profile);
    });
  };

  App.prototype.findProfile = function (type) {
    return _.findWhere(this.profiles, {type:type});
  };

  App.prototype.getInboundBridge = function (currency) {
    var found;

    this.profiles.forEach(function(profile,key){
      if ('inboundBridge' === profile.type) {
        profile.currencies.forEach(function(c){
          if (currency.toUpperCase() === c.currency) {
            found = profile;
          }
        });
      }
    });

    return found;
  };

  var getApp = function(rippleAddress,callback) {
    $scope.$watch('apps', function(apps){
      if (app = apps[rippleAddress]) {
        callback(null, app);
      }
    }, true);
  };

  var getAllApps = function(callback) {
    $scope.$watch('apps', function(apps){
      if (!$.isEmptyObject(apps)) callback(apps);
    }, true);
  };

  /**
   * Save app to userBlob
   *
   * @param app
   */
  var save = function(app) {
    var watcher = $scope.$watch('userBlob', function(userBlob){
      if (userBlob.data.created && !_.findWhere($scope.userBlob.data.apps, {rippleAddress:app.rippleAddress})) {
        $scope.userBlob.unshift("/apps", {
          name: app.name,
          rippleAddress: app.rippleAddress
        });

        watcher();
      }
    });
  };

  /**
   * Initializes Ripple App.
   *
   * @param rippleAddress
   * @param callback
   */
  var loadApp = function(rippleAddress, callback){
    var domain, manifest;

    // Get Domain
    log('appManager:','Looking up',rippleAddress);

    var alias = aliasService.getAliasForAddress(rippleAddress);
    alias.then(
      // Fulfilled
      function (domain) {
        log('appManager:','The domain for',rippleAddress,'is',domain);
        log('appManager:','Looking up ',domain,'for ripple.txt');

        // Get ripple.txt
        var txtPromise = txt.get(domain);
        txtPromise.then(
          // Fulfilled
          function(rippletxt){
            log('appManager:','Got ripple.txt',rippletxt);

            if (rippletxt.manifest_url) {
              log('appManager:','Looking up manifest',rippletxt.manifest_url);

              $http({url: rippletxt.manifest_url, method: 'get'})
                .success(function(data, status, headers, config) {
                  manifest = jQuery.extend(true, {}, data);

                  log('appManager:','Got the manifest for',manifest.name,manifest);

                  if (!validateManifest(manifest)) {
                    log('appManager:','Manifest is invalid.');
                    return;
                  }

                  // Create the App object.
                  $scope.apps[rippleAddress] = new App(manifest);

                  callback(null, $scope.apps[rippleAddress]);
                })
                .error(function(data, status, headers, config) {
                  log('appManager:','Can\'t get the manifest');
                });
            }
          },

          // Rejected
          function(reason) {
            callback(reason);
          }
        );
      },

      // Rejected
      function(reason) {
        callback(reason);
      }
    );
  };

  /**
   * Function to validate manifest file
   *
   * @param m manifest json
   * @returns {boolean}
   */
  var validateManifest = function(m) {
    // TODO more validation
    if (!m.name || !m.rippleAddress || !m.profiles) {
      return;
    }

    // Ripple address is wrong
    if (!ripple.UInt160.from_json(m.rippleAddress).is_valid()) return;

    return true;
  };

  return {
    getApp: getApp,
    getAllApps: getAllApps,
    loadApp: loadApp,
    init: init,
    save: save
  };
}]);
