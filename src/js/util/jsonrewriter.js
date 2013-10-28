/**
 * Simple static class for processing server-side JSON.
 */
var JsonRewriter = module.exports = {
  /**
   * Filter affected nodes by type.
   *
   * If affectedNodes is not a valid set of nodes, returns an empty array.
   */
  filterAnodes: function (affectedNodes, type) {
    if (!affectedNodes) return [];

    return affectedNodes.filter(function (an) {
      an = an.CreatedNode ? an.CreatedNode :
           an.ModifiedNode ? an.ModifiedNode :
           {};

      return an.LedgerEntryType === type;
    });
  },

  /**
   * Returns resulting (new or modified) fields from an affected node.
   */
  getAnodeResult: function (an) {
    an = an.CreatedNode ? an.CreatedNode :
         an.ModifiedNode ? an.ModifiedNode :
         {};

    var fields = $.extend({}, an.NewFields, an.FinalFields);

    return fields;
  },

  /**
   * Takes a metadata affected node and returns a simpler JSON object.
   *
   * The resulting object looks like this:
   *
   *   {
   *     // Type of diff, e.g. CreatedNode, ModifiedNode
   *     diffType: 'CreatedNode'
   *
   *     // Type of node affected, e.g. RippleState, AccountRoot
   *     entryType: 'RippleState',
   *
   *     // Index of the ledger this change occurred in
   *     ledgerIndex: '01AB01AB...',
   *
   *     // Contains all fields with later versions taking precedence
   *     //
   *     // This is a shorthand for doing things like checking which account
   *     // this affected without having to check the diffType.
   *     fields: {...},
   *
   *     // Old fields (before the change)
   *     fieldsPrev: {...},
   *
   *     // New fields (that have been added)
   *     fieldsNew: {...},
   *
   *     // Changed fields
   *     fieldsFinal: {...}
   *   }
   */
  processAnode: function (an) {
    var result = {};

    ["CreatedNode", "ModifiedNode", "DeletedNode"].forEach(function (x) {
      if (an[x]) result.diffType = x;
    });

    if (!result.diffType) return null;

    an = an[result.diffType];

    result.entryType = an.LedgerEntryType;
    result.ledgerIndex = an.LedgerIndex;

    result.fields = $.extend({}, an.PreviousFields, an.NewFields, an.FinalFields);
    result.fieldsPrev = an.PreviousFields || {};
    result.fieldsNew = an.NewFields || {};
    result.fieldsFinal = an.FinalFields || {};

    return result;
  },

  /**
   * Convert transactions into a more useful (for our purposes) format.
   *
   * The main operation this function performs is to change the view on the
   * transaction from a neutral view to a subjective view specific to our
   * account.
   *
   * For example, rather than having a sender and receiver, the transaction has
   * a counterparty and a flag whether it is incoming or outgoing.
   *
   * processTxn returns main purpose of transaction and side effects.
   *
   * Main purpose
   *  - Payment (sent/received)
   *  - TrustSet (trusting/trusted)
   *  - OfferCreate (offernew)
   *
   * Side effects
   *  - balance_change
   *  - Trust (trust_create_local, trust_create_remote, trust_change_local, trust_change_remote, trust_change_balance)
   *  - Offer (offer_created, offer_funded, offer_partially_funded, offer_cancelled, offer_bought)
   */
  processTxn: function (tx, meta, account) {
    var obj = {};

    // Currency balances that have been affected by the transaction
    var affected_currencies = [];

    // Main transaction
    if (tx.Account === account
        || (tx.Destination && tx.Destination === account)
        || (tx.LimitAmount && tx.LimitAmount.issuer === account)) {
      var transaction = {};

      switch (tx.TransactionType) {
        case 'Payment':
          var amount = ripple.Amount.from_json(tx.Amount);

          transaction.type = tx.Account === account ? 'sent' : 'received';
          transaction.counterparty = tx.Account === account ? tx.Destination : tx.Account;
          transaction.amount = amount;
          transaction.currency = amount.currency().to_json();
          break;

        case 'TrustSet':
          transaction.type = tx.Account === account ? 'trusting' : 'trusted';
          transaction.counterparty = tx.Account === account ? tx.LimitAmount.issuer : tx.Account;
          transaction.amount = ripple.Amount.from_json(tx.LimitAmount);
          transaction.currency = tx.LimitAmount.currency;
          break;

        case 'OfferCreate':
          transaction.type = 'offernew';
          transaction.pays = ripple.Amount.from_json(tx.TakerPays);
          transaction.gets = ripple.Amount.from_json(tx.TakerGets);
          break;

        case 'OfferCancel':
          transaction.type = 'offercancel';
          break;

        case 'AccountSet':
          transaction.type = 'accountset';
          break;

        default:
          console.log('Unknown transaction type: "'+tx.TransactionType+'"', tx);
      }

      if (!$.isEmptyObject(transaction)) {
        if (tx.Flags)
          transaction.flags = tx.Flags;

        obj.transaction = transaction;
      }
    }

    // Side effects
    meta.AffectedNodes.forEach(function (n) {
      var node = JsonRewriter.processAnode(n);
      var feeEff;
      var effect = {};

      // AccountRoot - Current account node
      if (node.entryType === "AccountRoot" && node.fields.Account === account) {
        obj.accountRoot = node.fields;

        if (node.fieldsPrev.Balance) {
          var balance = ripple.Amount.from_json(node.fields.Balance);

          // Fee
          if(tx.Account === account && tx.Fee) {
            feeEff = {
              type: "fee",
              amount: ripple.Amount.from_json(tx.Fee).negate(),
              balance: balance
            };
          }

          // Updated XRP Balance
          if (tx.Fee != node.fieldsPrev.Balance - node.fields.Balance) {
            if (feeEff)
              balance = balance.subtract(feeEff.amount);

            effect.type = "balance_change";
            effect.amount = balance.subtract(node.fieldsPrev.Balance);
            effect.balance = balance;

            // balance_changer is set to true if the transaction / effect has changed one of the account balances
            obj.balance_changer = effect.balance_changer = true;
            affected_currencies.push('XRP');
          }
        }
      }

      // RippleState - Ripple Lines
      if (node.entryType === "RippleState"
          && (node.fields.HighLimit.issuer === account || node.fields.LowLimit.issuer === account)) {

        var high = node.fields.HighLimit;
        var low = node.fields.LowLimit;

        // New trust line
        if (node.diffType === "CreatedNode") {
          effect.limit = ripple.Amount.from_json(high.value > 0 ? high : low);
          effect.limit_peer = ripple.Amount.from_json(high.value > 0 ? low : high);

          if ((high.value > 0 && high.issuer === account)
              || (low.value > 0 && low.issuer === account)) {
            effect.type = "trust_create_local";
          } else {
            effect.type = "trust_create_remote";
          }
        }

        // Modified trust line
        else if (node.diffType === "ModifiedNode" || node.diffType === "DeletedNode") {
          var highPrev = node.fieldsPrev.HighLimit;
          var lowPrev = node.fieldsPrev.LowLimit;

          // Trust Balance change
          if (node.fieldsPrev.Balance) {
            effect.type = "trust_change_balance";

            var issuer =  node.fields.Balance.value > 0 || node.fieldsPrev.Balance.value > 0
              ? high.issuer : low.issuer;

            effect.amount = high.issuer === account
              ? effect.amount = ripple.Amount.from_json(
                  node.fieldsPrev.Balance.value
                      + "/" + node.fieldsPrev.Balance.currency
                      + "/" + issuer).subtract(node.fields.Balance)
              : effect.amount = ripple.Amount.from_json(
                  node.fields.Balance.value
                      + "/" + node.fields.Balance.currency
                      + "/" + issuer).subtract(node.fieldsPrev.Balance);

            obj.balance_changer = effect.balance_changer = true;
            affected_currencies.push(high.currency.toUpperCase());
          }

          // Trust Limit change
          else if (highPrev || lowPrev) {
            if (high.issuer === account) {
              effect.limit = ripple.Amount.from_json(high);
              effect.limit_peer = ripple.Amount.from_json(low);
            } else {
              effect.limit = ripple.Amount.from_json(low);
              effect.limit_peer = ripple.Amount.from_json(high);
            }

            if (highPrev) {
              effect.prevLimit = ripple.Amount.from_json(highPrev);
              effect.type = high.issuer === account ? "trust_change_local" : "trust_change_remote";
            }
            else if (lowPrev) {
              effect.prevLimit = ripple.Amount.from_json(lowPrev);
              effect.type = high.issuer === account ? "trust_change_remote" : "trust_change_local";
            }
          }
        }

        if (!$.isEmptyObject(effect)) {
          effect.counterparty = high.issuer === account ? low.issuer : high.issuer;
          effect.currency = high.currency;
          effect.balance = high.issuer === account
            ? ripple.Amount.from_json(node.fields.Balance).negate(true)
            : ripple.Amount.from_json(node.fields.Balance);

          if (obj.transaction && obj.transaction.type === "trust_change_balance") {
            obj.transaction.balance = effect.balance;
          }
        }
      }

      // Offer
      else if (node.entryType === "Offer") {

        // For new and cancelled offers we use "fields"
        var fieldSet = node.fields;

        // Current account offer
        if (node.fields.Account === account) {

          // Partially funded offer [and deleted.. no more funds]
          /* Offer has been partially funded and deleted (because of the luck of funds)
             if the node is deleted and the TakerGets/TakerPays field has been changed */
          if (node.diffType === "ModifiedNode" ||
            (node.diffType === "DeletedNode"
              && node.fieldsPrev.TakerGets
              && !ripple.Amount.from_json(node.fieldsFinal.TakerGets).is_zero())) {
            effect.type = 'offer_partially_funded';

            if (node.diffType !== "DeletedNode")
              effect.remaining = ripple.Amount.from_json(node.fields.TakerGets);
          }
          else {
            // New / Funded / Cancelled offer
            effect.type = node.diffType === "CreatedNode"
              ? 'offer_created'
              : node.fieldsPrev.TakerPays
                ? 'offer_funded'
                : 'offer_cancelled';

            // For funded offers we use "fieldsPrev".
            if (effect.type === 'offer_funded')
              fieldSet = node.fieldsPrev;

            // We don't count cancelling an offer as a side effect if it's
            // already the primary effect of the transaction.
            if (effect.type === 'offer_cancelled' &&
                obj.transaction &&
                obj.transaction.type === "offercancel") {

              // Fill in remaining information about offer
              obj.transaction.gets = fieldSet.TakerGets;
              obj.transaction.pays = fieldSet.TakerPays;
            }
          }

          effect.seq = +node.fields.Sequence;
        }

        // Another account offer. We care about it only if our transaction changed the offer amount (we bought currency)
        else if(tx.Account === account && !$.isEmptyObject(node.fieldsPrev) /* Offer is unfunded if node.fieldsPrev is empty */) {
          effect.type = 'offer_bought';
        }

        if (effect.type) {
          effect.gets = ripple.Amount.from_json(fieldSet.TakerGets);
          effect.pays = ripple.Amount.from_json(fieldSet.TakerPays);

          if ('offer_partially_funded' === effect.type || 'offer_bought' === effect.type) {
            effect.got = ripple.Amount.from_json(node.fieldsPrev.TakerGets).subtract(node.fields.TakerGets);
            effect.paid = ripple.Amount.from_json(node.fieldsPrev.TakerPays).subtract(node.fields.TakerPays);
          }
        }
      }

      if (!$.isEmptyObject(effect)) {
        if (node.diffType === "DeletedNode") {
          effect.deleted = true;
        }

        if (!obj.effects) obj.effects = [];
        obj.effects.push(effect);
      }

      // Fee effect
      if (feeEff) {
        if (!obj.effects) obj.effects = [];
        obj.effects.push(feeEff);
      }
    });

    // Balance after the transaction
    if (obj.accountRoot && obj.transaction && "undefined" === typeof obj.transaction.balance) {
      obj.transaction.balance = ripple.Amount.from_json(obj.accountRoot.Balance);
    }

    if ($.isEmptyObject(obj))
      return;

    // If the transaction didn't wind up cancelling an offer
    if (tx.TransactionType === 'OfferCancel' && (!obj.transaction.gets || !obj.transaction.pays)) {
      return;
    }

    obj.tx_type = tx.TransactionType;
    obj.tx_result = meta.TransactionResult;
    obj.fee = tx.Fee;
    obj.date = (tx.date + 0x386D4380) * 1000;
    obj.hash = tx.hash;
    obj.affected_currencies = affected_currencies ? affected_currencies : [];
    obj.ledger_index = tx.ledger_index;

    return obj;
  }
};
