/**
 * This is a simple dummy server for the Bitcoin bridge protocol.
 *
 * This can be used to do some basic testing against the protocol.
 */

var express = require('express'),
    ripple = require('ripple-lib'),
    Amount = ripple.Amount;

var app = express();

app.get('/out', function(req, res){
  var type = req.query.type;
  var amount = Amount.from_json(req.query.amount);

  if (type !== "quote") {
    throw new Error("This dummy server only understands quote requests.");
  }

  if (!amount.is_valid()) {
    throw new Error("Invalid amount");
  }

  if (amount.currency().to_json() !== "BTC") {
    throw new Error("Currency must be BTC.");
  }

  res.json({
    "type": "ripple.bridge.out.bitcoin.quote.1",
    "quote": {
      "send:" : ["5000"],
      "address": "rf6deaquytYRCnXDD4ZBFAiJ7GiNCod93c",
      "bitcoin_amount": amount.to_text(),
      "destination_tag": 15,
      "expires": Math.floor(new Date().getTime()/1000) + 15 * 60
    },
    "status" : "success"
  });
});

app.listen(3000);
