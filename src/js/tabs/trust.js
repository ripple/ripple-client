var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tabmanager').Tab;
var app = require('../client/app').App.singleton;
var Amount = ripple.Amount;

var TrustTab = function ()
{
  Tab.call(this);
};

util.inherits(TrustTab, Tab);

TrustTab.prototype.parent = 'advanced';

TrustTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/trust.jade')();
};

TrustTab.prototype.angular = function (module)
{
  var self = this;
  var app = this.app;

  module.controller('TrustCtrl', ['$scope', '$timeout', function ($scope, $timeout)
  {
    $scope.$watch('urlParams', function(){
      $scope.reset();
    }, true);

    $scope.reset = function () {
      $scope.mode = 'main';
      $scope.currency = 'USD';
      $scope.addform_visible = false;
      $scope.amount = '';
      $scope.counterparty = '';

      if (app.$scope.balance == '0') {
        $scope.mode = 'error';
        $scope.errorMessage = 'You have to be funded before you can grant a trust';
      }

      // Url params
      if ($scope.urlParams.to) {
        $scope.addform_visible = true;
        $scope.counterparty = $scope.urlParams.to;
      }
      if ($scope.urlParams.amount) {
        $scope.addform_visible = true;
        $scope.amount = $scope.urlParams.amount;
      }
      if ($scope.urlParams.currency) {
        $scope.addform_visible = true;
        $scope.currency = $scope.urlParams.currency;
      }

      // If all the form fields are filled, go to confirmation page
      if ($scope.urlParams.to && $scope.urlParams.amount && $scope.urlParams.currency) {
        $scope.grant();
      }
    };

    $scope.$watch('balance', function(){
      if ('error' == $scope.mode && '0' !== app.$scope.balance) {
        $scope.mode = 'main';
        $scope.errorMessage = '';
      }
    }, true);

    self.on('reset', $scope.reset);

    $scope.toggle_form = function ()
    {
      $scope.addform_visible = !$scope.addform_visible;
    };

    $scope.$watch('counterparty', function() {
      $scope.contact = webutil.getContact($scope.userBlob.data.contacts,$scope.counterparty);
      if ($scope.contact) {
        $scope.counterparty_name = $scope.contact.name;
        $scope.counterparty_address = $scope.contact.address;
      } else {
        $scope.counterparty_name = '';
        $scope.counterparty_address = $scope.counterparty;
      }
    }, true);

    /**
     * N2. Confirmation page
     */
    $scope.grant = function ()
    {
      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = ripple.Amount.from_human(""+$scope.amount+" "+currency);

      $scope.amount_feedback = amount.to_human();
      $scope.currency_feedback = amount._currency.to_json();

      $scope.confirm_wait = true;
      $timeout(function () {
        $scope.confirm_wait = false;
        $scope.$digest();
      }, 1000);

      $scope.mode = "confirm";
    };

    /**
     * N3. Waiting for grant result page
     */
    $scope.grant_confirmed = function () {
      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = $scope.amount + '/' + currency + '/' + $scope.counterparty_address;

      var tx = app.net.remote.transaction();
      tx
          .ripple_line_set(app.id.account, amount)
          .on('success', function(res){
            setEngineStatus(res, false);
            $scope.granted(this.hash);
            $scope.$digest();
          })
          .on('error', function(){
            $scope.mode = "error";
            $scope.$digest();
          })
          .submit()
      ;

      $scope.mode = "granting";
    };

    /**
     * N5. Granted page
     */
    $scope.granted = function (hash) {
      $scope.mode = "granted";
      app.net.remote.on('net_account', handleAccountEvent);

      function handleAccountEvent(e) {
        if (e.transaction.hash === hash) {
          setEngineStatus(e, true);
          $scope.$digest();
          app.net.remote.removeListener('net_account', handleAccountEvent);
        }
      }
    };

    function setEngineStatus(res, accepted) {
      $scope.engine_result = res.engine_result;
      $scope.engine_result_message = res.engine_result_message;
      switch (res.engine_result.slice(0, 3)) {
        case 'tes':
          $scope.tx_result = accepted ? "cleared" : "pending";
          break;
        case 'tem':
          $scope.tx_result = "malformed";
          break;
        case 'ter':
          $scope.tx_result = "failed";
          break;
        case 'tep':
          console.warn("Unhandled engine status encountered!");
      }

      if (res.engine_result == 'tecINSUF_RESERVE_LINE') {
        $scope.tx_result = "failed";
      }
    }

    $scope.saveAddress = function () {
      $scope.addressSaving = true;

      var contact = {
        'name': $scope.saveAddressName,
        'address': $scope.counterparty_address
      };

      app.id.once('blobsave', function(){
        $scope.contact = contact;
        $scope.addressSaved = true;
      });

      app.$scope.userBlob.data.contacts.unshift(contact);
    };

    $scope.edit_line = function ()
    {
      var line = this.line;
      $scope.addform_visible = true;
      $scope.currency = line.currency;
      $scope.counterparty = line.account;
      $scope.amount = +line.limit.to_text();
    };

    /**
     * Used for rpDestination validator
     *
     * @param destionation
     */
    $scope.counterparty_query = function (match, re) {
      var opts = $scope.userBlob.data.contacts.map(function (contact) {
        return contact.name;
      });

      if (re instanceof RegExp) {
        return opts.filter(function (v) {
          return v.toLowerCase().match(match.toLowerCase());
        });
      } else return opts;
    };

    $scope.currency_query = webutil.queryFromOptions($scope.currencies);

    $scope.reset();
  }]);
};

module.exports = TrustTab;
