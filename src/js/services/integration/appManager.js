/**
 * APP MANAGER
 *
 * The app manager service is used to communicate with the Ripple apps
 * and connect them to the client.
 */

var module = angular.module('appManager', ['domainalias','integrationProfileManager']);

module.factory('rpAppManager', ['$rootScope', '$http', 'rpDomainAlias', 'rpRippleTxt', 'rpProfileManager',
  function($scope, $http, aliasService, txt, profileManager)
{
  var log = function(){
    var mainArguments = Array.prototype.slice.call(arguments);
    mainArguments[0] = '%c ' + mainArguments[0] + ' ';
    mainArguments.splice(1, 0, 'background: green; color: white');
    console.log.apply(console,mainArguments);
  };

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
        })
      }
    });

    return found;
  };

  /**
   * Initializes Ripple App.
   *
   * @param rippleAddress
   * @returns App
   */
  var getApp = function(rippleAddress, callback){
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
                  var app = new App(manifest);

                  callback(null, app);
                })
                .error(function(data, status, headers, config) {
                  log("appManager:','Can't get the manifest");
                });
            }
          },

          // Rejected
          function(reason) {
            callback({
              'message': 'oops'
            })
          }
        )
      },

      // Rejected
      function(reason){
        callback({
          message: "Can't find domain for specified ripple address."
        });
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

    return true;
  };

  return {
    getApp: getApp
  }
}]);