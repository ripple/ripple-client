var util = require('util');
var Tab = require('../client/tabmanager').Tab;
var app = require('../client/app').App.singleton;

var TrustTab = function ()
{
  Tab.call(this);

  this.on('afterrender', this.onAfterRender.bind(this));
};

util.inherits(TrustTab, Tab);

TrustTab.prototype.parent = 'account';

TrustTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/trust.jade')();
};

TrustTab.prototype.angular = function (module)
{
  var self = this;

  module.controller('TrustCtrl', function ($scope) {
    
    $scope.currency = $scope.currencies[0];

    $scope.toggle_form = function ()
    {
      $scope.addform_visible = !$scope.addform_visible;
    }

    $scope.grant = function ()
    {
      console.log($scope.amount, $scope.currency,
                  $scope.counterparty);

      var amount = $scope.amount + '/' + $scope.currency.value + '/' + $scope.counterparty;
      var tx = self.app.net.remote.transaction();
      tx
        .ripple_line_set(self.app.id.account, amount)
        .submit()
      ;
    };
  });
};

TrustTab.prototype.onAfterRender = function ()
{

};

module.exports = TrustTab;
