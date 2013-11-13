var util = require('util');
var Tab = require('../client/tab').Tab;

var ReceiveTab = function ()
{
  Tab.call(this);
};

util.inherits(ReceiveTab, Tab);

ReceiveTab.prototype.mainMenu = 'receive';

ReceiveTab.prototype.angular = function (module) {
  module.controller('ReceiveCtrl', ['$scope', 'rpId', 'rpTracker',
                                     function ($scope, $id, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

     // watch the address function and detect when it changes so we can inject the qr
    $scope.$watch('address', function(){
      if ($scope.address !== undefined)
      // use jquery qr code library to inject qr code into div
        $('#qr-code').qrcode('https://ripple.com//contact?to=' + $scope.address);
    }, true);

    // XXX: This used to be in onAfterRender. Refactor and re-enable
    /*
    this.el.find('.btn').click(function (e) {
      e.preventDefault();

      var address = self.el.find('.address').text();

      highlightAnimation();

      // TODO: Actually copy (using Flash)
    });

    this.el.find('.select').click(function (e) {
      e.preventDefault();

      self.el.find('.address input').select();
    });

    function highlightAnimation() {
      // Trigger highlight animation
      self.el.find('.address')
        .stop()
        .css('background-color', '#fff')
        .effect('highlight', {
          color: "#8BC56A",
          easing: jQuery.easing.easeOutSine()
        }, 800);
    }
    */

    $rpTracker.track('Page View', {'Page Name': 'Receive'});
  }]);
};

ReceiveTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/receive.jade')();
};

module.exports = ReceiveTab;
