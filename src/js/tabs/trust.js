var util = require('util');
var webutil = require('../client/webutil');
var Tab = require('../client/tabmanager').Tab;
var app = require('../client/app').App.singleton;
var Amount = ripple.Amount;

var TrustTab = function ()
{
  Tab.call(this);
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
  var app = this.app;

  module.controller('TrustCtrl', function ($scope)
  {
    /**
     * Used for rpDestination validator
     *
     * @param destionation
     */
    $scope.recipient_query = function (match) {
      return $scope.userBlob.data.contacts.map(function (contact) {
        return contact.name;
      }).filter(function (v) {
        return v.toLowerCase().match(match.toLowerCase());
      });
    };

    $scope.currency_query = webutil.queryFromOptions($scope.currencies);
    
    $scope.currency = 'USD';

    $scope.toggle_form = function ()
    {
      $scope.addform_visible = !$scope.addform_visible;
    };

    $scope.edit_line = function ()
    {
      var line = this.line;
      $scope.addform_visible = true;
      $scope.currency = line.currency;
      $scope.counterparty = line.account;
      $scope.amount = +line.limit.to_text();
    };

    $scope.grant = function ()
    {
      var counterparty = webutil.getContact($scope.userBlob.data.contacts,$scope.counterparty).address;

      if (!counterparty) {
        counterparty = $scope.counterparty;
      }

      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = $scope.amount + '/' +
            currency + '/' +
          counterparty;

      var tx = app.net.remote.transaction();
      tx
        .ripple_line_set(app.id.account, amount)
        .on('error', function(){
          $scope.remoteError = true;
          $scope.$digest();
        })
        .on('success', function(){
          $scope.addform_visible = false;
          $scope.$digest();
        })
        .submit()
      ;
    };
  });
};

module.exports = TrustTab;
