/**
 * Simple static class for processing server-side JSON.
 */
var JsonRewriter = module.exports = {
  /**
   * Convert transactions into a more useful (for our purposes) format.
   */
  processTxn: function (tx, meta, account) {
    var accountData = {};

    var forUs=false;
    meta.AffectedNodes.forEach(function (n) {
      var node;
      if (n.CreatedNode) node = n.CreatedNode.NewFields;
      if (n.ModifiedNode) node = n.ModifiedNode.FinalFields;
      if (!node) return;

      if (node.Account === account) {
        accountData = node;
        forUs=true;
      }
    });
    if(!forUs) return null; // we could be listening to other accounts besides our own

    var obj = {};
    obj.fee = tx.Fee;
    obj.date = (tx.date + 0x386D4380) * 1000;

    if (accountData) {
      obj.balance = accountData.Balance;
    }

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
      break;
    case 'TrustSet':
      obj.type = 'other';
      obj.counterparty = tx.Account === account ?
        tx.LimitAmount.issuer :
        tx.Account;
      obj.amount=tx.LimitAmount.value;
      obj.currency = tx.LimitAmount.currency;

      break;
    default:
      console.log('Unknown transaction type: "'+tx.TransactionType+'"', tx);
      return null;
    }

    return obj;
  }
};
