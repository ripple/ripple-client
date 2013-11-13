var util = require('util'),
    Tab = require('../client/tab').Tab,
    rewriter = require('../util/jsonrewriter');

var BalanceTab = function ()
{
  Tab.call(this);
};

util.inherits(BalanceTab, Tab);

BalanceTab.prototype.mainMenu = 'wallet';

BalanceTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/balance.jade')();
};

BalanceTab.prototype.angular = function (module)
{
  module.controller('BalanceCtrl', ['$scope', 'rpId', 'rpNetwork', 'rpTracker',
                                     function ($scope, $id, $network, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.transactions = [];
    $scope.current_page = 1;

    // filter effect types
    // Show only offer_funded, offer_partially_funded, offer_cancelled, offer_bought side effects
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
              || (effect.type === 'offer_canceled' &&
                  event.transaction.type !== 'offercancel')) {
            effects.push(effect);
          }
        });

        event.effects = effects;
      }

      if (effects.length || event.transaction) {
        return event;
      } else {
        return null;
      }
    };

    $scope.reset = function () {
      $scope.transactions = [];
      $scope.has_more = true;
    };

    var marker;
    $scope.loadMore = function () {
      var account = $id.account;

      if (!$id.account) return;
      if ($scope.is_loading_more) return;
      if (!$scope.has_more) return;

      $scope.tx_load_status = 'loading';

      var params = {
        'account': account,
        'ledger_index_min': -1,
//        'binary': true,
        'limit': Options.transactions_per_page
      };

      if (marker) params.marker = marker;

      $network.remote.request_account_tx(params)
        .on('success', function(data) {
          $scope.$apply(function () {
            if (data.transactions) {
              var transactions = [];

              if (data.marker) {
                // XXX There is a server-side bug right now:
                //     Instead of returning no marker if there are no more
                //     results, the server returns the marker it was given as an
                //     input.
                if (marker &&
                    "undefined" !== typeof data.marker.ledger &&
                    data.marker.ledger === marker.ledger &&
                    "undefined" !== typeof data.marker.seq &&
                    data.marker.seq === marker.seq) {
                  $scope.has_more = false;
                } else {
                  marker = data.marker;
                }
              } else $scope.has_more = false;

              data.transactions.forEach(function (e) {
                var tx = rewriter.processTxn(e.tx, e.meta, account);
                tx = filterEffects(tx);
                if (tx) {
                  $scope.transactions.push(tx);
                }
              });

              // Loading mode
              $scope.tx_load_status = false;
            }
          });
        })
        .on('error', function(err){
          $scope.tx_load_status = 'error';
          console.log(err);
        }).request();
    };

    $scope.reset();
    $scope.loadMore();

    $scope.$on('$idAccountLoad', function () {
      $scope.reset();
      $scope.loadMore();
    });

    $rpTracker.track('Page View', {'Page Name': 'Balance'});
  }]);
};

module.exports = BalanceTab;
