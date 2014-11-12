var util = require('util');
var webutil = require('../util/web');
var Tab = require('../client/tab').Tab;
var Amount = ripple.Amount;
var rewriter = require('../util/jsonrewriter');
var Currency = ripple.Currency;

var TradeTab = function ()
{
  Tab.call(this);
};

util.inherits(TradeTab, Tab);

TradeTab.prototype.tabName = 'trade';
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
  module.controller('TradeCtrl', ['rpBooks', '$scope', 'rpId', 'rpNetwork',
                                  '$routeParams', '$location', '$filter',
                                  'rpTracker', 'rpKeychain', '$rootScope',
                                  'rpPopup', '$timeout',
                                  function (books, $scope, id, $network,
                                            $routeParams, $location, $filter,
                                            $rpTracker, keychain, $rootScope,
                                            popup, $timeout)
  {
    if (!id.loginStatus) return id.goId();

    // Remember user preference on Convert vs. Trade
    $rootScope.ripple_exchange_selection_trade = true;

    $scope.pairs_query = $scope.pairs_all;

    $scope.fatFingerErr = false;

    $scope.cancelOrder = {
      seq: null,
      success: false,
      errorMsg: null
    };

    // Details for an order that is edited and sent to Ripple for modification
    $scope.editOrder = {
      seq: null,
      type: null,
      oldPrice: null,
      oldPriceDisp: '',
      newPrice: '',
      priceChanged: false,
      oldQuantity: null,
      oldQuantityDisp: '',
      newQuantity: '',
      quantityChanged: false,
      quantityFilled: false,
      quantityFilledWarn: false,
      fatFingerWarn: false,
      editing: false,
      cancelling: false,
      cancelOrderGone: false,
      exists: true,
      replacing: false,
      replaceSuccess: false,
      replaceError: false,
      orderbookReady: false,
      ccyPair: null,
      buy_amount: null,
      sell_amount: null
    };

    var currencyPairChangedByNonUser = false;

    var widget = {
      first: '',
      price: '',
      second: '',
      mode: 'trade'
    };

    var OrderbookFilterOpts = {
      'precision':5,
      'min_precision':5,
      'max_sig_digits':20,
      'abs_precision':5
    };

    var REF_DATE_OFFSET = 5*60000;
    var MIXPNL_MODIFY_EVENT = 'Modify order result';

    // Scroll to the location where alert messages will be displayed
    var scrollToMessages = function() {
      var jqElem = jQuery('#myOrdersMsg');
      if (jqElem[0]) $timeout(function(){ jqElem[0].scrollIntoView(true); });
    };

    // Format a Ripple Amount for editing by the user
    var formatForEdit = function(amount) {
      var formatted = $filter('rpamount')(amount, {group_sep:false, hard_precision:true, max_sig_digits:20});

      return formatted;
    };

    // Create a Ripple Amount from primitives
    var createAmount = function(value, currency, issuer) {
      var ccy = currency || Currency.from_json("XRP");
      var formatted = "" + value + " " + (ccy.has_interest() ? ccy.to_hex() : ccy.get_iso());

      var amount = Amount.from_human(formatted, {reference_date: new Date(+new Date() + REF_DATE_OFFSET)});
      if (! ccy.is_native()) amount.set_issuer(issuer);

      return amount;
    };

    // Set state of whether an order's price has been edited by the user
    $scope.priceEdited = function() {
      $scope.editOrder.priceChanged = $scope.editOrder.oldPriceDisp !== $scope.editOrder.newPrice;
    };

    // Set state of whether an order's quantity (amount) has been edited by the user
    $scope.quantityEdited = function() {
      $scope.editOrder.quantityChanged = $scope.editOrder.oldQuantityDisp !== $scope.editOrder.newQuantity;
    };

    // When the user clicks button/link to enable editing of Price and Amount (Quantity) values
    $scope.beginEditOrder = function() {
      var myOrder = this.entry;
      // Do not allow editing of an order that has no quantity left but is still displayed as it hasn't been removed from offers
      if (myOrder.first.is_zero()) return;

      $scope.cancelOrder.errorMsg = null;
      $scope.cancelEditOrder();  // if another order is in edit mode

      // Ensure that the orderbook matches the currency pair of the order being edited, for the user 
      // to reference and to ensure that the Fat Finger check will compare with the correct price.
      $scope.editOrder.orderbookReady = false;
      if ($scope.goto_order_currency.bind(this)()) {
        // Reset Buy and Sell widgets as the currency pair has changed so the price & qty will not be relevant
        $scope.reset_widget('buy', true);
        $scope.reset_widget('sell', true);
      }
      $scope.editOrder.ccyPair = $scope.order.currency_pair;

      $scope.editOrder.editing = true;
      $scope.editOrder.seq = myOrder.seq;
      $scope.editOrder.type = myOrder.type;

      // save current price & qty
      $scope.editOrder.oldPrice = Amount.from_json(myOrder.second).ratio_human(myOrder.first, {reference_date: new Date()});
      $scope.editOrder.oldPriceDisp = formatForEdit($scope.editOrder.oldPrice);
      $scope.editOrder.newPrice = $scope.editOrder.oldPriceDisp;

      $scope.editOrder.oldQuantity = myOrder.first;
      $scope.editOrder.oldQuantityDisp = formatForEdit(myOrder.first);
      $scope.editOrder.newQuantity = $scope.editOrder.oldQuantityDisp;
    };

    // After the user has clicked button/link to confirm the Price and/or Quantity to change
    $scope.prepareOrderModify = function() {
      if (! ($scope.editOrder.newPrice && $scope.editOrder.newQuantity)) return;

      var myOrder = this.entry;
      var type = $scope.editOrder.type;

      // Quantity (Sell / Gets)
      var oldOrderQty = $scope.editOrder.oldQuantity;
      var newOrderQty = $scope.editOrder.quantityChanged ?
        createAmount($scope.editOrder.newQuantity, oldOrderQty.currency(), oldOrderQty.issuer()) : oldOrderQty;

      var oldOrderPrice = $scope.editOrder.oldPrice;
      var newOrderPrice = $scope.editOrder.priceChanged ?
        createAmount($scope.editOrder.newPrice, oldOrderPrice.currency(), oldOrderPrice.issuer()) : oldOrderPrice;

      if ($scope.editOrder.priceChanged || $scope.editOrder.quantityChanged) {
        var newOrderValue = newOrderPrice.product_human(newOrderQty);

        if (type === 'buy') {
          $scope.editOrder.sell_amount = newOrderValue.clone();
          $scope.editOrder.buy_amount = newOrderQty.clone();
        } else {
          $scope.editOrder.sell_amount = newOrderQty.clone();
          $scope.editOrder.buy_amount = newOrderValue.clone();
        }

        checkBeforeModify();
      }
    };

    var checkBeforeModify = function() {
      // Check if the price is far from the current market price. If so, ask user for confirmation, otherwise proceed.
      $scope.editOrder.fatFingerWarn = $scope.fatFingerCheck($scope.editOrder.type, $scope.editOrder.newPrice);
      if (! $scope.editOrder.fatFingerWarn) $scope.modifyOrder();
    };

    // Start the order modification with 1st of 2 transactions
    $scope.modifyOrder = function() {
      if ($scope.editOrder.priceChanged || $scope.editOrder.quantityChanged) {
        $scope.editOrder.editing = false;
        $scope.editOrder.cancelling = true;

        // First, Cancel existing order. If successful, place modified order in callback
        $scope.cancel_order($scope.editOrder.seq, true, createAfterCancel, cancelOrderError);
        // It is possible to cancel and create in one transaction by passing the seq of the order to be cancelled,
        // but a two stage method is utilized instead to minimize the risk of the problem detected by the 
        // qtyChangedOnDeleted function. (JIRA: RT-1214)
      }
    };

    // Step 1 of modification was successful, start 2nd of 2 transaction
    var createAfterCancel = function(qtyChanged) {
      $scope.editOrder.cancelling = false;
      $scope.editOrder.seq = null;

      if (! qtyChanged) {
        // Now place new order to replace old (cancelled) order
        $scope.editOrder.replacing = true;
        scrollToMessages();

        $scope.order_confirmed($scope.editOrder.type, $scope.editOrder.ccyPair, $scope.editOrder, true, createOrderSuccess, createOrderError);
      }
    };

    // Step 1 of modification failed, so abort
    var cancelOrderError = function() {
      $scope.editOrder.cancelling = false;

      if (! $scope.offers[$scope.editOrder.seq]) $scope.editOrder.cancelOrderGone = true;
    };

    // Step 2 of modification was successful and is complete
    var createOrderSuccess = function(seq) {
      $scope.editOrder.replacing = false;
      $scope.editOrder.replaceSuccess = true;
      $scope.editOrder.seq = null;
      $scope.editOrder.type = null;
    };

    // Step 2 of modification failed
    var createOrderError = function() {
      $scope.editOrder.replacing = false;
      $scope.editOrder.replaceError = true;

      if (! $scope.offers[$scope.editOrder.seq]) $scope.editOrder.exists = false;
    };

    // Reset all fields for no order being edited
    $scope.cancelEditOrder = function() {
      $scope.editOrder.seq = null;
      $scope.editOrder.type = null;

      $scope.editOrder.priceChanged = false;
      $scope.editOrder.oldPrice = null;
      $scope.editOrder.oldPriceDisp = '';
      $scope.editOrder.newPrice = '';

      $scope.editOrder.quantityChanged = false;
      $scope.editOrder.oldQuantity = null;
      $scope.editOrder.oldQuantityDisp = '';
      $scope.editOrder.newQuantity = '';

      $scope.editOrder.cancelOrderGone = false;
      $scope.editOrder.quantityFilled = false;
      $scope.editOrder.quantityFilledWarn = false;
      $scope.editOrder.fatFingerWarn = false;

      $scope.editOrder.editing = false;
      $scope.editOrder.exists = true;
      $scope.editOrder.replaceSuccess = false;
      $scope.editOrder.replaceError = false;

      $scope.editOrder.ccyPair = null;
      $scope.editOrder.buy_amount = null;
      $scope.editOrder.sell_amount = null;
    };

    $scope.fatFingerShouldWarn = function() {
      return $scope.editOrder.fatFingerWarn;
    };

    $scope.reset = function () {
      $scope.executedOnOfferCreate = 'none';
      var pair = store.get('ripple_trade_currency_pair') || $scope.pairs_all[0].name;

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
        // These will be filled in by updateSettings
        //   first_currency
        //   second_currency
        first_issuer: null,
        second_issuer: null,
        listing: listing,

        buy: jQuery.extend(true, {}, widget),
        sell: jQuery.extend(true, {}, widget),

        // This variable is true if both the pair and the issuers are set to
        // valid values. It is used to enable or disable all the functionality
        // on the page.
        valid_settings: false
      };

      updateSettings();
      updateMRU();
    };

    /**
     * Resets single order widget. Used to reset widgets after
     * the order confirmation.
     *
     * @param type (buy, sell)
     */
    $scope.reset_widget = function(type, widgetOnly) {
      $scope.order[type] = jQuery.extend(true, {}, widget);

      if (widgetOnly) return;

      updateSettings();
      updateMRU();
    };

    /**
     * Sets current listing, and stores it in local storage.
     *
     * @param listing (my, orderbook)
     */
    $scope.setListing = function(listing){
      $scope.order.listing = listing;

      if (!store.disabled) {
        store.set('ripple_trade_listing', listing);
      }
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

      $scope.fatFingerErr = $scope.fatFingerCheck(type, $scope.order[type].price);

      // TODO track order type
      $rpTracker.track('Trade order confirmation page', {
        'Currency pair': $scope.order.currency_pair,
        'Address': $scope.userBlob.data.account_id
      });
    };

    /**
     * Happens when user cliens the currency in "My Orders".
     */
    $scope.goto_order_currency = function()
    {
      if (!this.entry) return;
      var entry = this.entry;
      var order = $scope.order;
      currencyPairChangedByNonUser = true;
      order.first_currency = this.entry.first.currency().to_json();
      order.first_issuer = this.entry.first.issuer().to_json();
      order.second_currency = this.entry.second.currency().to_json();
      order.second_issuer = this.entry.second.issuer().to_json();
      order.currency_pair = this.entry.first.currency().to_json() + '/' + this.entry.second.currency().to_json();

      var changedPair = updateSettings();
      updateMRU();

      return changedPair;
    };

    /**
     * Happens when user clicks on "Cancel" in "My Orders".
     */
    $scope.cancel_order = function (seq, modifying, successCb, errorCb)
    {
      if (seq) $scope.cancelOrder.seq = seq;
      else $scope.cancelOrder.seq = this.entry ? this.entry.seq : this.order.Sequence;
      if (! $scope.cancelOrder.seq) return;

      var order = this.order;
      var tx    = $network.remote.transaction();
      $scope.cancelOrder.errorMsg = null;

      tx.offer_cancel(id.account, $scope.cancelOrder.seq);

      tx.on('success', function(res) {
        if ($scope.offers[$scope.cancelOrder.seq]) $scope.offers[$scope.cancelOrder.seq].cancelling = false;
        order.cancelling = false;

        if (modifying) {
          var qtyChanged = qtyChangedOnDeleted(res);
          if (successCb) successCb(qtyChanged);

          if (qtyChanged) {
            $rpTracker.track(MIXPNL_MODIFY_EVENT, {
              'Status': 'error',
              'Message': 'Qty changed after cancel requested by client',
              'Address': $scope.userBlob.data.account_id,
              'Transaction ID': res.tx_json.hash
            });
          }
        }
        else {
          $scope.cancelOrder.success = true;
          scrollToMessages();

          if (successCb) successCb();

          $rpTracker.track('Trade order cancellation', {
            'Status': 'success',
            'Address': $scope.userBlob.data.account_id
          });
        }
      });

      tx.on('error', function (err) {
        console.log("cancel error: ", err);

        if ($scope.offers[$scope.cancelOrder.seq]) $scope.offers[$scope.cancelOrder.seq].cancelling = false;
        order.cancelling  = false;
        $scope.cancelOrder.errorMsg = err.engine_result_message;

        if (errorCb) errorCb();

        if (!$scope.$$phase) {
          $scope.$apply();
        }

        var eventProp = {
          'Status': 'error',
          'Message': err.engine_result,
          'Address': $scope.userBlob.data.account_id
        };

        if (modifying) $rpTracker.track(MIXPNL_MODIFY_EVENT, eventProp);
        else $rpTracker.track('Trade order cancellation', eventProp);
      });

      keychain.requestSecret(id.account, id.username, function (err, secret) {
        if (err) {
          //err should equal 'canceled' here, other errors are not passed through
          if ($scope.offers[$scope.cancelOrder.seq]) $scope.offers[$scope.cancelOrder.seq].cancelling = false;
          order.cancelling = false;
          return;
        }

        tx.secret(secret);
        tx.submit();
      });

      $scope.offers[$scope.cancelOrder.seq].cancelling = true;
      order.cancelling = true;
    };

    $scope.dismissCancelError = function() {
      $scope.cancelOrder.seq = null;
      $scope.cancelOrder.errorMsg = null;
      $scope.editOrder.cancelOrderGone = false;
    };

    /**
     * Happens when user clicks "Confirm" in order confirmation view.
     *
     * @param type (buy, sell)
     */
    $scope.order_confirmed = function (type, ccyPair, ord, modifying, successCb, errorCb)
    {
      var order = ord ? ord : $scope.order[type];
      var tx = $network.remote.transaction();
debugger;
      tx.offer_create(
        id.account,
        order.buy_amount,
        order.sell_amount
      );

      // Add memo to tx
      tx.addMemo('client', 'rt' + $rootScope.version);

      // Sets a tfSell flag. This is the only way to distinguish
      // sell offers from buys.
      if (type === 'sell')
        tx.set_flags('Sell');

      tx.on('proposed', function (res) {
        setEngineStatus(res, false, type);
      });

      tx.on('success', function(res) {
        setEngineStatus(res, true, type);

        if (! modifying) order.mode = "done";

        var tx = rewriter.processTxn(res, res.metadata, id.account);

        for (var i = 0; i < tx.effects.length; i++) {
          var messageType = tx.effects[i].type;

          switch (messageType) {
            case 'trust_change_balance':
              $scope.executedOnOfferCreate = 'all';
              break;
            case 'offer_partially_funded':
              $scope.executedOnOfferCreate = 'partial';
              break;
            default:
              $scope.executedOnOfferCreate = 'none';
              break;
          }
        }

        if (successCb) {
          var seq = res.tx_json && res.tx_json.Sequence ? res.tx_json.Sequence : null;
          successCb(seq);
        }

        if (!$scope.$$phase) {
          $scope.$apply();
        }

        var eventProp = {
          'Status': 'success',
          'Currency pair': ccyPair,
          'Address': $scope.userBlob.data.account_id,
          'Transaction ID': res.tx_json.hash
        };

        if (modifying) $rpTracker.track(MIXPNL_MODIFY_EVENT, eventProp);
        else $rpTracker.track('Trade order result', eventProp);
      });

      tx.on('error', function (err) {
        setEngineStatus(err, false, type);

        if (! modifying) order.mode = "done";

        if (errorCb) errorCb();

        if (!$scope.$$phase) {
          $scope.$apply();
        }

        var eventProp = {
          'Status': 'error',
          'Message': err.engine_result,
          'Currency pair': ccyPair,
          'Address': $scope.userBlob.data.account_id,
          'Transaction ID': err.tx_json.hash
        };

        if (modifying) $rpTracker.track(MIXPNL_MODIFY_EVENT, eventProp);
        else $rpTracker.track('Trade order result', eventProp);
      });

      keychain.requestSecret(id.account, id.username, function (err, secret) {
        if (err) {

          //err should equal 'canceled' here, other errors are not passed through
          if (! modifying) order.mode = 'trade';
          return;
        }

        tx.secret(secret);
        tx.submit();
      });

      if (! modifying) order.mode = "sending";
    };

    $scope.loadMore = function () {
      $scope.orderbookLength = books.getLength();
      var multiplier = 30;

      Options.orderbook_max_rows += multiplier;

      loadOffers();

      $scope.orderbookState = (($scope.orderbookLength - Options.orderbook_max_rows + multiplier) < 1) ? 'full' : 'ready';
    };

    // Rare ? edge case:
    // 1. User edits order price/qty and confirms modify.
    // 2. rippled receives the request and cancels the old order.
    // 3. Between 1 and 2 the qty on the order changed. If this was as a result of additional execution(s),
    //    then the order qty that was displayed to the user is higher than the order qty that was cancelled.
    // 4. If the user edited the qty to increase it, then there is the possibility that they will be filled 
    //    more than expected.
    // The purpose of this fn is to check for this condition and display a popup if it occurs.
    function qtyChangedOnDeleted(result) {
      var changedQty;

      if (result.metadata && result.metadata.AffectedNodes) {
        var oldQty = $scope.editOrder.oldQuantity;
        var nodes = result.metadata.AffectedNodes;

        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].DeletedNode) {
            var delNode = nodes[i].DeletedNode;

            if (delNode.LedgerEntryType && delNode.LedgerEntryType === 'Offer' && delNode.FinalFields) {
              var delFields = delNode.FinalFields;

              if (delFields.Sequence == $scope.cancelOrder.seq && delFields.TakerPays && delFields.TakerGets) {
                var cancelledQty;
                if ($scope.editOrder.type === 'buy') cancelledQty = Amount.from_json(delFields.TakerPays);
                else if ($scope.editOrder.type === 'sell') cancelledQty = Amount.from_json(delFields.TakerGets);

                // Calculate the difference in qty if order qty changed before cancel
                if (cancelledQty && ! cancelledQty.equals(oldQty)) changedQty = oldQty.subtract(cancelledQty);
              }
              break;  // Found the Cancelled order
            }
          }
        }

        // If did not find the Cancelled order, difference is whole qty
        if (i === nodes.length) changedQty = oldQty;
      }

      // Show a modal popup to inform the user if there is a difference is qty
      if (changedQty && changedQty.is_positive()) {
        var popupScope = $scope.$new();
        popupScope.order = { qtyChangeAfterCancel: changedQty };

        popupScope.cancel = function() {
          popup.close();
          popupScope.$destroy();
        };

        popup.blank(require('../../jade/popup/tradePopup.jade')(), popupScope);
        return true;
      }
      else return false;
    }

    /**
     * Handle transaction result
     */
    function setEngineStatus(res, accepted, type, ord) {
      var order = ord ? ord : $scope.order[type];

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
      var first_currency = $scope.order.first_currency || Currency.from_json("XRP");
      var formatted = "" + order.first + " " + (first_currency.has_interest() ? first_currency.to_hex() : first_currency.get_iso());

      order.first_amount = ripple.Amount.from_human(formatted, {reference_date: new Date(+new Date() + REF_DATE_OFFSET)});

      if (!first_currency.is_native()) order.first_amount.set_issuer($scope.order.first_issuer);
    };

    $scope.update_price = function (type) {
      var order = $scope.order[type];
      var second_currency = $scope.order.second_currency || Currency.from_json("XRP");
      var formatted = "" + order.price + " " + (second_currency.has_interest() ? second_currency.to_hex() : second_currency.get_iso());

      order.price_amount = ripple.Amount.from_human(formatted, {reference_date: new Date(+new Date() + REF_DATE_OFFSET)});

      if (!second_currency.is_native()) order.price_amount.set_issuer($scope.order.second_issuer);
    };

    $scope.update_second = function (type) {
      var order = $scope.order[type];
      var second_currency = $scope.order.second_currency || Currency.from_json("XRP");
      var formatted = "" + order.second + " " + (second_currency.has_interest() ? second_currency.to_hex() : second_currency.get_iso());

      order.second_amount = ripple.Amount.from_human(formatted, {reference_date: new Date(+new Date() + REF_DATE_OFFSET)});

      if (!second_currency.is_native()) order.second_amount.set_issuer($scope.order.second_issuer);
    };

    $scope.fatFingerCheck = function(type, price) {
      var fatFingerMarginMultiplier = 1.1;  // i.e. 10%
      var bestPrice;

      if (type === 'buy') bestPrice = $scope.book.bids[0].showPrice;
      else if (type === 'sell') bestPrice = $scope.book.asks[0].showPrice;
      bestPrice = +bestPrice.replace(',','');

      return (bestPrice &&
          (price > (bestPrice * fatFingerMarginMultiplier) ||
          price < (bestPrice / fatFingerMarginMultiplier)));
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
        order.second_amount = order.price_amount.product_human(+order.first);
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

        if (!order.price_amount.is_native()) {
          var price = order.price_amount.to_human();
          var currency = order.price_amount.currency().to_json();
          var issuer = order.price_amount.issuer().to_json();

          order.first_amount = Amount.from_json(order.second_amount.to_text_full()).ratio_human(Amount.from_json(price + '/' + currency + '/' + issuer), {reference_date: new Date()});
        } else {
          order.first_amount = Amount.from_json(order.second_amount.to_text_full()).ratio_human(Amount.from_json(order.price_amount.to_text()), {reference_date: new Date()});
        }
        order.first = +order.first_amount.to_human({group_sep: false});
      }
    };

    $scope.flip_issuer = function () {
      var order = $scope.order;
      if (!order.valid_settings) return;
      var currency = order.first_currency;
      var issuer = order.first_issuer;
      var pair = order.currency_pair.split('/');
      currencyPairChangedByNonUser = true;
      order.first_currency = order.second_currency;
      order.first_issuer = order.second_issuer;
      order.second_currency = currency;
      order.second_issuer = issuer;
      order.currency_pair = pair[1] + '/' + pair[0];

      updateSettings();
      updateMRU();
    };

    // This functions is called whenever the settings, specifically the pair and
    // the issuer(s) have been modified. It checks the new configuration and
    // sets $scope.valid_settings.
    function updateSettings() {
      var order = $scope.order;
      var pair = order.currency_pair;

      if (!store.disabled) {
        store.set('ripple_trade_currency_pair', pair);
      }

      if ("string" !== typeof pair) pair = "";
      pair = pair.split('/');

      // Invalid currency pair
      if (pair.length != 2 || pair[0].length === 0 || pair[1].length === 0) {
        order.first_currency = Currency.from_json('XRP');
        order.second_currency = Currency.from_json('XRP');
        order.valid_settings = false;
        return;
      }

      var first_currency = order.first_currency = ripple.Currency.from_json(pair[0]);
      var second_currency = order.second_currency = ripple.Currency.from_json(pair[1]);
      var first_issuer = ripple.UInt160.from_json(order.first_issuer);
      var second_issuer = ripple.UInt160.from_json(order.second_issuer);

      // Invalid issuers or XRP/XRP pair
      if ((!first_currency.is_native() && !first_issuer.is_valid()) ||
          (!second_currency.is_native() && !second_issuer.is_valid()) ||
          (first_currency.is_native() && second_currency.is_native())) {
        order.valid_settings = false;
        return;
      }

      order.valid_settings = true;

      // Remember pair
      // Produces currency/issuer:currency/issuer
      var key = "" +
        order.first_currency.to_json() +
        (order.first_currency.is_native() ? "" : "/" + order.first_issuer) +
        ":" +
        order.second_currency._iso_code +
        (order.second_currency.is_native() ? "" : "/" + order.second_issuer);

      var changedPair = false;
      // Load orderbook
      if (order.prev_settings !== key) {
        changedPair = true;
        loadOffers();

        order.prev_settings = key;
      }
      else if ($scope.book.ready) $scope.editOrder.orderbookReady = true;

      // Update widgets
      ['buy','sell'].forEach(function(type){
        $scope.update_first(type);
        $scope.update_price(type);
        $scope.update_second(type);
      });

      updateCanBuySell();

      return changedPair;
    }

    // This functions is called after the settings have been modified.
    // It updates the most recent used pairs dropdown.
    function updateMRU() {
      var order = $scope.order;
      if (!order.valid_settings) return;
      if (!order.first_currency || !order.second_currency) return;
      if (!order.first_currency.is_valid() || !order.second_currency.is_valid()) return;
      var canonical_name = order.first_currency.to_json() + "/" + order.second_currency.to_json();

      // Remember currency pair and set last used time
      var found = false;
      for (var i = 0; i < $scope.pairs_all.length; i++) {
        if ($scope.pairs_all[i].name.toLowerCase() == canonical_name.toLowerCase()) {
          var pair_obj = $scope.pairs_all[i];
          pair_obj.name = canonical_name;
          pair_obj.last_used = new Date().getTime();
          $scope.pairs_all.splice(i, 1);
          $scope.pairs_all.unshift(pair_obj);
          found = true;
          break;
        }
      }

      if (!found) {
        $scope.pairs_all.unshift({
          "name": canonical_name,
          "last_used": new Date().getTime()
        });
      }

      if (!$scope.$$phase) {
        $scope.$apply();
      }
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
            (guess = guessIssuer(order[prefix + '_currency'].to_json()))) {
          order[prefix + '_issuer'] = guess;
        }
      });

      // If the same currency, exclude first issuer for second issuer guess
      if (order.first_currency.equals(order.second_currency) &&
          order.first_issuer === order.second_issuer &&
          (guess = guessIssuer(order.first_currency.to_json(), order.first_issuer))) {
        order.second_issuer = guess;
      }
    }

    /**
     * $scope.first_issuer_edit
     * $scope.first_issuer_save
     * $scope.second_issuer_edit
     * $scope.second_issuer_save
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
        updateMRU();

        // Persist issuer setting
        if ($scope.order.valid_settings && !$scope.order[prefix + '_currency'].is_native()) {
          if (prefix === 'first') {
            $scope.userBlob.set("/preferred_issuer/"+
                                $scope.userBlob.escapeToken($scope.order.first_currency.to_json()),
                                $scope.order.first_issuer);
          } else {
            if ($scope.order.first_currency.equals($scope.order.second_currency)) {
              $scope.userBlob.set("/preferred_second_issuer/"+
                                  $scope.userBlob.escapeToken($scope.order.second_currency.to_json()),
                                  $scope.order.second_issuer);
            } else {
              $scope.userBlob.set("/preferred_issuer/"+
                                  $scope.userBlob.escapeToken($scope.order.second_currency.to_json()),
                                  $scope.order.second_issuer);
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
        currency: ($scope.order.first_currency.has_interest() ? $scope.order.first_currency.to_hex() : $scope.order.first_currency.get_iso()),
        issuer: $scope.order.first_issuer
      }, {
        currency: ($scope.order.second_currency.has_interest() ? $scope.order.second_currency.to_hex() : $scope.order.second_currency.get_iso()),
        issuer: $scope.order.second_issuer
      }, $scope.address);

      $scope.orderbookState = 'ready';
    }

    /**
     * Determine whether user can sell and/or buy on this pair
     */
    var updateCanBuySell = function () {
      var first_currency = $scope.order.first_currency;
      var first_issuer = $scope.order.first_issuer;
      var second_currency = $scope.order.second_currency;
      var second_issuer = $scope.order.second_issuer;

      var canBuy = second_currency.is_native() ||
          second_issuer == $scope.address ||
          ($scope.lines[second_issuer+($scope.order.second_currency.has_interest() ? $scope.order.second_currency.to_hex() : $scope.order.second_currency.to_json())]
            && $scope.lines[second_issuer+($scope.order.second_currency.has_interest() ? $scope.order.second_currency.to_hex() : $scope.order.second_currency.to_json())].balance.is_positive());

      var canSell = first_currency.is_native() ||
          first_issuer == $scope.address ||
          ($scope.lines[first_issuer+($scope.order.first_currency.has_interest() ? $scope.order.first_currency.to_hex() : $scope.order.first_currency.to_json())]
            && $scope.lines[first_issuer+($scope.order.first_currency.has_interest() ? $scope.order.first_currency.to_hex() : $scope.order.first_currency.to_json())].balance.is_positive());

      $scope.order.buy.showWidget = canBuy;
      $scope.order.sell.showWidget = canSell;
    };

    var rpamountFilter = $filter('rpamount');

    $scope.$watchCollection('book', function () {
      if (! jQuery.isEmptyObject($scope.book) && $scope.book.ready) {
        $scope.editOrder.orderbookReady = true;

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
      // If order with a different currency pair is being edited, end the edit otherwise it will do the
      // Fat Finger check against the wrong orderbook when the Replace action is clicked
      if ($scope.editOrder.ccyPair !== $scope.order.currency_pair && $scope.editOrder.editing) $scope.cancelEditOrder();

      if (currencyPairChangedByNonUser) {
        currencyPairChangedByNonUser = false;
        return;
      }

      updateSettings();
      resetIssuers(true);
      updateMRU();
    }, true);

    $scope.$on('$blobUpdate', function () {
      resetIssuers(false);
    });


    $scope.$watch('order.type', function () {
      updateCanBuySell();
    });

    $scope.$watch('order.first_issuer', function () {
      updateSettings();
      updateMRU();
    });

    $scope.$watch('order.second_issuer', function () {
      updateSettings();
      updateMRU();
    });

    var updateBalances = function(){
      updateCanBuySell();
      resetIssuers(false);
    };

    $scope.$on('$balancesUpdate', updateBalances);

    $scope.$watch('userBlob.data.contacts', function (contacts) {
      $scope.issuer_query = webutil.queryFromContacts(contacts);
    }, true);

    $scope.$watchCollection('offers', function(){
      $scope.offersCount = _.size($scope.offers);

      if ($scope.offersCount) {
        var editSeq = $scope.editOrder.seq;
        if (editSeq && $scope.offers[editSeq]) {
          var newQty = $scope.offers[editSeq].first;

          if (! $scope.editOrder.cancelling) {
            if (newQty.is_zero()) {
              // Occasionally an order that has been completely filled is shown as zero qty and there is a delay before it is deleted.
              // If this order is being edited, leave edit mode as the modify would fail
              $scope.cancelEditOrder();
              $scope.offers[editSeq].isZero = true;
            }
            else if (! newQty.equals($scope.editOrder.oldQuantity)) {
              // The qty of the order changed while being edited, so update and warn
              $scope.editOrder.newQuantity = formatForEdit(newQty);
              $scope.editOrder.quantityChanged = false;
              $scope.editOrder.quantityFilled = true;
              $scope.editOrder.quantityFilledWarn = true;
            }
          }
        }
      }
    });

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

      if (routeCurrencies.first && routeCurrencies.second) {
        if (routeCurrencies.first[1] !== routeCurrencies.second[1]) {
          $scope.order.currency_pair = routeCurrencies.first[1] + '/' + routeCurrencies.second[1];
        } else {
          $location.path('/trade');
        }
      }

      updateSettings();
      updateMRU();
    }

    updateBalances();

    // Unsubscribe from the book when leaving this page
    $scope.$on('$destroy', function(){
      if ($scope.book && "function" === typeof $scope.book.unsubscribe) {
        $scope.book.unsubscribe();
      }
    });
  }]);
};

module.exports = TradeTab;
