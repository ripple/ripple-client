var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;
var Amount = ripple.Amount;

var TradeTab = function ()
{
  Tab.call(this);
};

util.inherits(TradeTab, Tab);

TradeTab.prototype.mainMenu = 'advanced';

TradeTab.prototype.generateHtml = function ()
{
  return require('../../jade/tabs/trade.jade')();
};

TradeTab.prototype.angularDeps = Tab.prototype.angularDeps.concat(['books']);

TradeTab.prototype.extraRoutes = [ 
  { name: '/trade/:first/:second' }
];

TradeTab.prototype.angular = function(module)
{
  module.controller('TradeCtrl', ['rpBooks', '$scope', 'rpId', 'rpNetwork', '$routeParams', '$location', '$filter',
                                  function (books, $scope, $id, $network, $routeParams, $location, $filter)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.mode = "confirm";
    $scope.bookFormatted = {};

    var pairs = $scope.pairs_all;
    $scope.pairs_query = webutil.queryFromOptions(pairs);

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.issuer_query = webutil.queryFromOptions(contacts);
    }, true);

    $scope.reset = function (keepPair) {
      var pair = keepPair ? $scope.order.currency_pair :
            store.get('ripple_trade_currency_pair') || pairs[0].name;
      var fIssuer = keepPair ? $scope.order.first_issuer : $id.account;
      var sIssuer = keepPair ? $scope.order.second_issuer : $id.account;
      var type = keepPair ? $scope.order.type : 'buy';

      if ($scope.orderForm) $scope.orderForm.$setPristine();
      $scope.mode = "trade";
      $scope.order = {
        type: type,
        first: '',
        price: '',
        second: '',
        currency_pair: pair,
        first_currency: pair.slice(0, 3),
        second_currency: pair.slice(4, 7),
        first_issuer: fIssuer,
        second_issuer: sIssuer,
        listing: $scope.order ? $scope.order.listing : 'my',

        // This variable is true if both the pair and the issuers are set to
        // valid values. It is used to enable or disable all the functionality
        // on the page.
        valid_settings: false
      };

      updateSettings();
    };

    $scope.setListing = function(listing){
      $scope.order.listing = listing;
      $scope.order.userSetListing = true;
    };

    $scope.$watch('offers',function(){
      if (!$scope.order.userSetListing)
        $scope.order.listing = $.isEmptyObject($scope.offers) ? 'orderbook' : 'my';
    }, true);

    $scope.back = function () {
      $scope.mode = "trade";
    };

    $scope.place_order = function () {
      $scope.mode = "confirm";
      if ($scope.order.type === 'buy') {
        $scope.order.sell_amount = $scope.order.second_amount;
        $scope.order.buy_amount = $scope.order.first_amount;
      } else {
        $scope.order.sell_amount = $scope.order.first_amount;
        $scope.order.buy_amount = $scope.order.second_amount;
      }
    };

    $scope.cancel_order = function ()
    {
      var tx = $network.remote.transaction();
      tx.offer_cancel($id.account, this.entry.seq);
      tx.on('proposed', function () {
        $scope.$apply(function () {
        });
      });
      tx.on('error', function () {
        setImmediate(function () {
          $scope.$apply(function () {
            $scope.mode = "error";
          });
        });
      });
      tx.submit();

      this.cancelled = true;
    };

    $scope.order_confirmed = function ()
    {
      var tx = $network.remote.transaction();
      tx.offer_create($id.account, $scope.order.buy_amount, $scope.order.sell_amount);

      // Sets a tfSell flag. This is the only way to distinguish sell offers from buys.
      if ($scope.order.type === 'sell')
        tx.set_flags('Sell');

      tx.on('proposed', function (res) {
        $scope.$apply(function () {
          setEngineStatus(res, false);
          $scope.done(tx.hash);

          // Remember pair and increase order
          var found;

          for (var i = 0; i < $scope.pairs_all.length; i++) {
            if ($scope.pairs_all[i].name === $scope.order.currency_pair) {
              $scope.pairs_all[i].order++;
              found = true;
              break;
            }
          }

          if (!found) {
            $scope.pairs_all.push({
              "name": $scope.order.currency_pair,
              "order": 1
            });
          }
        });
      });
      tx.on('error', function () {
        setImmediate(function () {
          $scope.$apply(function () {
            $scope.mode = "error";
          });
        });
      });
      tx.submit();

      $scope.mode = "sending";
    };

    $scope.done = function (hash)
    {
      $scope.mode = "done";
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
          $scope.tx_result = "claim";
          break;
        case 'tep':
          console.warn("Unhandled engine status encountered!");
      }
    }

    $scope.$watch('order.currency_pair', function (pair) {
      store.set('ripple_trade_currency_pair', pair);
      updateSettings();
      resetIssuers(true);
     }, true);

    $scope.$watch('order.first', function (amount_str) {
      $scope.update_first();
    }, true);

    $scope.$watch('order.price', function (amount_str) {
      $scope.update_price();
    }, true);

    $scope.$watch('order.second', function (amount_str) {
      $scope.update_second();
    }, true);

    $scope.$watch('userBlob', function () {
      resetIssuers(false);
    }, true);

    $scope.update_first = function () {
      var first_currency = $scope.order.first_currency || "XRP";
      var formatted = "" + $scope.order.first + " " + first_currency;

      $scope.order.first_amount = ripple.Amount.from_human(formatted);

      if (first_currency !== 'XRP') $scope.order.first_amount.set_issuer($scope.order.first_issuer);
    };

    $scope.update_price = function () {
      var second_currency = $scope.order.second_currency || "XRP";
      var formatted = "" + $scope.order.price + " " + second_currency;

      $scope.order.price_amount = ripple.Amount.from_human(formatted);

      if (second_currency !== 'XRP') $scope.order.price_amount.set_issuer($scope.order.second_issuer);
    };

    $scope.update_second = function () {
      var second_currency = $scope.order.second_currency || "XRP";
      var formatted = "" + $scope.order.second + " " + second_currency;

      $scope.order.second_amount = ripple.Amount.from_human(formatted);

      if (second_currency !== 'XRP') $scope.order.second_amount.set_issuer($scope.order.second_issuer);
    };

    $scope.calc_second = function () {
      $scope.update_first();
      $scope.update_price();
      if ($scope.order.price_amount && $scope.order.price_amount.is_valid() &&
          $scope.order.first_amount && $scope.order.first_amount.is_valid()) {
        $scope.order.second_amount =
          $scope.order.price_amount.product_human($scope.order.first_amount);
        $scope.order.second = +$scope.order.second_amount.to_human({group_sep: false});
      }
    };

    $scope.calc_first = function () {
      $scope.update_second();
      $scope.update_price();
      if ($scope.order.price_amount  && $scope.order.price_amount.is_valid() &&
          $scope.order.second_amount && $scope.order.second_amount.is_valid()) {
        $scope.order.first_amount =
          $scope.order.second_amount.ratio_human($scope.order.price_amount);
        $scope.order.first = +$scope.order.first_amount.to_human({group_sep: false});
      }
    };

    // This functions is called whenever the settings, specifically the pair and
    // the issuer(s) have been modified. It checks the new configuration and
    // sets $scope.valid_settings.
    function updateSettings() {
      var order = $scope.order;

      var pair = order.currency_pair;
      if ("string" !== typeof pair ||
          !pair.match(/^[a-z]{3}\/[a-z]{3}$/i)) {
        order.first_currency = 'XRP';
        order.second_currency = 'XRP';
        order.valid_settings = false;
        return;
      }
      var first_currency = order.first_currency = pair.slice(0, 3);
      var second_currency = order.second_currency = pair.slice(4, 7);

      var first_issuer = ripple.UInt160.from_json(order.first_issuer);
      var second_issuer = ripple.UInt160.from_json(order.second_issuer);
      if ((first_currency !== 'XRP' && !first_issuer.is_valid()) ||
          (second_currency !== 'XRP' && !second_issuer.is_valid())) {
        order.valid_settings = false;
        return;
      }

      if (order.type === "buy") {
        order.sell_currency = order.second_currency;
        order.buy_currency = order.first_currency;
        order.sell_issuer = order.second_issuer;
        order.buy_issuer = order.first_issuer;
      } else {
        order.sell_currency = order.first_currency;
        order.buy_currency = order.second_currency;
        order.sell_issuer = order.first_issuer;
        order.buy_issuer = order.second_issuer;
      }
      order.valid_settings = true;

      var key = "" +
            order.first_currency +
            (order.first_currency === 'XRP' ? "" : "/" +order.first_issuer) +
            ":" +
            order.second_currency +
            (order.second_currency === 'XRP' ? "" : "/" +order.second_issuer);

      if (order.prev_settings !== key) {
        loadOffers();

        order.prev_settings = key;
      }

      updateCanBuySell();
    }

    function guessIssuer(currency, exclude_issuer) {
      var guess;

      // First guess: An explicit issuer preference setting in the user's blob
      try {
        guess = $scope.userBlob.data.preferred_issuer[currency];
        if (guess && guess === exclude_issuer) {
          guess = $scope.userBlob.data.preferred_second_issuer[currency];
        }
        if (guess) return guess;
      } catch (e) {}

      // Second guess: The user's highest trust line in this currency
      try {
        var issuers = $scope.balances[currency].components;
        for (var counterparty in issuers) {
          if (counterparty != exclude) {
            return counterparty;
          }
        }
      } catch (e) {}

      // We found nothing
      return null;
    }

    function resetIssuers(force) {
      var guess;

      if (force) {
        $scope.order.first_issuer = null;
        $scope.order.second_issuer = null;
      }

      if (!$scope.order.first_issuer &&
          $scope.order.first_currency &&
          $scope.order.first_currency !== 'XRP' &&
          (guess = guessIssuer($scope.order.first_currency))) {
        $scope.order.first_issuer = guess;
      }

      if (!$scope.order.second_issuer &&
          $scope.order.second_currency &&
          $scope.order.second_currency !== 'XRP' &&
          (guess = guessIssuer($scope.order.second_currency))) {
        $scope.order.second_issuer = guess;
      }

      // If the same currency, exclude first issuer for second issuer guess
      if ($scope.order.first_currency === $scope.order.second_currency &&
          $scope.order.first_issuer === $scope.order.second_issuer &&
          (guess = guessIssuer($scope.order.first_currency, $scope.order.first_issuer))) {
        $scope.order.second_issuer = guess;
      }
    }

    $scope.edit_first_issuer = function () {
      $scope.show_issuer_form = 'first';
      $scope.order.first_issuer_edit = webutil.unresolveContact($scope.userBlob.data.contacts, $scope.order.first_issuer);

      setImmediate(function () {
        $('#first_issuer').select();
      });

    };

    $scope.edit_second_issuer = function () {
      $scope.show_issuer_form = 'second';
      $scope.order.second_issuer_edit = webutil.unresolveContact($scope.userBlob.data.contacts, $scope.order.second_issuer);

      setImmediate(function () {
        $('#second_issuer').select();
      });
    };

    $scope.save_first_issuer = function () {
      $scope.order.first_issuer = webutil.resolveContact($scope.userBlob.data.contacts, $scope.order.first_issuer_edit);
      $scope.show_issuer_form = false;

      updateSettings();

      // Persist issuer setting
      if ($scope.order.valid_settings &&
          $scope.order.first_currency !== 'XRP') {
        $scope.userBlob.data.preferred_issuer[$scope.order.first_currency] =
          $scope.order.first_issuer;
      }
    };

    $scope.save_second_issuer = function () {
      $scope.order.second_issuer = webutil.resolveContact($scope.userBlob.data.contacts, $scope.order.second_issuer_edit);
      $scope.show_issuer_form = false;

      updateSettings();

      // Persist issuer setting
      if ($scope.order.valid_settings &&
          $scope.order.second_currency !== 'XRP') {

        if ($scope.order.first_currency === $scope.order.second_currency) {
          $scope.userBlob.data.preferred_second_issuer[$scope.order.second_currency] =
            $scope.order.second_issuer;
        } else {
          $scope.userBlob.data.preferred_issuer[$scope.order.second_currency] =
            $scope.order.second_issuer;
        }
      }
    };

    function loadOffers() {
      // Make sure we unsubscribe from any previously loaded orderbook
      if ($scope.book &&
          "function" === typeof $scope.book.unsubscribe) {
        $scope.book.unsubscribe();
      }

      $scope.book = books.get({
        currency: $scope.order.first_currency,
        issuer: $scope.order.first_issuer
      }, {
        currency: $scope.order.second_currency,
        issuer: $scope.order.second_issuer
      }, $scope.address);
    }

    var rpamountFilter = $filter('rpamount');

    $scope.$watchCollection('book', function () {
      if (!jQuery.isEmptyObject($scope.book)) {
        $scope.bookFormatted = jQuery.extend(true, {}, $scope.book);

        if ($scope.book.bids) {
          $scope.bookFormatted.bids.forEach(function(order){
            order.sum = rpamountFilter(order.sum,{'rel_precision': 4});
            order.TakerPays = rpamountFilter(order.TakerPays,{'rel_precision': 4});
            order.price = rpamountFilter(order.price,{'rel_precision': 4, 'rel_min_precision': 2});
          });
        }

        if ($scope.book.asks) {
          $scope.bookFormatted.asks.forEach(function(order){
            order.sum = rpamountFilter(order.sum,{'rel_precision': 4});
            order.TakerGets = rpamountFilter(order.TakerGets,{'rel_precision': 4});
            order.price = rpamountFilter(order.price,{'rel_precision': 4, 'rel_min_precision': 2});
          });
        }
      }
    });

    $scope.$watch('order.type', function () {
      updateCanBuySell();
    });

    $scope.$watch('order.first_issuer', function () {
      updateSettings();
    });

    $scope.$watch('order.second_issuer', function () {
      updateSettings();
    });

    $scope.$watch('balances', function () {
      updateCanBuySell();
      resetIssuers(false);
    }, true);

    // Can sell/buy
    var updateCanBuySell = function () {
      var canBuy = $scope.order.second_currency.toUpperCase() === 'XRP' ||
        ($scope.balances[$scope.order.second_currency] && $scope.balances[$scope.order.second_currency].total.is_positive());
      var canSell = $scope.order.first_currency.toUpperCase() === 'XRP' ||
        ($scope.balances[$scope.order.first_currency] && $scope.balances[$scope.order.first_currency].total.is_positive());

      $scope.order.showWidget = $scope.order.type === 'sell' ? canSell : canBuy;
    };

    $scope.reset();

    if ($routeParams.first && $routeParams.second) {
      var firstIssuer    = $routeParams.first.match(/:(.+)$/);
      var firstCurrency  = $routeParams.first.match(/^(\w{3})/);
      var secondIssuer   = $routeParams.second.match(/:(.+)$/);
      var secondCurrency = $routeParams.second.match(/^(\w{3})/);

      if (firstIssuer) {
        if (ripple.UInt160.is_valid(firstIssuer[1])) {
          $scope.order.first_issuer = firstIssuer[1];
        } else {
          $location.path('/trade');
        }
      }

      if (secondIssuer) {
        if (ripple.UInt160.is_valid(secondIssuer[1])) {
          $scope.order.second_issuer = secondIssuer[1];
        } else {
          $location.path('/trade');
        }
      }

      if (firstCurrency && secondCurrency) {
        firstCurrency = firstCurrency[1], secondCurrency = secondCurrency[1];
        if (firstCurrency !== secondCurrency) {
          $scope.order.currency_pair = firstCurrency + '/' + secondCurrency;
        } else {
          $location.path('/trade');
        }
      }

      updateSettings();
    }

  }]);
};

module.exports = TradeTab;
