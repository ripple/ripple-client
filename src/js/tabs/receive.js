var util = require('util');
var Tab = require('../client/tab').Tab;

var ReceiveTab = function ()
{
  Tab.call(this);
};

util.inherits(ReceiveTab, Tab);

ReceiveTab.prototype.tabName = 'receive';
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
  }]);
};

ReceiveTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/receive.jade')();
};

module.exports = ReceiveTab;
