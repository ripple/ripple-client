/**
 * This is a simple dummy server for the Bitcoin bridge protocol.
 *
 * This can be used to do some basic testing against the protocol.
 */

var express = require('express'),
    ripple = require('ripple-lib'),
    Amount = ripple.Amount;

var app = express();

app.options('/out', function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.end();
});

app.get('/out', function(req, res){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");

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

  amount.set_issuer("rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B");

  res.json({
    "type": "ripple.bridge.out.bitcoin.quote.1",
    "quote": {
      "send" : [amount.to_json()],
      "address": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
      "bitcoin_amount": amount.to_text(),
      "destination_tag": 15,
      "expires": Math.floor(new Date().getTime()/1000) + 15 * 60
    },
    "status" : "success"
  });
});

app.listen(3000);
