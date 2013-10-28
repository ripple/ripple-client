var util = require('util'),
    webutil = require('../util/web'),
    Tab = require('../client/tab').Tab,
    Amount = ripple.Amount,
    Base = ripple.Base;

var ConvertTab = function ()
{
  Tab.call(this);
};

util.inherits(ConvertTab, Tab);

ConvertTab.prototype.mainMenu = 'wallet';

ConvertTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/convert.jade')();
};

ConvertTab.prototype.angular = function (module)
{
  module.controller('ConvertCtrl', ['$scope', '$timeout', '$routeParams', 'rpId', 'rpNetwork',
    function ($scope, $timeout, $routeParams, $id, $network)
    {
      if (!$id.loginStatus) return $id.goId();

      $scope.xrp = _.where($scope.currencies_all, {value: "XRP"})[0];

      $scope.$watch('convert.amount', function () {
        $scope.update_convert();
      }, true);

      $scope.$watch('convert.currency', function () {
        $scope.convert.currency_code = $scope.convert.currency ? $scope.convert.currency.slice(0, 3).toUpperCase() : "XRP";
        $scope.update_convert();
      }, true);

      var pathUpdateTimeout;
      $scope.update_convert = function () {
        var convert = $scope.convert;
        var currency = convert.currency_code;
        var formatted = "" + convert.amount + " " + currency.slice(0, 3);

        // if formatted or money to convert is 0 then don't calculate paths or offer to convert
        if (parseFloat(formatted) === 0)
        {
          $scope.error_type = 'required';
          return false;
        }

        convert.amount_feedback = Amount.from_human(formatted);
        convert.amount_feedback.set_issuer($id.account);

        if (convert.amount_feedback.is_valid()) {
          convert.path_status = 'pending';
          convert.alt = null;

          if (pathUpdateTimeout) clearTimeout(pathUpdateTimeout);
          pathUpdateTimeout = $timeout($scope.update_paths, 500);
        } else {
          convert.path_status = 'waiting';
        }
      };

      $scope.update_paths = function () {
        $scope.$apply(function () {
          $scope.convert.path_status = 'pending';
          var amount = $scope.convert.amount_feedback;

          if (amount.is_zero()) return;

          // Start path find
          var pf = $network.remote.path_find($id.account,
              $id.account,
              amount);

          pf.on('update', function (upd) {
            $scope.$apply(function () {
              if (!upd.alternatives || !upd.alternatives.length) {
                $scope.convert.path_status = "no-path";
              } else {
                $scope.convert.path_status = "done";
                $scope.convert.alternatives = _.map(upd.alternatives, function (raw) {
                  var alt = {};
                  alt.amount = Amount.from_json(raw.source_amount);
                  alt.send_max = alt.amount.product_human(Amount.from_json('1.01'));
                  alt.paths = raw.paths_computed
                      ? raw.paths_computed
                      : raw.paths_canonical;

                  return alt;
                });
              }
            });
          });
        });
      };

      $scope.currency_query = webutil.queryFromOptions($scope.currencies_all);
      $scope.$watch('lines', function (lines) {
        var currencies = _.uniq(_.map(_.keys(lines), function (line) {
          return line.slice(-3);
        }));

        // XXX Not the fastest way of doing it...
        currencies = _.map(currencies, function (currency) {
          _.each($scope.currencies_all, function (entry) {
            if (currency === entry.value) {
              currency = entry.name;
              return false;
            }
          });
          return currency;
        });
        $scope.source_currency_query = webutil.queryFromArray(currencies);
      }, true);

      $scope.reset = function () {
        $scope.mode = "form";

        // XXX Most of these variables should be properties of $scope.convert.
        //     The Angular devs recommend that models be objects due to the way
        //     scope inheritance works.
        $scope.convert = {
          amount: '',
          currency: $scope.xrp.name,
          currency_code: "XRP",
          path_status: 'waiting',
          fund_status: 'none'
        };
        $scope.nickname = '';
        $scope.error_type = '';
        if ($scope.convertForm) $scope.convertForm.$setPristine(true);
      };

      $scope.cancelConfirm = function () {
        $scope.mode = "form";
        $scope.convert.alt = null;
      };

      $scope.reset_goto = function (tabName) {
        $scope.reset();

        // TODO do something clever instead of document.location
        // because goToTab does $scope.$digest() which we don't need
        document.location = '#' + tabName;
      };

      /**
       * N3. Confirmation page
       */
      $scope.convert_prepared = function () {
        $scope.confirm_wait = true;
        $timeout(function () {
          $scope.confirm_wait = false;
        }, 1000, true);

        $scope.mode = "confirm";
      };

      /**
       * N4. Waiting for transaction result page
       */
      $scope.convert_confirmed = function () {
        var currency = $scope.convert.currency.slice(0, 3).toUpperCase();
        var amount = Amount.from_human(""+$scope.convert.amount+" "+currency);

        amount.set_issuer($id.account);

        var tx = $network.remote.transaction();

        // Destination tag
        tx.destination_tag(webutil.getDestTagFromAddress($id.account));
        tx.payment($id.account, $id.account, amount.to_json());
        tx.send_max($scope.convert.alt.send_max);
        tx.paths($scope.convert.alt.paths);

        tx.on('proposed', function (res) {
          $scope.$apply(function () {
            setEngineStatus(res, false);
            $scope.converted(tx.hash);

            // Remember currency and increase order
            var found;

            for (var i = 0; i < $scope.currencies_all.length; i++) {
              if ($scope.currencies_all[i].value.toLowerCase() === $scope.convert.amount_feedback.currency().to_human().toLowerCase()) {
                $scope.currencies_all[i].order++;
                found = true;
                break;
              }
            }

            if (!found) {
              $scope.currencies_all.push({
                "name": $scope.convert.amount_feedback.currency().to_human().toUpperCase(),
                "value": $scope.convert.amount_feedback.currency().to_human().toUpperCase(),
                "order": 1
              });
            }
          });
        });
        tx.on('error', function (res) {
          setImmediate(function () {
            $scope.$apply(function () {
              $scope.mode = "error";

              if (res.error === 'remoteError' &&
                  res.remote.error === 'noPath') {
                $scope.mode = "status";
                $scope.tx_result = "noPath";
              }
            });
          });
        });
        tx.submit();

        $scope.mode = "sending";
      };

      /**
       * N6. Converted page
       */
      $scope.converted = function (hash) {
        $scope.mode = "status";
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
          case 'tep':
            $scope.tx_result = "partial";
            break;
          case 'tec':
            $scope.tx_result = "claim";
            break;
          case 'tef':
            $scope.tx_result = "failure";
            break;
          default:
            console.warn("Unhandled engine status encountered!");
        }
      }

      $scope.reset();
    }]);

  /**
   * Contact name and address uniqueness validator
   */
    // TODO move to global directives
  module.directive('unique', function() {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function ($scope, elm, attr, ctrl) {
        if (!ctrl) return;

        var validator = function(value) {
          if (!webutil.getContact($scope.userBlob.data.contacts,value)) {
            ctrl.$setValidity('unique', true);
            return value;
          } else {
            ctrl.$setValidity('unique', false);
            return;
          }
        };

        ctrl.$formatters.push(validator);
        ctrl.$parsers.unshift(validator);

        attr.$observe('unique', function() {
          validator(ctrl.$viewValue);
        });
      }
    };
  });

  /**
   * Don't allow the user to send XRP to himself
   */
  module.directive('rpXrpToMe', function () {
    return {
      restrict: 'A',
      require: '?ngModel',
      link: function (scope, elm, attr, ctrl) {
        var xrpWidget = elm.inheritedData('$formController')[attr.rpXrpToMe];

        ctrl.$parsers.unshift(function(value) {
          var contact = webutil.getContact(scope.userBlob.data.contacts,value);

          if (value) {
            if ((contact && contact.address === scope.userBlob.data.account_id) || scope.userBlob.data.account_id === value) {
              if (scope.convert.currency === xrpWidget.$viewValue) {
                ctrl.$setValidity('rpXrpToMe', false);
                return;
              }
            }
          }

          ctrl.$setValidity('rpXrpToMe', true);
          return value;
        });

        xrpWidget.$parsers.unshift(function(value) {
          ctrl.$setValidity('rpXrpToMe', value === ctrl.$viewValue);
          return value;
        });
      }
    };
  });
};

module.exports = ConvertTab;
