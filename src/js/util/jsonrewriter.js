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

    // Main transaction
    if (tx.Account === account
        || (tx.Destination && tx.Destination === account)
        || (tx.LimitAmount && tx.LimitAmount.issuer === account)) {
      obj.transaction = {};

      switch (tx.TransactionType) {
        case 'Payment':
          var amount = ripple.Amount.from_json(tx.Amount);

          obj.transaction.type = tx.Account === account ? 'sent' : 'received';
          obj.transaction.counterparty = tx.Account === account ? tx.Destination : tx.Account;
          obj.transaction.amount = amount;
          obj.transaction.currency = amount.currency().to_json();
          break;

        case 'TrustSet':
          obj.transaction.type = tx.Account === account ? 'trusting' : 'trusted';
          obj.transaction.counterparty = tx.Account === account ? tx.LimitAmount.issuer : tx.Account;
          obj.transaction.amount = ripple.Amount.from_json(tx.LimitAmount);
          obj.transaction.currency = tx.LimitAmount.currency;
          break;

        case 'OfferCreate':
          obj.transaction.type = 'offernew';
          obj.transaction.pays = ripple.Amount.from_json(tx.TakerPays);
          obj.transaction.gets = ripple.Amount.from_json(tx.TakerGets);
          break;

        case 'OfferCancel':
          // Handled in side effects
          break;

        case 'AccountSet':
          // Ignored for now
          break;

        default:
          console.log('Unknown transaction type: "'+tx.TransactionType+'"', tx);
      }
    }

    // Side effects
    meta.AffectedNodes.forEach(function (n) {
      var node = JsonRewriter.processAnode(n);
      var effect = {};

      // AccountRoot - Current account node
      if (node.entryType === "AccountRoot" && node.fields.Account === account) {
        obj.accountRoot = node.fields;

        // Updated Balance
        if (node.fieldsPrev.Balance) {
          effect.type = "balance_change";
          effect.amount = ripple.Amount.from_json(node.fields.Balance).subtract(node.fieldsPrev.Balance);
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
            effect.change = ripple.Amount.from_json(node.fieldsPrev.Balance).subtract(node.fields.Balance);
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

          if (obj.transaction && effect.type == "trust_change_balance") {
            obj.transaction.balance = effect.balance;
          }
        }
      }

      // Offer
      else if (node.entryType === "Offer") {

        // Current account offer
        if (node.fields.Account === account) {

          // Partially funded offer
          if (node.diffType === "ModifiedNode") {
            effect.type = 'offer_partially_funded';
            effect.gets = ripple.Amount.from_json(node.fieldsPrev.TakerPays).subtract(node.fields.TakerPays);
            effect.pays = ripple.Amount.from_json(node.fieldsPrev.TakerGets).subtract(node.fields.TakerGets);
            effect.remaining = ripple.Amount.from_json(node.fields.TakerGets);
          }
          else {
            // New / Funded / Cancelled offer
            effect.type = node.diffType === "CreatedNode"
              ? 'offer_created'
              : node.fieldsPrev.TakerPays
                ? 'offer_funded'
                : 'offer_cancelled';

            // Only funded offers have "fieldsPrev". For new and cancelled offers we use "fields"
            var fieldSet = effect.type === 'offer_funded' ? node.fieldsPrev : node.fields;

            effect.gets = ripple.Amount.from_json(fieldSet.TakerPays);
            effect.pays = ripple.Amount.from_json(fieldSet.TakerGets);
          }

          effect.seq = +node.fields.Sequence;
        }

        // Another account offer. We care about it only if our transaction changed the offer amount (we bought currency)
        else if(tx.Account === account && !$.isEmptyObject(node.fieldsPrev) /* Offer is unfunded if node.fieldsPrev is empty */) {
          effect.gets = ripple.Amount.from_json(node.fieldsPrev.TakerGets).subtract(node.fields.TakerGets);
          effect.pays = ripple.Amount.from_json(node.fieldsPrev.TakerPays).subtract(node.fields.TakerPays);
          effect.type = 'offer_bought';
        }
      }

      if (!$.isEmptyObject(effect)) {
        if (node.diffType === "DeletedNode") {
          effect.deleted = true;
        }

        if (!obj.effects) obj.effects = [];
        obj.effects.push(effect);
      }
    });

    // Balance after the transaction
    if (obj.accountRoot && obj.transaction && "undefined" === typeof obj.transaction.balance) {
      obj.transaction.balance = ripple.Amount.from_json(obj.accountRoot.Balance);
    }

    if (!$.isEmptyObject(obj)) {
      obj.tx_type = tx.TransactionType;
      obj.tx_result = meta.TransactionResult;
      obj.fee = tx.Fee;
      obj.date = (tx.date + 0x386D4380) * 1000;
      obj.hash = tx.hash;

      return obj;
    }
  }
};