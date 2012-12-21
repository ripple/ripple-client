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
   */
  processTxn: function (tx, meta, account) {
    var obj = {};

    var forUs = false;
    obj.offers = null;
    meta.AffectedNodes.forEach(function (n) {
      var node = JsonRewriter.processAnode(n);

      if (node.entryType === "AccountRoot" && node.fields.Account === account) {
        obj.accountRoot = node.fields;
        forUs = true;
      } else if (node.entryType === "RippleState" &&
                 (node.fields.HighLimit.issuer === account ||
                  node.fields.LowLimit.issuer === account)) {
        obj.rippleState = node.fields;
        forUs = true;
      } else if (node.entryType === "Offer") {
        // XXX: TODO: Handle offer deletion
        if (!obj.offers) obj.offers = [];

        var seq = +node.fields.Sequence;
        obj.offers[seq] = $.extend({}, obj.offers[seq], {
          seq: seq,
          gets: ripple.Amount.from_json(node.fields.TakerGets),
          pays: ripple.Amount.from_json(node.fields.TakerPays)
        });

        if (node.diffType === "DeletedNode") {
          obj.offers[seq].deleted = true;
        }

        forUs = true;
      }
    });

    // This function may get transactions that don't affect us, but we can't
    // process such transactions, so we return null to signal that.
    if (!forUs) return null;

    obj.tx_type = tx.TransactionType;
    obj.fee = tx.Fee;
    obj.date = (tx.date + 0x386D4380) * 1000;

    if (obj.accountRoot) {
      obj.balance = ripple.Amount.from_json(obj.accountRoot.Balance);
      obj.xrp_balance = obj.balance;
    }

    if (obj.rippleState) {
      if (obj.rippleState.HighLimit.issuer === account) {
        obj.balance = ripple.Amount.from_json(obj.rippleState.Balance).negate(true);
        obj.limit = ripple.Amount.from_json(obj.rippleState.HighLimit);
        obj.limit_peer = ripple.Amount.from_json(obj.rippleState.LowLimit);
      } else {
        obj.balance = ripple.Amount.from_json(obj.rippleState.Balance);
        obj.limit = ripple.Amount.from_json(obj.rippleState.LowLimit);
        obj.limit_peer = ripple.Amount.from_json(obj.rippleState.HighLimit);
      }
    }

    switch (tx.TransactionType) {
    case 'Payment':
      var amount = ripple.Amount.from_json(tx.Amount);
      obj.type = tx.Account === account ?
        'sent' :
        'received';
      obj.counterparty = tx.Account === account ?
        tx.Destination :
        tx.Account;
      obj.amount = amount;
      obj.currency = amount.currency().to_json();
      break;

    case 'TrustSet':
      obj.type = tx.Account === account ?
        'trusting' :
        'trusted';
      obj.counterparty = tx.Account === account ?
        tx.LimitAmount.issuer :
        tx.Account;
      obj.amount = ripple.Amount.from_json(tx.LimitAmount);
      obj.currency = tx.LimitAmount.currency;
      break;

    case 'OfferCreate':
      obj.type = 'offernew';
      obj.pays = ripple.Amount.from_json(tx.TakerPays);
      obj.gets = ripple.Amount.from_json(tx.TakerGets);
      break;

    case 'OfferCancel':
      obj.type = 'offercancel';
      // An OfferCancel will only ever affect one order and will delete it.
      var offer;
      // The reason we use forEach is because offers is a sparse array.

      // TODO this is a temporary check
      if (!$.isArray(obj.offers)) {
        break;
      }

      obj.offers.forEach(function (o) {
        offer = o;
      });

      obj.pays = offer.pays;
      obj.gets = offer.gets;

      break;

    default:
      console.log('Unknown transaction type: "'+tx.TransactionType+'"', tx);
      return null;
    }

    return obj;
  }
};
