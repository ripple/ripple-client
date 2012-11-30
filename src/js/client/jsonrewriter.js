/**
 * Simple static class for processing server-side JSON.
 */
var JsonRewriter = module.exports = {
  /**
   * Convert transactions into a more useful (for our purposes) format.
   */
  processTxn: function (tx, meta, account) {
    var accountData = {};

    meta.AffectedNodes.forEach(function (n) {
      var node;
      if (n.CreatedNode) node = n.CreatedNode.NewFields;
      if (n.ModifiedNode) node = n.ModifiedNode.FinalFields;
      if (!node) return;

      if (node.Account === account) {
        accountData = node;
      }
    });

    var obj = {};
    obj.fee = tx.Fee;
    obj.date = (tx.date + 0x386D4380) * 1000;
    switch (tx.TransactionType) {
    case 'Payment':
      obj.type = tx.Account === account ?
        'sent' :
        'received';
      obj.counterparty = tx.Account === account ?
        tx.Destination :
        tx.Account;
      obj.amount = tx.Amount;
      obj.currency = "XRP";
      obj.balance = accountData.Balance;
      break;
    case 'TrustSet':
      obj.type = 'other';
      obj.counterparty = tx.Account === account ?
        tx.LimitAmount.issuer :
        tx.Account;

      // XXX: Disabled for now
      return null;
    default:
      console.log('Unknown transaction type: "'+tx.TransactionType+'"', tx);
      return null;
    }

    return obj;
  }
};
