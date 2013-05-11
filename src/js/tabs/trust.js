var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;
var Amount = ripple.Amount;

var TrustTab = function ()
{
  Tab.call(this);

};

util.inherits(TrustTab, Tab);

TrustTab.prototype.mainMenu = 'advanced';

TrustTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/trust.jade')();
};

TrustTab.prototype.angular = function (module)
{
  module.controller('TrustCtrl', ['$scope', '$timeout', '$routeParams', 'rpId', '$filter', 'rpNetwork',
                                  function ($scope, $timeout, $routeParams, $id, $filter, $network)
  {
    if (!$id.loginStatus) return $id.goId();
    $scope.validation_pattern = /^0*(([1-9][0-9]*.?[0-9]*)|(.0*[1-9][0-9]*))$/; //Don't allow zero for new trust lines.
    $scope.reset = function () {
      $scope.mode = 'main';
      $scope.currency = 'USD';
      $scope.addform_visible = false;
      $scope.amount = '';
      $scope.counterparty = '';
      $scope.saveAddressName = '';

      // If all the form fields are prefilled, go to confirmation page
      if ($routeParams.to && $routeParams.amount) {
        $scope.grant();
      }
    };

    $scope.toggle_form = function ()
    {
      $scope.addform_visible = !$scope.addform_visible;

      // Focus on first input
      setImmediate(function() {
        $('#trustForm').find('input:first').focus();
      });
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
      // set variable to show throbber
      $scope.verifying = true;
      $scope.error_account_reserve = false;
      // test if account is valid
      $network.remote.request_account_info($scope.counterparty_address)
        // if account is valid then just to confirm page
        .on('success', function (m){
          $scope.$apply(function(){
            // hide throbber
            $scope.verifying = false;
            var amount = ripple.Amount.from_human("" + $scope.amount + " " + $scope.currency.slice(0, 3).toUpperCase());

            $scope.amount_feedback = amount.to_human();
            $scope.currency_feedback = amount.currency().to_json();

            $scope.confirm_wait = true;
            $timeout(function () {
              $scope.confirm_wait = false;
            }, 1000, true);

            $scope.mode = "confirm";
          });
        })
        .on('error', function (m){
          setImmediate(function () {
            $scope.$apply(function(){
              $scope.verifying = false;
              $scope.error_account_reserve = true;
            });
          });
        })
        .request();
    };

    /**
     * N3. Waiting for grant result page
     */
    $scope.grant_confirmed = function () {
      var currency = $scope.currency.slice(0, 3).toUpperCase();
      var amount = $scope.amount + '/' + currency + '/' + $scope.counterparty_address;

      var tx = $network.remote.transaction();
      tx
          .ripple_line_set($id.account, amount)
          .on('success', function(res){
            $scope.$apply(function () {
              setEngineStatus(res, false);
              $scope.granted(tx.hash);

              // Remember currency and increase order
              var found;

              for (var i = 0; i < $scope.currencies_all.length; i++) {
                if ($scope.currencies_all[i].value.toLowerCase() == currency.toLowerCase()) {
                  $scope.currencies_all[i].order++;
                  found = true;
                  break;
                }
              }

              if (!found) {
                $scope.currencies_all.push({
                  "name": currency,
                  "value": currency,
                  "order": 1
                });
              }
            });
          })
          .on('error', function(){
            setImmediate(function () {
              $scope.$apply(function () {
                $scope.mode = "error";
              });
            });
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
      $network.remote.on('transaction', handleAccountEvent);

      function handleAccountEvent(e) {
        $scope.$apply(function () {
          if (e.transaction.hash === hash) {
            setEngineStatus(e, true);
            $network.remote.removeListener('transaction', handleAccountEvent);
          }
        });
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
        case 'tec':
          $scope.tx_result = "failed";
          break;
        case 'tep':
          console.warn("Unhandled engine status encountered!");
      }
    }

    // Focus on input when save address form opens
    $scope.show_save_address_form = function(){
      $('#contact_name').focus();
    };

    $scope.saveAddress = function () {
      $scope.addressSaving = true;

      var contact = {
        'name': $scope.saveAddressName,
        'address': $scope.counterparty_address
      };

      var removeListener = $scope.$on('$blobSave', function () {
        removeListener();
        $scope.contact = contact;
        $scope.addressSaved = true;
      });

      $scope.userBlob.data.contacts.unshift(contact);
    };

    $scope.edit_line = function ()
    {
      var line = this.line;
      var filterAddress = $filter('rpcontactnamefull');
      var contact = filterAddress(line.account);
      $scope.edituser = (contact) ? contact : 'User';
      $scope.validation_pattern = contact ? /^[0-9.]+$/ : /^0*(([1-9][0-9]*.?[0-9]*)|(.0*[1-9][0-9]*))$/;
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
