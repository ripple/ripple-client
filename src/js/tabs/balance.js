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
  var self = this;
  var app = this.app;

  module.controller('BalanceCtrl', ['$scope', 'rpId',
                                     function ($scope, $id)
  {
    var remote = app.net.remote;

    if (!$id.loginStatus) return $id.goId();

    $scope.transactions = [];
    $scope.current_page = 1;

    // filter effect types
    // Show only offer_funded, offer_partially_funded, offer_canceled, offer_bought side effects
    var filterEffects = function (events) {
      var transactions = [];

      $.each(events,function(){
        var event = this;
        var effects = [];

        if (event.effects) {
          $.each(event.effects, function(){
            var effect = this;
            if (effect.type == 'offer_funded'
                || effect.type == 'offer_partially_funded'
                || effect.type == 'offer_canceled'
                || effect.type == 'offer_bought') {
              effects.push(effect);
            }
          });

          event.effects = effects;
        }

        if (effects.length || event.transaction) {
          transactions.push(event);
        }
      });

      return transactions;
    };

    // First page transactions
    $scope.$watch('events', function(){
      if ($scope.transactions.length === 0) {
        $scope.transactions = filterEffects($scope.events);
      }
    }, true);

    $scope.$watch('history_count', function(){
      // Pages count
      $scope.pages_count = Math.ceil($scope.history_count / Options.transactions_per_page);

      // Next page number
      if (!$scope.next_page && $scope.pages_count > 1) {
        $scope.next_page = 2;
      }
    }, true);

    $scope.goToPage = function(page) {
      // Click on disabled links
      if (!page) return;

      var account = app.id.account;
      var offset = (page - 1) * Options.transactions_per_page;

      // Next, prev page numbers
      $scope.prev_page = page > 1 ? page-1 : 0;
      $scope.next_page = page < $scope.pages_count ? page+1 : 0;

      $scope.current_page = page;

      // Loading mode
      $scope.loading = true;

      remote.request_account_tx(account, 0, 9999999, true, Options.transactions_per_page, offset)
        .on('success', function(data) {
            $scope.transactions = [];
            $scope.$apply(function () {
              if (data.transactions) {
                var transactions = [];

                data.transactions.forEach(function (e) {
                  var tx = rewriter.processTxn(e.tx, e.meta, account);
                  if (tx) {
                    transactions.push(tx);
                  }
                });

                $scope.transactions = filterEffects(transactions);

                // Loading mode
                $scope.loading = false;
              }
            });
        })
        .on('error', function(err){console.log(err);}).request();
    }
  }]);
};

module.exports = BalanceTab;
