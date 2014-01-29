var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var ActivityTab = function ()
{
  Tab.call(this);
};

util.inherits(ActivityTab, Tab);

ActivityTab.prototype.tabName = 'activity';
ActivityTab.prototype.mainMenu = 'wallet';

ActivityTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/activity.jade')();
};

ActivityTab.prototype.angular = function (module)
{
  module.controller('ActivityCtrl', ['$scope', 'rpId', 'rpNetwork', 'rpTracker',
                                     function ($scope, $id, $network, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.transactions = [];
    $scope.current_page = 1;

    // filter effect types
    // Show only offer_funded, offer_partially_funded, offer_cancelled,
    // offer_bought, trust_change_no_ripple side effects
    var filterEffects = function (tx) {
      if (!tx) return null;

      var event = jQuery.extend(true, {}, tx);
      var effects = [];

      if (event.effects) {
        $.each(event.effects, function(){
          var effect = this;
          if (effect.type == 'offer_funded'
            || effect.type == 'offer_partially_funded'
            || effect.type == 'offer_bought'
            || effect.type == 'trust_change_no_ripple'
            || effect.type === 'offer_cancelled')
          {
            if (effect.type === 'offer_cancelled' && event.transaction
              && event.transaction.type === 'offercancel') {
              return
            }
            effects.push(effect);
          }
        });

        event.showEffects = effects;
      }

      if (effects.length || event.transaction) {
        return event;
      } else {
        return null;
      }
    };
  }]);
};

module.exports = ActivityTab;
