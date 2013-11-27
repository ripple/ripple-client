var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;
var Amount = ripple.Amount;

var TradeTab = function ()
{
  Tab.call(this);
};

util.inherits(TradeTab, Tab);

TradeTab.prototype.mainMenu = 'trade';

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
  module.controller('TradeCtrl', ['rpBooks', '$scope', 'rpId', 'rpNetwork', '$routeParams', '$location', '$filter', 'rpTracker',
                                  function (books, $scope, $id, $network, $routeParams, $location, $filter, $rpTracker)
  {
    if (!$id.loginStatus) return $id.goId();

    $scope.pairs_query = webutil.queryFromOptions($scope.pairs_all);

    var widget = {
      first: '',
      price: '',
      second: '',
      mode: 'trade'
    };

    var OrderbookFilterOpts = {
      'precision':5,
      'min_precision':5,
      'max_sig_digits':20
    };

    $scope.reset = function (keepPair) {
      var pair = keepPair ? $scope.order.currency_pair :
            store.get('ripple_trade_currency_pair') || $scope.pairs_all[0].name;
      var fIssuer = keepPair ? $scope.order.first_issuer : $id.account;
      var sIssuer = keepPair ? $scope.order.second_issuer : $id.account;

      // Decide which listing to show
      var listing;
      if ($scope.order) {
        listing = $scope.order.listing;
      }
      else if(store.get('ripple_trade_listing')) {
        listing = store.get('ripple_trade_listing');
      }
      else {
        listing = 'orderbook';
      }

      $scope.order = {
        currency_pair: pair,
        first_currency: pair.slice(0, 3),
        second_currency: pair.slice(4, 7),
        first_issuer: fIssuer,
        second_issuer: sIssuer,
        listing: listing,

        buy: jQuery.extend(true, {}, widget),
        sell: jQuery.extend(true, {}, widget),

        // This variable is true if both the pair and the issuers are set to
        // valid values. It is used to enable or disable all the functionality
        // on the page.
        valid_settings: false
      };

      updateSettings();
    };

    /**
     * Resets single order widget. Used to reset widgets after
     * the order confirmation.
     *
     * @param type (buy, sell)
     */
    $scope.reset_widget = function(type) {
      $scope.order[type] = jQuery.extend(true, {}, widget);

      updateSettings();
    };

    /**
     * Sets current listing, and stores it in local storage.
     *
     * @param listing (my, orderbook)
     */
    $scope.setListing = function(listing){
      $scope.order.listing = listing;

      store.set('ripple_trade_listing', listing);
    };

    /**
     * Fill buy/sell widget when clicking on orderbook orders (sum or price)
     *
     * @param type (buy/sell)
     * @param order (order)
     * @param sum fill sum or not
     */
    $scope.fill_widget = function (type, order, sum) {
      $scope.reset_widget(type);

      $scope.order[type].price = order.price.to_human().replace(',','');
      
      if (sum) {
        $scope.order[type].first = order.sum.to_human().replace(',','');
        $scope.calc_second(type);
      }
    };

    /**
     * Happens when user clicks on "Place Order" button.
     *
     * @param type (buy, sell)
     */
    // TODO type is this....
    $scope.place_order = function (type) {
      $scope.order[type].mode = "confirm";

      if (type === 'buy') {
        $scope.order.buy.sell_amount = $scope.order.buy.second_amount;
        $scope.order.buy.buy_amount = $scope.order.buy.first_amount;
      } else {
        $scope.order.sell.sell_amount = $scope.order.sell.first_amount;
        $scope.order.sell.buy_amount = $scope.order.sell.second_amount;
      }

      // TODO track order type
      $rpTracker.track('Trade order confirmation page', {
        'Currency pair': $scope.order.currency_pair
      });
    };

    /**
     * Happens when user clicks on "Cancel" in "My Orders".
     */
    $scope.cancel_order = function ()
    {
      var tx = $network.remote.transaction();
      tx.offer_cancel($id.account, this.entry.seq);
      tx.on('success', function() {
        $rpTracker.track('Trade order cancellation', {
          'Status': 'success'
        });
      });
      // TODO handle this
      tx.on('error', function (err) {
        $rpTracker.track('Trade order cancellation', {
          'Status': 'error',
          'Message': err.engine_result
        });
      });
      tx.submit();

      this.cancelling = true;
    };

    /**
     * Happens when user clicks "Confirm" in order confirmation view.
     *
     * @param type (buy, sell)
     */
    $scope.order_confirmed = function (type)
    {
      var order = $scope.order[type];
      var tx = $network.remote.transaction();

      tx.offer_create(
        $id.account,
        order.buy_amount,
        order.sell_amount
      );

      // Sets a tfSell flag. This is the only way to distinguish
      // sell offers from buys.
      if (type === 'sell')
        tx.set_flags('Sell');

      tx.on('proposed', function (res) {
        $scope.$apply(function () {
          setEngineStatus(res, false, type);

          // Remember currency pair and increase usage number
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

      tx.on('success', function(res){
        $scope.$apply(function () {
          setEngineStatus(res, true, type);

          order.mode = "done";

          $rpTracker.track('Trade order result', {
            'Status': 'success',
            'Currency pair': $scope.order.currency_pair
          });
        });
      });

      tx.on('error', function (err) {
        $scope.$apply(function () {
          setEngineStatus(err, false, type);

          order.mode = "done";
        });

        $rpTracker.track('Trade order result', {
          'Status': 'error',
          'Message': err.engine_result,
          'Currency pair': $scope.order.currency_pair
        });
      });

      tx.submit();

      order.mode = "sending";
    };

    /**
     * Handle transaction result
     */
    function setEngineStatus(res, accepted, type) {
      var order = $scope.order[type];

      order.engine_result = res.engine_result;
      order.engine_result_message = res.engine_result_message;
      switch (res.engine_result.slice(0, 3)) {
        case 'tes':
          order.tx_result = accepted ? "cleared" : "pending";
          break;
        case 'tem':
          order.tx_result = "malformed";
          break;
        case 'ter':
          order.tx_result = "failed";
          break;
        case 'tec':
          order.tx_result = "claim";
          break;
        case 'tel':
          order.tx_result = "local";
          break;
        //case 'tep':
        default:
          order.tx_result = "unknown";
          console.warn("Unhandled engine status encountered:"+res.engine_result);
          break;
      }
    }

    $scope.update_first = function (type) {
      var order = $scope.order[type];
      var first_currency = $scope.order.first_currency || "XRP";
      var formatted = "" + order.first + " " + first_currency;

      order.first_amount = ripple.Amount.from_human(formatted);

      if (first_currency !== 'XRP') order.first_amount.set_issuer($scope.order.first_issuer);
    };

    $scope.update_price = function (type) {
      var order = $scope.order[type];
      var second_currency = $scope.order.second_currency || "XRP";
      var formatted = "" + order.price + " " + second_currency;

      order.price_amount = ripple.Amount.from_human(formatted);

      if (second_currency !== 'XRP') order.price_amount.set_issuer($scope.order.second_issuer);
    };

    $scope.update_second = function (type) {
      var order = $scope.order[type];
      var second_currency = $scope.order.second_currency || "XRP";
      var formatted = "" + order.second + " " + second_currency;

      order.second_amount = ripple.Amount.from_human(formatted);

      if (second_currency !== 'XRP') order.second_amount.set_issuer($scope.order.second_issuer);
    };

    /**
     * Calculate second when first or price changes.
     *
     * @param type
     */
    $scope.calc_second = function (type) {
      var order = $scope.order[type];

      $scope.update_first(type);
      $scope.update_price(type);
      if (order.price_amount && order.price_amount.is_valid() &&
          order.first_amount && order.first_amount.is_valid()) {
        order.second_amount = order.price_amount.product_human(order.first_amount);
        order.second = +order.second_amount.to_human({group_sep: false});
      }
    };

    /**
     * Calculate first when second changes.
     *
     * @param type
     */
    $scope.calc_first = function (type) {
      var order = $scope.order[type];

      $scope.update_second(type);
      $scope.update_price(type);
      if (order.price_amount  && order.price_amount.is_valid() &&
          order.second_amount && order.second_amount.is_valid()) {
        order.first_amount = order.second_amount.ratio_human(order.price_amount);
        order.first = +order.first_amount.to_human({group_sep: false});
      }
    };

    // This functions is called whenever the settings, specifically the pair and
    // the issuer(s) have been modified. It checks the new configuration and
    // sets $scope.valid_settings.
    function updateSettings() {
      var order = $scope.order;

      var pair = order.currency_pair;

      // Invalid currency pair
      if ("string" !== typeof pair || !pair.match(/^[a-z]{3}\/[a-z]{3}$/i)) {
        order.first_currency = 'XRP';
        order.second_currency = 'XRP';
        order.valid_settings = false;
        return;
      }

      var first_currency = order.first_currency = pair.slice(0, 3);
      var second_currency = order.second_currency = pair.slice(4, 7);
      var first_issuer = ripple.UInt160.from_json(order.first_issuer);
      var second_issuer = ripple.UInt160.from_json(order.second_issuer);

      // Invalid issuers or XRP/XRP pair
      if ((first_currency !== 'XRP' && !first_issuer.is_valid()) ||
          (second_currency !== 'XRP' && !second_issuer.is_valid()) ||
          (first_currency === 'XRP' && second_currency === 'XRP')) {
        order.valid_settings = false;
        return;
      }

      order.valid_settings = true;

      // Remember pair
      // Produces currency/issuer:currency/issuer
      var key = "" +
        order.first_currency +
        (order.first_currency === 'XRP' ? "" : "/" + order.first_issuer) +
        ":" +
        order.second_currency +
        (order.second_currency === 'XRP' ? "" : "/" + order.second_issuer);

      // Load orderbook
      if (order.prev_settings !== key) {
        loadOffers();

        order.prev_settings = key;
      }

      // Update widgets
      ['buy','sell'].forEach(function(type){
        $scope.update_first(type);
        $scope.update_price(type);
        $scope.update_second(type);
      });

      updateCanBuySell();
    }

    /**
     * Tries to guess an issuer based on user's preferred issuer or highest trust.
     *
     * @param currency
     * @param exclude_issuer
     * @returns issuer
     */
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
          if (counterparty != exclude_issuer) {
            return counterparty;
          }
        }
      } catch (e) {}

      // We found nothing
      return null;
    }

    function resetIssuers(force) {
      var guess;
      var order = $scope.order;

      if (force) {
        order.first_issuer = null;
        order.second_issuer = null;
      }

      ['first','second'].forEach(function(prefix){
        if (!order[prefix + '_issuer'] &&
            order[prefix + '_currency'] &&
            order[prefix + '_currency'] !== 'XRP' &&
            (guess = guessIssuer(order[prefix + '_currency']))) {
          order[prefix + '_issuer'] = guess;
        }
      });

      // If the same currency, exclude first issuer for second issuer guess
      if (order.first_currency === order.second_currency &&
          order.first_issuer === order.second_issuer &&
          (guess = guessIssuer(order.first_currency, order.first_issuer))) {
        order.second_issuer = guess;
      }
    }

    /**
     * $scope.edit_first_issuer
     * $scope.save_first_issuer
     * $scope.edit_second_issuer
     * $scope.save_second_issuer
     */
    ['first','second'].forEach(function(prefix){
      $scope['edit_' + prefix + '_issuer'] = function () {
        $scope.show_issuer_form = prefix;
        $scope.order[prefix + '_issuer_edit'] = webutil.unresolveContact($scope.userBlob.data.contacts, $scope.order[prefix + '_issuer']);

        setImmediate(function () {
          $('#' + prefix + '_issuer').select();
        });
      };

      $scope['save_' + prefix + '_issuer'] = function () {
        $scope.order[prefix + '_issuer'] = webutil.resolveContact($scope.userBlob.data.contacts, $scope.order[prefix + '_issuer_edit']);
        $scope.show_issuer_form = false;

        updateSettings();

        // Persist issuer setting
        if ($scope.order.valid_settings && $scope.order[prefix + '_currency'] !== 'XRP') {
          if (prefix === 'first') {
            $scope.userBlob.data.preferred_issuer[$scope.order['first_currency']] = $scope.order['first_issuer'];
          } else {
            if ($scope.order.first_currency === $scope.order.second_currency) {
              $scope.userBlob.data.preferred_second_issuer[$scope.order.second_currency] =
                  $scope.order.second_issuer;
            } else {
              $scope.userBlob.data.preferred_issuer[$scope.order.second_currency] =
                  $scope.order.second_issuer;
            }
          }
        }
      };
    });

    /**
     * Load orderbook
     */
    function loadOffers() {
      // Make sure we unsubscribe from any previously loaded orderbook
      if ($scope.book && "function" === typeof $scope.book.unsubscribe) {
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

    /**
     * Determine whether user can sell and/or buy on this pair
     */
    var updateCanBuySell = function () {
      var first_currency = $scope.order.first_currency;
      var second_currency = $scope.order.second_currency;

      var canBuy = second_currency.toUpperCase() === 'XRP' ||
          ($scope.balances[second_currency] && $scope.balances[second_currency].total.is_positive());
      var canSell = first_currency.toUpperCase() === 'XRP' ||
          ($scope.balances[first_currency] && $scope.balances[first_currency].total.is_positive());

      $scope.order.buy.showWidget = canBuy;
      $scope.order.sell.showWidget = canSell;
    };

    var rpamountFilter = $filter('rpamount');

    $scope.$watchCollection('book', function () {
      if (!jQuery.isEmptyObject($scope.book)) {
        ['asks','bids'].forEach(function(type){
          if ($scope.book[type]) {
            $scope.book[type].forEach(function(order){
              order.showSum = rpamountFilter(order.sum,OrderbookFilterOpts);
              order.showPrice = rpamountFilter(order.price,OrderbookFilterOpts);

              var showValue = type === 'bids' ? 'TakerPays' : 'TakerGets';
              order['show' + showValue] = rpamountFilter(order[showValue],OrderbookFilterOpts);
            });
          }
        });
      }
    });

    /**
     * Watch widget field changes
     */
    ['buy','sell'].forEach(function(type){
      $scope.$watch('order.' + type + '.first', function () {
        $scope.update_first(type);
      }, true);

      $scope.$watch('order.' + type + '.price', function () {
        $scope.update_price(type);
      }, true);

      $scope.$watch('order.' + type + '.second', function () {
        $scope.update_second(type);
      }, true);
    });

    $scope.$watch('order.currency_pair', function (pair) {
      store.set('ripple_trade_currency_pair', pair);
      updateSettings();
      resetIssuers(true);
    }, true);

    $scope.$watch('userBlob', function () {
      resetIssuers(false);
    }, true);

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

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.issuer_query = webutil.queryFromOptions(contacts);
    }, true);

    $scope.reset();

    /**
     * Route includes currency pair
     */
    if ($routeParams.first && $routeParams.second) {
      var routeIssuers = {};
      var routeCurrencies = {};

      ['first','second'].forEach(function(prefix){
        routeIssuers[prefix] = $routeParams[prefix].match(/:(.+)$/);
        routeCurrencies[prefix] = $routeParams[prefix].match(/^(\w{3})/);

        if (routeIssuers[prefix]) {
          if (ripple.UInt160.is_valid(routeIssuers[prefix][1])) {
            $scope.order[prefix + '_issuer'] = routeIssuers[prefix][1];
          } else {
            $location.path('/trade');
          }
        }
      });

      if (routeCurrencies['first'] && routeCurrencies['second']) {
        if (routeCurrencies['first'][1] !== routeCurrencies['second'][1]) {
          $scope.order.currency_pair = routeCurrencies['first'][1] + '/' + routeCurrencies['second'][1];
        } else {
          $location.path('/trade');
        }
      }

      updateSettings();
    }

    $rpTracker.track('Page View', {'Page Name': 'Trade'});
  }]);
};

module.exports = TradeTab;
