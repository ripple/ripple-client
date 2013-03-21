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

    obj.offers = null;
    meta.AffectedNodes.forEach(function (n) {
      var node = JsonRewriter.processAnode(n);

      if (node.entryType === "AccountRoot" && node.fields.Account === account) {
        obj.accountRoot = node.fields;
      } else if (node.entryType === "RippleState") {

        var line = {};
        if (node.fields.HighLimit.issuer === account) {
          line.balance = ripple.Amount.from_json(node.fields.Balance).negate(true);
          line.limit = ripple.Amount.from_json(node.fields.HighLimit);
          line.limit_peer = ripple.Amount.from_json(node.fields.LowLimit);
          line.counterparty = node.fields.LowLimit.issuer;
        } else if (node.fields.LowLimit.issuer === account) {
          line.balance = ripple.Amount.from_json(node.fields.Balance);
          line.limit = ripple.Amount.from_json(node.fields.LowLimit);
          line.limit_peer = ripple.Amount.from_json(node.fields.HighLimit);
          line.counterparty = node.fields.HighLimit.issuer;
        } else return;

        line.currency = node.fields.HighLimit.currency;

        if (node.diffType === "DeletedNode") {
          line.deleted = true;
        }

        if (!obj.lines) obj.lines = [];
        obj.lines.push(line);
      } else if (node.entryType === "Offer" && node.fields.Account === account) {
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
      }
    });

    obj.tx_type = tx.TransactionType;
    obj.tx_result = meta.TransactionResult;
    obj.fee = tx.Fee;
    obj.date = (tx.date + 0x386D4380) * 1000;
    obj.hash = tx.hash;

    if (obj.accountRoot) {
      obj.balance = ripple.Amount.from_json(obj.accountRoot.Balance);
      obj.xrp_balance = obj.balance;
    }

    switch (tx.TransactionType) {
    case 'Payment':
      var amount = ripple.Amount.from_json(tx.Amount);
      if (tx.Account === account) {
        obj.type = 'sent';
        obj.counterparty = tx.Destination;
      } else if (tx.Destination === account) {
        obj.type = 'received';
        obj.counterparty = tx.Account;
      } else {
        obj.type = 'ignore';
      }

      obj.amount = amount;
      obj.currency = amount.currency().to_json();
      if (!amount.is_native() && obj.lines && obj.lines.length >= 1) {
        // TODO: Handle the case where more than one trust line of ours was
        //       changed in the course of a payment.
        obj.balance = obj.lines[0].balance;
      }
      break;

    case 'TrustSet':
      if (tx.Account === account) {
        obj.type = 'trusting';
        obj.counterparty = tx.LimitAmount.issuer;
      } else if (tx.Destination === account) {
        obj.type = 'trusted';
        obj.counterparty = tx.Account;
      } else {
        obj.type = 'ignore';
      }
      obj.amount = ripple.Amount.from_json(tx.LimitAmount);
      obj.currency = tx.LimitAmount.currency;
      break;

    case 'OfferCreate':
      if (tx.Account === account) {
        obj.type = 'offernew';
      } else if (obj.accountRoot) {
        // TODO quick solution. I don't like this line
        offer = obj.offers[obj.offers.length-1];
        obj.type = offer.deleted ? 'offerfunded' : 'offerpartiallyfunded';
      } else {
        obj.type = 'ignore';
      }

      obj.pays = ripple.Amount.from_json(tx.TakerPays);
      obj.gets = ripple.Amount.from_json(tx.TakerGets);
      break;

    case 'OfferCancel':
      obj.type = tx.Account === account ?
        'offercancel' :
        'ignore';

      // An OfferCancel will only ever affect one order and will delete it.
      var offer;
      // The reason we use forEach is because offers is a sparse array.

      // TODO this is a temporary check
      if (!$.isArray(obj.offers)) {
        break;
      }

      offer = obj.offers[tx.OfferSequence];

      obj.pays = offer.pays;
      obj.gets = offer.gets;

      break;

    case 'AccountSet':
      // Ignored for now
      return null;

    default:
      console.log('Unknown transaction type: "'+tx.TransactionType+'"', tx);
      return null;
    }

    return obj;
  }
};
