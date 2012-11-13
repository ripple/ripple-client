/******/(function(modules) {
/******/	var installedModules = {};
/******/	function require(moduleId) {
/******/		if(typeof moduleId !== "number") throw new Error("Cannot find module '"+moduleId+"'");
/******/		if(installedModules[moduleId])
/******/			return installedModules[moduleId].exports;
/******/		var module = installedModules[moduleId] = {
/******/			exports: {},
/******/			id: moduleId,
/******/			loaded: false
/******/		};
/******/		modules[moduleId](module, module.exports, require);
/******/		module.loaded = true;
/******/		return module.exports;
/******/	}
/******/	require.e = function(chunkId, callback) {
/******/		callback(require);
/******/	};
/******/	require.modules = modules;
/******/	require.cache = installedModules;
/******/	return require(0);
/******/})
/******/({c:"",
/******/0: function(module, exports, require) {

window.ncc = require(10);
window.blobVault = require(8);

var RegisterScreen = require(12).RegisterScreen;

$(document).ready(function () {
  ncc.init();
  RegisterScreen.init();
});


/******/},
/******/
/******/1: function(module, exports, require) {

var Base58Utils = require(3);

var Amount = function (a) {
  if (this == window) return new Amount(a);
  
  if (a.constructor == String) {
    this.currency = 'XNS';
    this.value = a / BALANCE_DISPLAY_DIVISOR;
    this.issuer = '';
  } else {
    _.extend(this, a);
  }
};

var AmountValue = (function () {
  function repeat_str(s, n) {
    return (new Array(n+1)).join(s);
  }
  function mod(x, n) {
    if (x >= 0) return x % n;
    else return x % n + n;
  }
  function sub(a, b) {
    return a - b;
  }
  function add(a, b) {
    return a + b;
  }
  
  var AmountValue = function (s) {
    if (this == window) return new AmountValue(s);
    
    if (s === undefined || !(s.constructor == Number || s.constructor == String))
      throw "AmountValue takes one argument which must be a Number or String."
    
    if (s.constructor == Number) {
      AmountValue.call(this, String(s));
      return;
    }
    
    var mnum = s.match(/^[\-+]?0*([0-9]*)(\.([0-9]*?)0*)?$/);
    
    if (!s || !mnum) throw "Invalid value for AmountNumber.";
    
    this.sign = (s[0] == '+' || s[0] == '-') ? s[0] : '+';
    
    var whole = mnum[1] || "",
        decim = mnum[3] || "",
        digits = (whole + decim),
        m = digits.match(/^(0*)([0-9]+?)0*$/),
        leadZeros = m ? m[1] : "",
        mantissa = m ? m[2] : "0",
        exp = whole.length - leadZeros.length - 16;
    
    if (mantissa.length < 16) {
      mantissa += repeat_str("0", 16 - mantissa.length);
    }
    
    this.mantissa = mantissa;
    this.exponent = this.isZero() ? 0 : exp;
    
    if (mantissa.length > 16 || this.exponent > 80 || this.exponent < -96) {
      throw "This number cannot be represented."
    }
  };
  
  AmountValue.prototype.copy = function () {
    var c = new AmountValue(0);
    c.sign = this.sign;
    c.mantissa = this.mantissa;
    c.exponent = this.exponent;
    return c;
  };
  
  AmountValue.prototype.toString = function () {
    var sign = this.sign == '-' ? '-' : '';
    if (this.exponent === 0) {
      return sign + this.mantissa;
    } else if (this.exponent > 0) {
      return sign + this.mantissa + repeat_str("0", this.exponent);
    } else if (this.exponent < 0) {
      var point = this.mantissa.length + this.exponent,
          whole = this.mantissa.slice(0, point < 0 ? 0 : point) || "0",
          decim = point < 0 ? repeat_str("0", -point) + this.mantissa
                            : this.mantissa.slice(point,
                                                  this.mantissa.length);
      decim = decim.replace(/0*$/, '');
      return sign + whole + (decim ? "." + decim : "");
    }
  };
  
  AmountValue.prototype.isZero = function () {
    return this.mantissa == "0000000000000000";
  };
  
  AmountValue.prototype.compareTo = function (other) {
    if (!(other instanceof AmountValue)) {
      other = new AmountValue(other);
    }

    if (this.sign != other.sign) {
      return this.sign == '-' ? -1 : 1;
    }
    
    if (this.exponent > other.exponent) {
      return this.sign == '-' ? -1 : 1;
    } else if (this.exponent < other.exponent) {
      return this.sign == '-' ? 1 : -1;
    } else {
      if (this.mantissa > other.mantissa) {
        return this.sign == '-' ? -1 : 1;
      } else if (this.mantissa < other.mantissa) {
        return this.sign == '-' ? 1 : -1;
      } else {
        return 0;
      }
    }
  };
  
  AmountValue.prototype.div = function (other) {
    var n;
    if (!isNaN(other) && (other.constructor == String || other.constructor == Number)) {
      return this.div(new AmountValue(String(other)));
    } else if (other && other.constructor == AmountValue) {
      if (other.isZero()) {
        throw "Cannon divide by zero.";
      } else if (other.mantissa == '1000000000000000') {
        n = this.copy();
        n.exponent -= (other.exponent + 15);
      } else {
        throw "Dividing by this number not implemented.";
      }
    } else {
      throw "divide method takes a numeric String, Number, or AmountValue.";
    }
    return n;
  };
  
  AmountValue.prototype.abs = function () {
    return new AmountValue(this.toString().replace(/^-/, ''));
  };
  
  AmountValue.prototype.neg = function () {
    if (this.sign == '-') {
      return new AmountValue(this.toString().replace(/^-/, ''));
    } else {
      return new AmountValue('-' + this.toString());
    }
  };
  
  // MODIFIES this
  AmountValue.prototype.sub = function (other) {
    if (!isNaN(other) && (other.constructor == String || other.constructor == Number)) {
      return this.sub(new AmountValue(String(other)));
    } else if (other && other.constructor == AmountValue) {
      return this.add(other.neg());
    } else {
      throw "sub method takes a numeric String, Number, or AmountValue."
    }
    return this;
  };
  
  // MODIFIES this
  AmountValue.prototype.add = function (m) {
    if (!isNaN(m) && (m.constructor == String || m.constructor == Number)) {
      // m is numeric string or number
      return this.add(new AmountValue(String(m)));
    } else if (m && m.constructor == AmountValue) {
      var same_sign = this.sign == m.sign,
          comp = this.abs().compareTo(m.abs()),
          smaller = comp < 0 ? this : m,
          bigger = comp < 0 ? m : this,
          exp_diff = bigger.exponent - smaller.exponent,
          big = bigger.mantissa + repeat_str("0", exp_diff),
          sml = repeat_str("0", big.length - smaller.mantissa.length) + smaller.mantissa;
      
      var res = [], carry = 0;
      
      for (var i = big.length - 1; i >= 0; i--) {
        var x = (same_sign ? add : sub)(Number(big[i]), (Number(sml[i]) + carry));
        res.unshift(mod(x, 10));
        carry = Number(x >= 10 || x < 0);
      }
      
      res.unshift(carry);
      res = res.join(''); // res is now a string
      
      if (smaller.exponent >= 0) {
        res += repeat_str("0", smaller.exponent);
      } else {
        var whole = res.slice(0, res.length + smaller.exponent) || "0",
            decim = res.slice(res.length + smaller.exponent, res.length).replace(/0*$/, '');
        res = bigger.sign + whole + "." + decim;
      }
      
      res = new AmountValue(res); // res is on a horse
      this.sign = res.sign;
      this.mantissa = res.mantissa;
      this.exponent = res.exponent;
      
      return this;
    } else {
      throw "add method takes a numeric String, Number, or AmountValue"
    }
  };
  
  return AmountValue;
})();

// uncomment to test
// var a = (new AmountValue("-0.1234567890")).add(1).toString()
// if (a != "0.876543211") throw "bad"
// 
// a = new AmountValue("0");
// if (a.mantissa != '0000000000000000') throw "bad"
// if (a.exponent != 0) throw "bad"
// 
// a = new AmountValue("0.1234567890")
// if (a.mantissa != '1234567890000000') throw "bad"
// if (a.exponent != -16) throw "bad"
// 
// a = new AmountValue("0.001234567890")
// if (a.mantissa != '1234567890000000') throw "bad " + a.mantissa
// if (a.exponent != -18) throw "bad " + a.exponent
// 
// a = new AmountValue("123456789012345600")
// if (a.mantissa != '1234567890123456') throw "bad " + a.mantissa
// if (a.exponent != 2) throw "bad " + a.exponent
// 
// a = new AmountValue("1234567890123456")
// if (a.mantissa != '1234567890123456') throw "bad " + a.mantissa
// if (a.exponent != 0) throw "bad " + a.exponent
// 
// a = new AmountValue("1000000000000000000", true)
// if (a.mantissa != '1000000000000000') throw "bad"
// if (a.exponent != 3) throw "bad"
// 
// console.log("all good")

var RippleAddress = (function () {
  function append_int(a, i) {
    return [].concat(a, i >> 24, (i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff)
  }
  
  function firstHalfOfSHA512(bytes) {
    return (
      new jsSHA(sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(bytes)), 'HEX')
    ).getHash('SHA-512', 'HEX').slice(0, 64);
  }
    
  return function (seed) {
    this.seed = Base58Utils.decode_base_check(33, seed);
    
    if (!this.seed) {
      throw "Invalid seed."
    }
    
    this.getAddress = function (seq) {
      seq = seq || 0;
      
      var private_gen, public_gen, i = 0;
      do {
        private_gen = sjcl.bn.fromBits(sjcl.codec.hex.toBits(
          firstHalfOfSHA512(append_int(this.seed, i))
        ));
        i++;
      } while (private_gen > sjcl.ecc.curves.c256.r);
      
      public_gen = sjcl.ecc.curves.c256.G.mult(private_gen);
      
      var sec;
      i = 0;
      do {
        sec = sjcl.bn.fromBits(sjcl.codec.hex.toBits(
          firstHalfOfSHA512(append_int(append_int(public_gen.toBytesCompressed(), seq), i))
        ));
        i++;
      } while (sec > sjcl.ecc.curves.c256.r);
      
      var pubKey = sjcl.ecc.curves.c256.G.mult(sec).toJac().add(public_gen).toAffine();
      return Base58Utils.encode_base_check(0, Crypto.util.sha256ripe160(pubKey.toBytesCompressed()));
    }
  };
})();

exports.Amount = Amount;
exports.AmountValue = AmountValue;
exports.RippleAddress = RippleAddress;



/******/},
/******/
/******/2: function(module, exports, require) {

var console = (function() { return this["console"] || (this["window"] && this["window"].console) || {} }());
module.exports = console;
for(var name in {log:1, info:1, error:1, warn:1, dir:1, trace:1, assert:1})
	if(!console[name])
		console[name] = function() {};
var times = {};
if(!console.time)
console.time = function(label) {
	times[label] = Date.now();
};
if(!console.timeEnd)
console.timeEnd = function() {
	var duration = Date.now() - times[label];
	console.log('%s: %dms', label, duration);
};

/******/},
/******/
/******/3: function(module, exports, require) {


var Base58Utils = (function () {
  var alphabets = {
    'ripple':  "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz",
    'bitcoin': "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  };
  
  var sha256  = function (bytes) {
    return sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(bytes)));
  };
  
  var sha256hash = function (bytes) {
    return sha256(sha256(bytes));
  };
  
  var arraySet = function (count, value) {
    var a = new Array(count);
    var i;
    
    for (i = 0; i != count; i += 1)
      a[i] = value;
      
    return a;
  };
  
  return {
    // --> input: big-endian array of bytes. 
    // <-- string at least as long as input.
    encode_base: function (input, alphabetName) {
      var alphabet	= alphabets[alphabetName || 'ripple'];
      var bi_base	= new BigInteger(String(alphabet.length));
      var bi_q	= nbi();
      var bi_r	= nbi();
      var bi_value	= new BigInteger(input);
      var buffer	= [];
      
      while (bi_value.compareTo(BigInteger.ZERO) > 0)
      {
        bi_value.divRemTo(bi_base, bi_q, bi_r);
        bi_q.copyTo(bi_value);
        buffer.push(alphabet[bi_r.intValue()]);
      }
      
      for (var i = 0; i != input.length && !input[i]; i += 1) {
        buffer.push(alphabet[0]);
      }
      
      return buffer.reverse().join("");
    },
    
    // --> input: String
    // <-- array of bytes or undefined.
    decode_base: function (input, alphabetName) {
      var alphabet = alphabets[alphabetName || 'ripple'],
          bi_base = new BigInteger(String(alphabet.length)),
          bi_value = nbi();
      
      var i;
      while (i != input.length && input[i] === alphabet[0]) {
        i += 1;
      }
      
      for (i = 0; i != input.length; i += 1) {
        var v = alphabet.indexOf(input[i]);
        
        if (v < 0) {
          return undefined;
        }
        
        var r = nbi();
        r.fromInt(v); 
        bi_value = bi_value.multiply(bi_base).add(r);
      }
      
      // toByteArray:
      // - Returns leading zeros!
      // - Returns signed bytes!
      var bytes =  bi_value.toByteArray().map(function (b) {
        return b ? (b < 0 ? 256 + b : b) : 0;
      });
      
      var extra = 0;
      while (extra != bytes.length && !bytes[extra]) {
        extra += 1;
      }
      
      if (extra) {
        bytes = bytes.slice(extra);
      }
      
      var zeros = 0;
      while (zeros !== input.length && input[zeros] === alphabet[0]) {
        zeros += 1;
      }
      
      return [].concat(arraySet(zeros, 0), bytes);
    },
    
    // --> input: Array
    // <-- String
    encode_base_check: function (version, input, alphabet) {
      var buffer  = [].concat(version, input);
      var check   = sha256(sha256(buffer)).slice(0, 4);
      return Base58Utils.encode_base([].concat(buffer, check), alphabet);
    },
    
    // --> input : String
    // <-- NaN || BigInteger
    decode_base_check: function (version, input, alphabet) {
      var buffer = Base58Utils.decode_base(input, alphabet);
      
      if (!buffer || buffer[0] !== version || buffer.length < 5) {
        return NaN;
      }
      
      var computed = sha256hash(buffer.slice(0, -4)).slice(0, 4),
          checksum = buffer.slice(-4);
      
      var i;
      for (i = 0; i != 4; i += 1)
        if (computed[i] !== checksum[i])
          return NaN;
      
      return buffer.slice(1, -4);
    }
  }
})();

module.exports = Base58Utils;


/******/},
/******/
/******/4: function(module, exports, require) {

var RippleAddress = require(1).RippleAddress;

var RipplePage = require(5).RipplePage;

var welcomeScreen = {};
welcomeScreen.onShowTab = function () {};
welcomeScreen.walletProposeResponse = function () {};

var loginScreen = {};

loginScreen.init = function () {
  $("#loginForm").submit(loginScreen.login);
};

loginScreen.onShowTab = function () {
  setTimeout(function () {
    if (localStorage.user) {
      $("#loginForm input[name=username]").val(localStorage.user);
      $("#loginForm input[name=password]").focus();
    } else {
      $("#loginForm input[name=username]").focus();
    }
  }, 1);
};

loginScreen.login = function () {
  var that = this,
      loginErr = $("#LoginError");

  $("#LoginButton").removeClass('btn-success').addClass('btn-info')
    .val("Logging in...").attr('disabled', true);

  blobVault.login(
    this.username.value,
    this.password.value,
    this.blob.value,
    function success() {
      ncc.user = localStorage.user = that.username.value;
      ncc.masterKey = blobVault.data.master_seed;
      if (ncc.misc.isValidSeed(ncc.masterKey)) {
        ncc.accountID = (new RippleAddress(ncc.masterKey)).getAddress();
      } else {
        ncc.accountID = blobVault.data.account_id;
      }
      loginScreen.finishLogin();
    },
    function error(e) {
      $("#LoginButton").removeClass('btn-success').addClass('btn-danger')
                       .val(e).attr('disabled', true);

      setTimeout(function () {
        $("#LoginButton").addClass('btn-success').removeClass('btn-danger')
                         .val("Login").attr('disabled', false);
      }, 1500);
    }
  );
  return false;
};

loginScreen.finishLogin = function () {
  $("#t-login div.heading").text("Login");
  $('#NewMasterKey').text(ncc.masterKey);
  $('#NewAddress').text(ncc.accountID);
  $('#InfoMasterKey').text(ncc.masterKey);
  $('#InfoBackupBlob').val(blobVault.blob);
  $('#RecvAddress').text(ncc.accountID);
  $('#RecvAddress2').text(ncc.accountID);

  ncc.onLogIn();

  remote.set_secret(ncc.accountID, ncc.masterKey);
  remote.request_subscribe().accounts(ncc.accountID).request();
  remote.request_ripple_lines_get(ncc.accountID).on('success', RipplePage.getLinesResponse).request();
  remote.request_wallet_accounts(ncc.masterKey)
    .on('success', function (res) {
      ncc.processAccounts(res.accounts);
      if (window.location.hash == '#t-deposit') {
        ncc.displayScreen('send');
      }
      ncc.navigateToHash();
    })
    .on('error', function () {
      ncc.displayTab("deposit");
      ncc.displayScreen("deposit");
      ncc.navigateToHash();
    })
    .request();
};

loginScreen.logout = function () {
  ncc.onLogOut();
  blobVault.logout();
  $('#Balance').text('');
  $('#RecvAddress').text('');
  $('#RecvAddress2').text('');
};

var depositScreen = {};

depositScreen.onShowTab = function () {
  ncc.on('account-Payment', function () {
    $("#t-deposit p").text("Initial deposit received.");
    $("#t-deposit div.heading").text("Success!");
    ncc.hideTab('deposit');
  });
};


exports.LoginScreen = loginScreen;
exports.WelcomeScreen = welcomeScreen;
exports.DepositScreen = depositScreen;


/******/},
/******/
/******/5: function(module, exports, require) {

var RippleAddress = require(1).RippleAddress,
    AmountValue = require(1).AmountValue;

var RipplePage = (function () {
  var address, name, creditMax, currency,
      
      acctElem,
      currElem,
      limitElem,
      
      buttonElem,
      rippleLinesTable;

  var RipplePage = {};

  RipplePage.init = function () {
    $('#AddCreditLineButton').click(RipplePage.submitForm);

    limitElem = $("#NewCreditMax"),
    buttonElem = $("#AddCreditLineButton");
    rippleLinesTable = $('#RippleTable');
    $("#t-ripple input").on('keydown', function (e) {
      if (e.which == 13 && !buttonElem.attr('disabled') && !$(this).widget) {
        buttonElem.click();
      }
    });
  };
  
  function onFieldsUpdated() {
    address = acctElem.value().replace(/\s/g, '');
    name = blobVault.addressBook.getName(address) || '';
    creditMax = limitElem.val();
    currency = currElem.value();
    
    try { // checks that the value is representable and >= 0
      var sign = (new AmountValue(creditMax)).sign;
      if (sign === "-") {
        throw new Error("Negative values not allowed!");
      }
    } catch (e) {
      creditMax = "bad";
    }
    var allgud = ncc.misc.isValidAddress(address) && creditMax != 'bad' && currency;
    buttonElem.attr('disabled', !allgud);
  }
  
  RipplePage.lines = {};
  
  RipplePage.onShowTab = function () {
    var recentSends = _.extend(blobVault.getRecentSends(), blobVault.addressBook.getEntries());
    
    if (!currElem) {
      currElem = $("#NewCreditCurrency").combobox({
        data: ncc.currencyOptions,
        selected: 'USD',
        strict: true,
        button_title: 'Select a currency',
        onchange: onFieldsUpdated
      }).data('combobox');
    }
    
    if (!acctElem) {
      acctElem = $("#NewCreditAccount").combobox({
        data: recentSends,
        selected: '',
        button_title: 'Recently used addresses',
        onchange: onFieldsUpdated
      }).data('combobox');
    }
    
    limitElem.on('input', onFieldsUpdated);
    
    buttonElem.attr('disabled', true);
    
    acctElem.updateData(recentSends);
    RipplePage.renderLines();
  };
  
  RipplePage.getLinesResponse = function (res) {
    if (res.lines && res.lines.length) {
      RipplePage.lines = _.object(
        _.map(
          res.lines,
          function (l) { return l.account + '/' + l.currency; }
        ),
        res.lines
      );
      RipplePage.renderLines();
    }
  };
  
  RipplePage.submitForm = function () {
    var amount = creditMax + "/" + currency + "/" + address;
    remote.transaction()
      .ripple_line_set(ncc.accountID, amount)
      .on("success", RipplePage.setLineResponse)
      .submit()
    ;
    ncc.misc.forms.disable("#t-ripple");
  }

  RipplePage.setLineResponse = function (res) {
    blobVault.updateRecentSends(address);
    blobVault.save();
    blobVault.pushToServer();
    acctElem.promoteEntry(address);

    acctElem.value('');
    limitElem.val('');
    address = '';
    name = '';
    creditMax = '';

    ncc.misc.forms.enable("#t-ripple");
    onFieldsUpdated();
  };

  RipplePage.setLineError = function (res) {
    ncc.misc.forms.enable("#t-ripple");
    onFieldsUpdated();
  };

  // this will return the accountID of the line that has the most credit left in that currency 
  RipplePage.findBestRouteIn = function (currency) {
    var bestAccount = null,
        max = 0;
    
    // TODO(cleanup): use _.max
    _.each(
      RipplePage.lines,
      function (line) {
        if (line.currency == currency) {
          var left = line.limit - line.balance;
          if (left > max) {
            max = left;
            bestAccount = line.account;
          }
        }
      }
    );
    
    return({ 'accountID' : bestAccount , 'max' : max }); 
  }  
  
  RipplePage.onCreditSet = function (tx) {
    var limit = tx.LimitAmount,
        key = limit.issuer + '/' + limit.currency,
        line = RipplePage.lines[key] = RipplePage.lines[key] || {};
    
    line.account = limit.issuer;
    line.currency = limit.currency; 
    line.limit = limit.value;
    line.balance = line.balance || "0";
    line.limit_peer = line.limit_peer || "0";
    line.quality_in = line.quality_in || 0;
    line.quality_out = line.quality_out || 0;
    
    RipplePage.renderLines();
  };
  
  RipplePage.renderLines = function () {
    for (var curr in ncc.balance) {
      if (curr != 'XNS') {
        delete ncc.balance[curr];
      }
    }
    
    rippleLinesTable.empty();
    _.each(
      RipplePage.lines,
      function (line) {
        ncc.changeBalance(line.currency, line.balance);
        rippleLinesTable.prepend(
          '<tr>' + 
            '<td>' + (line.limit_peer) + '</td>' +
            '<td>' + line.balance + ' ' + line.currency + '</td>' +
            '<td>' + line.limit + '</td>' +
            '<td>' + (blobVault.addressBook.getName(line.account) || line.account) + '</td>' +
            '<td></td>' + 
            '<td></td>' +
          '</tr>'
        );
      }
    );
  };

  return RipplePage;
})();

exports.RipplePage = RipplePage;


/******/},
/******/
/******/6: function(module, exports, require) {

var feed = {};

feed.init = function (remote) {
  remote.on('ledger_closed', feed.onLedgerClose);
  $('#FeedLedgerCheckbox').change(feed.onLedgerClick);
  $('#FeedTransactionsCheckbox').change(feed.onTransactionsClick);
  $('#FeedServerCheckbox').change(feed.onServerClick);
  $('#FeedClearButton').click(feed.clear);
};

feed.onShowTab = function () {};

feed.clear = function () {
  $('#FeedArea').empty();
};

feed.displayLedgerEvents = false;
feed.displayServerEvents = false;

feed.onLedgerClick = function (ele) {
  feed.displayLedgerEvents = !!ele.checked;
};

feed.onLedgerClose = function (hash, index) {
  if (!feed.displayLedgerEvents) return;

  str = '<div class="ledgerFeedMsg">Accepted Ledger <strong>' + ncc.escape(index) +
    '</strong> hash:' + ncc.escape(hash) + '</div>';

  $('#FeedArea').prepend(str);
};

feed.onTransactionsClick = function (ele) {
  if (ele.checked) {
    remote.request_subscribe('transactions').request();
  } else {
    remote.request_unsubscribe('transactions').request();
  }
};

feed.onServerClick = function (ele) {
  if (ele.checked) {
    //server.subscribe("server");
  } else {
    //server.unsubscribe("server");
  }
};

feed.addTransaction = function (obj) {};

exports.FeedPage = feed;


/******/},
/******/
/******/7: function(module, exports, require) {

var AddressBookPage = (function () {
  var AddressBookTable = $("#AddressBookTable"),
      
      makeRow = function (name, addr) {
        return ('<tr data-name="' + escape(name) + '" data-addr="' + escape(addr) + '">' +
                  '<td class="addr">' + addr + '</td>' +
                  '<td class="name">' + name + '</td>' +
                  '<td class="edit">' +
                    '<button class="edit" onclick="AddressBookPage.editRow(this.parentElement.parentElement)">edit</button>' +
                    '<button class="save" onclick="AddressBookPage.saveRow(this.parentElement.parentElement)">save</button>' +
                    '<button class="delete" onclick="AddressBookPage.deleteRow(this.parentElement.parentElement)">delete</button>' +
                  '</td>' +
                '</tr>');
      },
      
      addRow = ('<tr>' +
                  '<td class="addr">&nbsp;</td>' +
                  '<td class="name">&nbsp;</td>' +
                  '<td class="edit">' +
                    '<button class="add" onclick="AddressBookPage.newRow()">add</button>' +
                  '</td>' +
                '</tr>');

  var AddressBookPage = {};
  
  AddressBookPage.onShowTab = function () {
    AddressBookTable.html('');
    
    _.each(
      blobVault.addressBook.getEntries(),
      function (name, addr) {
        AddressBookTable.append(makeRow(name, addr));
      }
    );
    
    AddressBookTable.append(addRow);
  };
  
  AddressBookPage.newRow = function () {
    var row = $(makeRow('', ''));
    AddressBookTable.find('tr:last').before(row);
    this.editRow(row);
    row.find('input:first').focus();
  };
  
  AddressBookPage.editRow = function (rowElem) {
    var row = $(rowElem),
        editButton = row.find('button.edit'),
        saveButton = row.find('button.save'),
        delButton = row.find('button.delete');
    
    editButton.hide();
    saveButton.show();
    
    // if this is a new row
    if (!row.attr('data-addr')) {
      row.find('td.addr').html($('<input name="addr">'));
    } else {
      delButton.show();
    }
    
    row.find('td.name').html($('<input name="name">').val(unescape(row.attr('data-name'))));
    row.find('td input').focus().keydown(function (e) {
      switch (e.which) {
        case 27: // esc key
          $("td.name input").val(row.attr('data-name'));
          $("td.addr input").val(row.attr('data-addr'));
          break;
        case 13: // enter key
          saveButton.click();
      }
    });
  };
  
  AddressBookPage.saveRow = function (rowElem) {
    var row = $(rowElem),
        oldName = unescape(row.attr('data-name')),
        newName = row.find('td.name input').val(),
        addr = row.find('td.addr input').val() || unescape(row.attr('data-addr'));
    
    if (newName) {
      row.find('button.save').hide();
      row.find('button.delete').hide();
      row.find('button.edit').show();
      
      row.find('td.name').text(newName);
      row.find('td.addr').text(addr);
      row.attr('data-name', escape(newName));
      row.attr('data-addr', escape(addr));
    } else {
      row.remove();
    }
    
    // update blobVault
    blobVault.addressBook.setEntry(newName, addr);
    blobVault.save();
    
    return false;
  };
  
  AddressBookPage.deleteRow = function (rowElem) {
    $(rowElem).find("td.name input").val("");
    this.saveRow(rowElem);
  };

  return AddressBookPage;
})();

exports.AddressBookPage = AddressBookPage;


/******/},
/******/
/******/8: function(module, exports, require) {

/******/ /* WEBPACK FREE VAR INJECTION */ (function(console) {
var blobVault = (function () {
  var user = '',
      pass = '',
      hash = '';

  var blobVault = {};
  
  if (!localStorage.blobs) { localStorage.blobs = '{}'; }
  var blobs = JSON.parse(localStorage.blobs);
  
  function make_hash() {
    return sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(user + pass));
  }
  
  function newer_blob(b1, b2) {
    function blob_modified(b) {
      try { return JSON.parse(unescape(JSON.parse(atob(b)).adata)).modified; }
      catch (e) { return ''; }
    }
    return blob_modified(b1) > blob_modified(b2) ? b1 : b2;
  }
  
  blobVault.blob = '';
  blobVault.data = {};
  blobVault.meta = {};
  
  blobVault.login = function (username, password, offlineBlob, onSuccess, onFailure) {
    user = username;
    pass = password;
    hash = make_hash(user, pass);
    
    function processBlob(blob) {
      if (!blob) onFailure("Bad username or password.");
      else if (!blobVault.loadBlob(blob)) onFailure("Account decryption failed.");
      else onSuccess();
    }
    
    function processServerBlob(serverBlob) {
      var localBlob = blobs[hash] || "";
      serverBlob = serverBlob || "";
      
      if (offlineBlob) {
        if (blobVault.loadBlob(offlineBlob)) {
          this.save();
          this.pushToServer(serverBlob);
          onSuccess();
        } else {
          onFailure("Account decryption failed.");
        }
        return;
      }
      
      if (serverBlob == localBlob) {
        processBlob(localBlob);
        return;
      }
      
      var primaryBlob = (serverBlob && localBlob) ? newer_blob(serverBlob, localBlob)
                                                  : serverBlob || localBlob;
      
      // next, we try to load the primary blob selected above...
      // if successful, we overwrite the secondary blob which wasn't selected with it
      // if unsuccessful (i.e. someone modified the primary blob), we try to load the
      //   secondary blob, and, if successful, overwrite the primary one with it
      if (primaryBlob == serverBlob) {
        console.log("server blob is primary");
        if (blobVault.loadBlob(serverBlob)) {
          console.log("overwriting local blob");
          blobVault.write_blob(serverBlob);
        } else {
          if (blobVault.loadBlob(localBlob)) {
            blobVault.pushToServer(serverBlob);
          }
        }
      } else {
        console.log("local is primary");
        if (blobVault.loadBlob(localBlob)) {
          console.log("overwriting server");
          blobVault.pushToServer(serverBlob);
        } else {
          if (blobVault.loadBlob(serverBlob)) {
            blobVault.write_blob(serverBlob);
          }
        }
      }
      
      // blobVault.blob is truthy iff a loadBlob succeeded
      if (blobVault.blob) {
        onSuccess();
      } else {
        onFailure("Account decryption failed.");
      }
    }
    
    $.get('http://' + Options.BLOBVAULT_SERVER + '/' + hash)
      .success(processServerBlob)
      .error(function () {
        processBlob(blobs[hash]);
      });
  };
  
  blobVault.loadBlob = function (blob) {
    var b = atob(blob);
    try {
      this.data = JSON.parse(sjcl.decrypt(user + pass, b));
      this.meta = JSON.parse(unescape(JSON.parse(b).adata));
      this.blob = blob;
      
      if (!this.data.address_to_name) this.data.address_to_name = {};
      if (!this.data.recent_sends) this.data.recent_sends = [];
      
      return true;
    } catch (e) {
      return false;
    }
  };
  
  blobVault.register = function (username, password) {
    user = username;
    pass = password;
    hash = make_hash(user, pass);
    this.data = {};
    this.meta = {
      created: (new Date()).toJSON()
    };
  };
  
  blobVault.save = function () {
    var plaintext = JSON.stringify(this.data),
        adata, ct, key;
    
    this.meta.modified = (new Date()).toJSON();
    adata = JSON.stringify(this.meta);
    ct = sjcl.encrypt(user + pass, plaintext, { iter: 1000, adata: adata, ks: 256 });
    this.write_blob(btoa(ct));
  };
  
  blobVault.write_blob = function (blob) {
    this.blob = blobs[hash] = blob;
    localStorage.blobs = JSON.stringify(blobs);
  };
  
  function pbkdfParams(blob) {
    var b = JSON.parse(atob(blob));
    return {
      salt: b.salt && sjcl.codec.base64.toBits(b.salt),
      iter: b.iter
    };
  }
  
  function authBlobUpdate(phrase, oldBlob, newBlob) {
    var curve = sjcl.ecc.curves.c192,
        
        ecdsaKey = new sjcl.ecc.ecdsa.secretKey(curve,
          sjcl.bn.fromBits(
            sjcl.misc.cachedPbkdf2(phrase, pbkdfParams(oldBlob)).key
          ).mod(curve.r)
        ),
        
        sig = ecdsaKey.sign(sjcl.hash.sha256.hash(newBlob)),
        
        pub = curve.G.mult(
          sjcl.bn.fromBits(
            sjcl.misc.cachedPbkdf2(phrase, pbkdfParams(newBlob)).key
          ).mod(curve.r)
        );
        
    return {
      new_pub: sjcl.codec.base64.fromBits(pub.toBits()),
      sig: sjcl.codec.base64.fromBits(sig),
      blob: newBlob
    };
  }
  
  blobVault.pushToServer = function (oldBlob) {
    var data = oldBlob ? authBlobUpdate(user + pass, oldBlob, this.blob)
                       : { blob: this.blob };
    
    $.post('http://' + Options.BLOBVAULT_SERVER + '/' + hash, data);
  };
  
  blobVault.logout = function () {
    user = '';
    pass = '';
    hash = '';
    this.blob = '';
    this.data = {};
    this.meta = {};
  };
  
  // accessors for blobVault.data
  blobVault.getRecentSends = function () {
    return _.object(
      blobVault.data.recent_sends,
      _.map(
        blobVault.data.recent_sends || [],
        function (a) { return blobVault.addressBook.getName(a) || a; }
      )
    );
  };
  
  blobVault.updateRecentSends = function (addr) {
    if (addr) {
      blobVault.data.recent_sends = _.without(blobVault.data.recent_sends, addr);
      blobVault.data.recent_sends.unshift(addr);
      blobVault.data.recent_sends.splice(NUM_RECENT_ADDRESSES);
    }
  };
  
  blobVault.addressBook = (function () {
    return {
      getEntries : function () {
        return blobVault.data.address_to_name;
      },
      
      setEntry : function (name, address) {
        if (name && address) {
          blobVault.data.address_to_name[address] = name;
        } else {
          delete blobVault.data.address_to_name[address];
        }
      },
      
      getName : function (address) {
        if (address == ncc.accountID) return "you";
        return blobVault.data.address_to_name[address];
      }
    };
  })();

  return blobVault;
})();

module.exports = blobVault;

/******/ /* WEBPACK FREE VAR INJECTION */ }(require(/* __webpack_console */2)))

/******/},
/******/
/******/9: function(module, exports, require) {

var HistoryPage = (function () {
  var hist = {};

  var HistoryPage = {};
  
  HistoryPage.onShowTab = function () {
    $('#HistoryTable').empty();
    _.each(hist, function (t, hash) {
      HistoryPage.renderTransaction(t);
    });
  };

  HistoryPage.onHistoryResponse = function (res) {
    if (res) {
      _.each(
        res.transactions || [],
        function (t) {
          HistoryPage.addTransaction(t, false);
        }
      );
    }
  };
  
  HistoryPage.addTransaction = function (t, adjust) {
    hist[t.hash] = t;
    HistoryPage.renderTransaction(t, adjust);
  };
  
  HistoryPage.renderTransaction = function (t, adjust) {
    var amount;
    if (t.TransactionType == 'CreditSet') {
      amount = ncc.displayAmount(t.LimitAmount.value);
    } else {
      amount = ncc.displayAmount(t.Amount);
    }
    
    var oldEntry = $('#' + t.hash),
        
        fromAcct = t.Account,
        fromName = blobVault.addressBook.getName(fromAcct),

        toAcct = t.TransactionType == 'CreditSet' ? t.LimitAmount.issuer : t.Destination,
        toName = blobVault.addressBook.getName(toAcct),
        
        
        // no button if name matches one of these
        noBut = { 'you': 1, 'undefined': 1};
        editButtons = (' <button class="edit" onclick="HistoryPage.editName(this)">edit</button>' +
                       '<button class="save" onclick="HistoryPage.saveName(this)">save</button>');
        
        entry = ( '<td>' + (t.inLedger || t.ledger_current_index || t.ledger_closed_index) + '</td>' +
                  '<td>' + t.TransactionType + '</td>' +
                  '<td class="addr" data-acct='+ fromAcct + ' data-name="' + fromName + '">' +
                    '<span>' + (fromName || fromAcct) + '</span>' +
                    ((fromName || fromAcct) in noBut ? '' : editButtons) +
                  '</td>' +
                  '<td class="addr" data-acct='+ toAcct + ' data-name="' + toName + '">' +
                    '<span>' + (toName || toAcct) + '</span>' +
                    ((toName || toAcct) in noBut ? '' : editButtons) +
                  '</td>' +
                  '<td>' + amount + '</td>' +
                  '<td>' + t.status + '</td>' );

    if (oldEntry.length) {
      oldEntry.html(entry);
    } else {
      $('#HistoryTable').prepend('<tr id="' + t.hash + '">' + entry + '</tr>');

      if (adjust) {
        if (t.TransactionType == 'CreditSet' && t.Account == ncc.accountID) {
          ncc.changeBalance('XNS', -t.Fee);
          return;
        }

        var curr = t.Amount.currency || 'XNS',
            amt = t.Amount.value || t.Amount;

        if (t.Account == ncc.accountID) {
          ncc.changeBalance(curr, -amt);
          ncc.changeBalance('XNS', -t.Fee);
        }

        if (t.Destination == ncc.accountID) {
          ncc.changeBalance(curr, amt);
        }
      }
    }
  };

  HistoryPage.editName = function (cellElem) {
    var cell = $(cellElem).parent(),
        content = cell.find('span'),
        saveButton = cell.find('button.save'),
        editButton = cell.find('button.edit'),
        name = content.text(),
        input = $('<input>').val(name)
                            .keydown(function (e) { if (e.which == 13) saveButton.click(); });
    
    saveButton.show();
    editButton.hide();
    content.html(input);
    input.select();
  };
  
  HistoryPage.saveName = function (cellElem) {
    var cell = $(cellElem).parent(),
        addr = cell.attr('data-acct'),
        newName = cell.find('input').val();
    
    blobVault.addressBook.setEntry(newName, addr);
    blobVault.save();
    
    HistoryPage.onShowTab();
  };

  return HistoryPage;
})();

exports.HistoryPage = HistoryPage;


/******/},
/******/
/******/10: function(module, exports, require) {

/*
show multiple balances
ripple progress bar
only fetch ripple lines when you start. then use websocket
trading
console

updated accepted transactions
time stamp in feed
flash balance when it changes
update ledger page in real time
tell them when they aren't connected by the websocket

much later:
  multiple accounts
*/

var types = require(1),
    AmountValue = types.AmountValue;

var Base58Utils = require(3);

var SendPage = require(13).SendPage,
    loginScreen = require(4).LoginScreen,
    RipplePage = require(5).RipplePage,
    HistoryPage = require(9).HistoryPage,
    AddressBookPage = require(7).AddressBookPage,
    feed = require(6).FeedPage,
    TradePage = require(15).TradePage,
    OptionsPage = require(11).OptionsPage,
    welcomeScreen = require(4).WelcomeScreen,
    depositScreen = require(4).DepositScreen,
    startUp = require(14);

var ncc = $('body');

ncc.currentView = '#StartScreen';
ncc.masterKey = '';
ncc.accountID = '';
ncc.accounts = [];
ncc.balance = {'XNS' : new AmountValue(0)};
ncc.loggedIn = false;
ncc.advancedMode = false;
ncc.admin = false;

ncc.currencyOptions = {
  "USD" : "USD - US Dollar",
  "EUR" : "EUR - Euro",
  "BTC" : "BTC - Bitcoins",
  "GBP" : "GBP - British Pound",
  "AUD" : "AUD - Australian Dollar",
  "RUB" : "RUB - Russian Ruble",
  "XAU" : "XAU - Ounces of Gold",
  "XAG" : "XAG - Ounces of Silver"
};

ncc.allCurrencyOptions = {
  "XNS" : "XNS - Ripple Stamps",
  "USD" : "USD - US Dollar",
  "EUR" : "EUR - Euro",
  "BTC" : "BTC - Bitcoins",
  "GBP" : "GBP - British Pound",
  "AUD" : "AUD - Australian Dollar",
  "RUB" : "RUB - Russian Ruble",
  "XAU" : "XAU - Ounces of Gold",
  "XAG" : "XAG - Ounces of Silver"
};

ncc.on('account-Payment', function (e, tx) {
  HistoryPage.addTransaction(tx, true);
});

ncc.on('account-CreditSet', function (e, tx) {
  RipplePage.onCreditSet(tx);
});

ncc.on('account-OfferCreate', function (e, tx) {
  TradePage.appendOffer(tx);
});

ncc.on('account-OfferCancel', function (e, tx) {
  TradePage.removeOrderRow(tx.OfferSequence);
});

ncc.init = function () {
  $("#t-send").on("show", SendPage.onShowTab);
  $("#t-login").on("show", loginScreen.onShowTab);
  $("#t-ripple").on("show", RipplePage.onShowTab );
  $("#t-ledger").on("show", function () {
    remote.request_ledger(["lastclosed", "full"])
      .on('success', ledgerScreen.ledgerResponse)
      .request();
  });
  $("#t-orderbook").on("show", function () {
    remote.request_ledger(["lastclosed", "full"])
      .on('success', orderBookScreen.ledgerResponse)
      .request();
  });
  $("#t-history").on("show", HistoryPage.onShowTab);
  $("#t-address").on("show", AddressBookPage.onShowTab);
  $("#t-unl").on("show", function () {
    remote.request_unl_list()
      .on('success', unlScreen.unlResponse)
      .request();
  });
  $("#t-peers").on("show", function () {
    remote.request_peers()
      .on('success', ncc.peersResponse)
      .request();
  });
  $("#t-info").on("show", ncc.infoTabShown);
  $("#t-feed").on("show", feed.onShowTab);
  $("#t-trade").on("show", TradePage.onShowTab);
  $("#t-options").on("show", OptionsPage.onShowTab); 
  $("#t-welcome").on("show", welcomeScreen.onShowTab);
  $("#t-deposit").on("show", depositScreen.onShowTab);
  
  ncc.onLogOut();
  $('#AdvancedNav').hide();
  $('#UnlogAdvancedNav').hide();
  
  // unactives main navigation
  
  $('#UnlogAdvancedNav li a').click(function () {
    $('#UnlogTopNav li').removeClass('active');
  });
  $('#TopNav li a').click(function () {
    $('#MainNav li').removeClass('active');
    $('#AdvancedNav li').removeClass('active');
  });
  $('#AdvancedNav li a').click(function () {
    $('#MainNav li').removeClass('active');
    $('#TopNav li').removeClass('active');
  });
  $('#MainNav li a').click(function () {
    $('#AdvancedNav li').removeClass('active');
    $('#TopNav li').removeClass('active');
  });

  $('#LogoutLink').click(loginScreen.logout);
  
  startUp.start();

  loginScreen.init();
  RipplePage.init();
  OptionsPage.init();
  SendPage.init();
  TradePage.init();
  
  /* custom select boxes */
  
  if (!$.browser.opera) {
     
    // for large select 
     
    $('select.select').each(function () {
      var title = $(this).attr('title');
      if ($('option:selected', this).val() !== '') {
        title = $('option:selected',this).text();
      }
      $(this)
        .css({'z-index':10,'opacity':0,'-khtml-appearance':'none'})
        .after('<span class="select">' + title + '</span>')
        .change(function () {
          val = $('option:selected',this).text();
          $(this).next().text(val);
        });
    });
    
    // for small select
    
    $('select.select-small').each(function () {
      var title = $(this).attr('title');
      if ($('option:selected', this).val() !== '') {
        title = $('option:selected',this).text();
      }
      $(this)
        .css({'z-index':10,'opacity':0,'-khtml-appearance':'none'})
        .after('<span class="select-small">' + title + '</span>')
        .change(function () {
          val = $('option:selected',this).text();
          $(this).next().text(val);
        });
    });
  }

  ncc.navigateToHash();
  $("#GetStarted:visible").focus();
};

ncc.serverDown = function () {
  ncc.status.error('No response from server. Please check if it is running.');
};

ncc.checkError = function (response) {
  var ret = response.result.error_message || response.result.error,
      errorStr = (response.error || '') + (ret ? ' ' + ret : '');
  
  ncc.status.error(errorStr);
  
  return ret;
};

ncc.status = (function () {
  var container = $('#MainStatusArea'),
      prot = false;
  
  function status(type, msg, json) {
    if (msg) {
      var elem = container.find('div.template').clone().removeClass('template').addClass('alert-' + type);
      elem.find('p span').text(type.toUpperCase() + ": " + msg);
      try {
        elem.find('pre.json').html(
          ncc.misc.syntaxHighlight(
            JSON.stringify(json, undefined, 2)
          )
        );
        elem.find('button').show();
      } catch (e) {
        elem.find('pre.json').html('');
        elem.find('button').hide();
      }
      
      // protect messages that are within 1s of each other
      if (!prot) {
        container.find('div').not('.template').remove();
        prot = true;
        setTimeout(function () { prot = false; }, 1000);
      }
      
      container.prepend(elem);
    }
  }
  
  return {
    info: _.bind(status, this, 'info'),
    error: _.bind(status, this, 'error')
  };
})();

ncc.displayScreen = function (s) {
  document.location.hash = '#' + s;
};

ncc.displayTab = function (s) {
  $('.nav.nav-tabs:visible a[href="#' + s + '"]').show();
};

// escape a string from the server so it is safe to stick in jquery's .html()
ncc.escape = function (str) {
  if (str && str.replace)
    return str.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  return str;
};

ncc.hideTab = function (s) {
  $('.nav.nav-tabs:visible a[href="#' + s + '"]').hide();
};

ncc.processAccounts = function (accounts) {
  ncc.accounts = accounts;

  // figure total balance
  var balance = new AmountValue(0);
  for (var i = 0; i < accounts.length; i++) {
    remote.set_account_seq(accounts[i].Account, accounts[i].Sequence);
    balance.add(accounts[i].Balance);
    remote.request_account_tx(accounts[i].Account, "0", "999999")
      .on('success', HistoryPage.onHistoryResponse)
      .request();
  }

  ncc.changeBalance('XNS', balance.sub(ncc.balance['XNS']));
}

ncc.changeBalance = function (currency, delta) {
  if (currency in ncc.balance) ncc.balance[currency].add(delta);
  else ncc.balance[currency] = new AmountValue(delta);
  
  var currElem = $('li#' + currency + 'Balance');
  
  if (ncc.balance[currency].compareTo(0)) {
    var amount = (currency == 'XNS') ? ncc.displayAmount(ncc.balance[currency])
                                     : String(ncc.balance[currency]);
    
    if (currElem.length) {
      // edit
      currElem.html(amount + '<span>' + currency + '</span>');
    } else {
      // create
      currElem = $('<li id="' + currency + 'Balance">' + amount + '<span>' + currency + '</span></li>');
      $('#ClientState').after(currElem);
    }
    
    currElem.stop();
    currElem.css('color', 'red');
    currElem.animate({ color: 'white' }, 1000);
  } else {
    // delete 
    currElem.remove();
  }
}

ncc.displayAmount = function (amount) {
  if (amount === undefined) {
    return "";
  }
  
  if (amount.constructor == Number || amount.constructor == String) {
    return ncc.displayAmount(new AmountValue(amount));
  }
  
  if (amount.currency) {
    var value = amount.value;
    if (amount.currency == 'XNS') {
      return ncc.addCommas(value.div(BALANCE_DISPLAY_DIVISOR));
    } else {
      return ncc.addCommas(value) + ' ' + amount.currency;
    }
  } else {  // simple XNS
    return ncc.addCommas(amount.div(BALANCE_DISPLAY_DIVISOR));
  }
}

ncc.addCommas = function (n) {
  if (!/^[+\-]?\d+(.\d*)?$/.test(n)) throw "Invalid number format.";
  
  var s = n.toString(),
      m = s.match(/^([+\-]?\d+?)((\d{3})*)(\.\d*)?$/),
      whole = [m[1]].concat(m[2].match(/\d{3}/g) || []),
      fract = m[4] || "";
  
  return whole + fract;
}

///////////////////////////

ncc.infoTabShown = function () {
  remote.request_server_info()
    .on('success', ncc.infoResponse)
    .request();
}

ncc.infoResponse = function (res) {
  if (res.info) {
    $('#InfoServerState').text( res.info.serverState );
    $('#InfoPublicKey').text( res.info.validationPKey );
  }
}

//////////

ncc.addPeer = function () {
  ip = $.trim($("#NewPeerIP").val());
  port = $.trim($("#NewPeerPort").val());
  remote.request_connect(ip, port).request();
}

ncc.peersResponse = function (res) {
  if (res.peers) {
    $('#PeerTable').empty();
    var peers = res.peers;
    for (var i = 0; i < peers.length; i++) {
      $('#PeerTable').append(
        '<tr>' +
          '<td>' + i + '</td>' +
          '<td>' + peers[i].ip + '</td>' + 
          '<td>' + peers[i].port + '</td>' +
          '<td>' + peers[i].version + '</td>' +
        '</tr>'
      );
    }
  }
}

///////////

ncc.chageTabs = function (e) {
  //if (e.target.attributes.href(onTabShown)
  //  e.target.onTabShown();
}

ncc.nop = function () {}

ncc.toggleAdvanced = function (ele) {
  if (ncc.advancedMode) {
    $('#AdvancedNav').hide();
    $('#UnlogAdvancedNav').hide();
    ncc.advancedMode = false;
    ele.innerHTML = "Show Advanced <b class='caret'></b>";
  } else {
    ele.innerHTML = "Hide Advanced <b class='caret'></b>";
    ncc.advancedMode = true;
    if (ncc.loggedIn) $('#AdvancedNav').show();
    else $('#UnlogAdvancedNav').show();
  }
}

ncc.onLogIn = function () {
  ncc.loggedIn = true;

  $('#ClientState').html(
    'Login is ' + ncc.user +
    '. <a href="#" onclick="document.location=\'\'">Sign out</a>.'
  );
  
  $('#UnlogMainNav').hide();
  $('#UnlogTopNav').hide();
  $('#MainNav').show();
  $('#TopNav').show();
  
  if (ncc.advancedMode) {
    $('#AdvancedNav').show();
    $('#UnlogAdvancedNav').hide();
  }
  
  $('#MainNav a[href="#send"]').tab('show');
}

ncc.onLogOut = function () {
  ncc.loggedIn = false;
  
  $('#UnlogMainNav').show();
  $('#UnlogTopNav').show();
  $('#MainNav').hide();
  $('#TopNav').hide();
  
  if (ncc.advancedMode) {
    $('#AdvancedNav').hide();
    $('#UnlogAdvancedNav').show();
  }
  
  $('#UnlogTopNav a[href="#welcome"]').tab('show');
}

ncc.misc = {};

ncc.misc.isValidAddress = function (addr) {
  return Boolean(Base58Utils.decode_base_check(0, addr));
};

ncc.misc.isValidSeed = function (seed) {
  return Boolean(Base58Utils.decode_base_check(33, seed));
}

ncc.misc.syntaxHighlight = function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        var cls = /^"/.test(match) ? (/"?:$/.test(match) ? 'key': 'string')
                                   : /true|false/.test(match) ? 'boolen'
                                                              : /null/.test(match) ? 'null' : 'number';
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
};

ncc.misc.forms = (function () {
  function undoClasses() {
    this.classList.remove('ui-state-hover');
    this.classList.remove('ui-state-active');
  }
  
  return {
    disable: function (f) {
      var $f = $(f)
      $f.find("input.ui-autocomplete-input+button").each(function() {
        this.style.cursor = "not-allowed";
      }).on('hover mousedown', undoClasses);
      $f.find('button').attr('disabled', true);
      $f.find("input").attr('disabled', true);
    },
    
    enable: function (f) {
      var $f = $(f);
      $f.find("input.ui-autocomplete-input+button").each(function() {
        this.style.cursor = "auto";
      }).off('hover mousedown', undoClasses);
      $f.find('button').attr('disabled', false);
      $f.find('input').attr('disabled', false);
    }
  };
})();

ncc.misc.isValidAmount = function (amount, currency) {
  // XXX Use big integer
  if (currency == 'XNS') {
    return ((amount % 1) === 0) && (amount > 0) && (amount < 100000000000000000);
  } else {
    try {
      var a = new AmountValue(amount);
      assert(!a.isZero() && a.sign != '-');
      return !!currency;
    } catch (e) {
      return false;
    }
  }
};

ncc.navigateToHash = function () {
  var h = window.location.hash;
  if (h) {
    var tab = $('.nav.nav-tabs:visible a[href="' + h + '"]');
    if (tab.length) {
      tab.click();
    } else {
      // tab is not immediately visible
      var advNav = $("#AdvancedNav.nav.nav-tabs");
      tab = advNav.find('a[href="' + h + '"]');
      if (ncc.loggedIn && advNav.not(':visible') && tab.length) {
        // tab is in the advanced menu
        $("#AdvNavToggle").click();
        tab.click();
      } else {
        // tab is nowhere to be found, maybe we should try to login
        if ($('.nav.nav-tabs:visible a[href="#login"]').click().length) {
          $("#t-login div.heading").text("Login to see this page");
        }
      }
    }
  }
};

window.onhashchange = function () {
  $('.nav.nav-tabs:visible a[href="' + window.location.hash + '"]').click();
};

module.exports = ncc;


/******/},
/******/
/******/11: function(module, exports, require) {

var OptionsPage = {};

OptionsPage.init = function () {
  $('#OptionsPageSave').click(OptionsPage.save);
  $('#OptionsPageCancel').click(OptionsPage.cancel);
};

OptionsPage.onShowTab = function () {
  $("#WSServerOption").val(Options.WS_SERVER);
  $("#BlobVaultServerOption").val(Options.BLOBVAULT_SERVER);
}

OptionsPage.save = function () {
  Options.WS_SERVER = $.trim( $("#WSServerOption").val() );
  Options.BLOBVAULT_SERVER = $.trim( $("#BlobVaultServerOption").val() );
  Options.save();
  startUp.start();
}

OptionsPage.cancel = function () {
  if (ncc.masterKey) ncc.displayScreen('send');
  else ncc.displayScreen('welcome');
}

exports.OptionsPage = OptionsPage;


/******/},
/******/
/******/12: function(module, exports, require) {

var Base58Utils = require(3);
var RippleAddress = require(1).RippleAddress;

var RegisterScreen = {};

RegisterScreen.init = function () {
  var form = $("#registerForm").on('submit', RegisterScreen.onSubmit);

  form.find("input[name=username]").validateWithRegex(/./, "Good", "Bad");
  form.find("input[name=password]").passStrength({ userid: "#registerForm input[name=username]" });
  form.find("input[name=password2]").passEqual("#registerForm input[name=password]");
  form.find("input[name=pk]").validateWithFunction(ncc.misc.isValidSeed);
  
  form.find('input').on('input', function () {
    var nonEmpty = function () { return this.name == 'pk' || this.value.length; },
        allFilled = _.all(form.find('input:text,input:password').map(nonEmpty));
    form.find("input[type=submit]").attr('disabled', form.find("input+span.badPass").length || !allFilled);
  });
};

RegisterScreen.onShowTab = function () {};

RegisterScreen.onSubmit = function (e) {
  var form = this,
      user = form.username.value,
      pass = form.password.value,
      regErr = $("#RegError");

  e.preventDefault();

  if (form.password.value != form.password2.value) {
    regErr("Passwords must match.");
    return;
  }

  function save_and_login() {
    blobVault.save();
    blobVault.login(user, pass, '', loginScreen.finishLogin, _.bind(regErr.text, regErr));
  }

  if (user && pass && (!form.pk.value || ncc.misc.isValidSeed(form.pk.value))) {
    blobVault.register(user, pass);
    ncc.user = localStorage.user = user;
    var seed = ncc.masterKey = blobVault.data.master_seed = (
       form.pk.value || Base58Utils.encode_base_check(33, sjcl.codec.bytes.fromBits(sjcl.random.randomWords(4)))
    );
    ncc.accountID = blobVault.data.account_id = (new RippleAddress(seed)).getAddress();
    save_and_login();
  } else {
    regErr.text("Username and password can't be blank.");
  }
};

exports.RegisterScreen = RegisterScreen;


/******/},
/******/
/******/13: function(module, exports, require) {

var RipplePage = require(5).RipplePage;

var SendPage = (function () {
  var address, name, currency, amount, // private variables
      
      amntElem, // amount
      currElem, // currency
      destElem, // destination
      nameElem, // (optional) name
      buttonElem; // button

  var SendPage = {};

  SendPage.init = function () {
    $('#SendPageButton').click(SendPage.send);

    buttonElem = $("#SendPageButton");
    amntElem = $("#SendAmount");
    nameElem = $("#SendDestName");
    $("#t-send input").on('keydown', function (e) {
      if (e.which == 13 && !buttonElem.attr('disabled') && !$(this).widget) {
        buttonElem.click();
      }
    });
    amntElem.on('input', onFieldsUpdated);
  };
  
  function onFieldsUpdated() {
    address = destElem.value().replace(/\s/g, '');
    name = blobVault.addressBook.getName(address) || "";
    currency = currElem.value();
    amount = amntElem.val() * (currency == 'XNS' ? BALANCE_DISPLAY_DIVISOR : 1);
    
    $("#SpacerRow").show();
    $("#AddressDisplayRow").hide();
    $("#SendDestNameRow").hide();

    buttonElem.attr(
      'disabled', 
      !ncc.misc.isValidAmount(amount, currency)
    );
    
    if (ncc.misc.isValidAddress(address) && name != 'you') {
      $("#SpacerRow").hide();
      if (address == destElem.input.val().replace(/\s/g, '')) {
        // address in input box
        $("#SendDestNameRow").show();
        $("#SendDestName").val(name);
      } else {
        // name in input box
        $("#AddressDisplayRow").show();
        $("#AddressDisplay").val(address)
      }
    } else {
      buttonElem.attr('disabled', true);
    }
    
    destElem.button.next(".testresult").remove();
    if (!buttonElem.attr('disabled')) {
      checkCredit.call(destElem.button, amount, address, currency);
    }
  }
  
  function checkCredit(amount, addr, curr) {
    var line = RipplePage.lines[addr + '/' + curr];
    if ((curr == 'XNS' && Number(ncc.balance.XNS) >= amount)
     || (line && Number(line.limit_peer) + Number(line.balance) > amount)) {
       $(this).after($('<span>').addClass('strongPass testresult').html("<span>Ready to send</span>"));
       destElem.input.autocomplete('close');
    } else {
      if (curr == 'XNS') {
        $(this).after("<span class='badPass testresult'><span>Insufficient funds</span></span>");
      } else {
        $(this).after("<span class='badPass testresult'><span>Not enough credit</span></span>");
      }
      buttonElem.attr('disabled', true);
    }
  }

  SendPage.onShowTab = function () {
    var destinationOptions = _.extend(blobVault.getRecentSends(), blobVault.addressBook.getEntries());
    
    if (!destElem) {
      destElem = $("#SendDest").combobox({
        data: destinationOptions,
        selected: '',
        button_title: 'Recently used addresses',
        onchange: onFieldsUpdated
      }).data('combobox');
    }
    
    if (!currElem) {
      currElem = $("#SendCurrency").combobox({
        data: ncc.allCurrencyOptions,
        selected: 'XNS',
        strict: true,
        button_title: 'Select a currency',
        onchange: onFieldsUpdated
      }).data('combobox');
    }
    
    setTimeout(function () { amntElem.focus(); }, 100);
    destElem.updateData(destinationOptions)
  }
  
  SendPage.send = function () {

    var tx = remote.transaction();
    tx.payment(ncc.accountID, address, String(amount));
    tx.set_flags('CreateAccount');
    tx.on('success', SendPage.onSendResponse);
    tx.on('error', SendPage.onSendError);
    tx.submit();

    buttonElem.text("Sending...");
    ncc.misc.forms.disable('#t-send');
  };
  
  SendPage.onSendResponse = function (res) {
    var toAccount = res.dstAccountID,
    curr = res.dstISO;
    
    name = nameElem.val() || name;
    if (name) {
      blobVault.addressBook.setEntry(name, toAccount);
    }
    
    blobVault.updateRecentSends(toAccount);
    blobVault.save();
    blobVault.pushToServer();
    
    destElem.promoteEntry(toAccount);
    
    // clean up
    address = null;
    name = null;
    currency = null;
    amount = null;
    
    destElem.value('');
    $("#SendAmount").val('');
    $("#SendDestName").val('');
    $("#SendDestNameRow").hide();
    $("#AddressDisplay").val('');
    $("#AddressDisplayRow").hide();
    $("#SpacerRow").show();
    
    buttonElem.text("Send Money");
    ncc.misc.forms.enable('#t-send');
    onFieldsUpdated();
  }

  SendPage.onSendError = function () {
    buttonElem.text("Send Money");
    ncc.misc.forms.enable('#t-send');
    onFieldsUpdated();
  };

  return SendPage;
})();

exports.SendPage = SendPage;


/******/},
/******/
/******/14: function(module, exports, require) {

var feed = require(6).FeedPage;

var startUp = {};

startUp.start = function () {
  if (!Options.server.websocket_ip.indexOf("127.0.0.1") ||
      !Options.server.websocket_ip.indexOf("localhost")) {
    ncc.admin = true;
  } else {
    ncc.admin = false;
    ncc.displayScreen('welcome');
    ncc.displayScreen('send');
  }

  window.remote = new ripple.Remote(Options.server.trusted,
                                    Options.server.websocket_ip,
                                    Options.server.websocket_port,
                                    true);
  remote.connect();

  feed.init(remote);

  var hostinfo = Options.server.websocket_ip + ":" +
    Options.server.websocket_port;
  ncc.status.info("connecting to " + hostinfo);
  $('#ServerDisplay').text("Connecting to: " + hostinfo);
}

module.exports = startUp;


/******/},
/******/
/******/15: function(module, exports, require) {

var TradePage = (function () {
  var sellCurr, buyCurr,    // private vars
      outAmount, outIssuer,
      inAmount, inIssuer,
      price,
      
      sellCurrElem, buyCurreElem, // form elements
      amountElem, priceElem,
      buttonElem,
      
      openOrderTable;

  var TradePage = {};
      
  TradePage.init = function () {
    $("#t-trade input").on('keydown', function (e) {
      if (e.which == 13 && !buttonElem.attr('disabled') && !$(this).widget) {
        buttonElem.click();
      }
    });
    
    sellCurrElem = $("#TradePageSellCurr").combobox({
      data: ncc.allCurrencyOptions,
      strict: true,
      selected: 'USD',
      onchange: onFieldsUpdated
    }).data('combobox');
  
    buyCurreElem = $("#TradePageBuyCurr").combobox({
      data: ncc.allCurrencyOptions,
      strict: true,
      selected: 'XNS',
      onchange: onFieldsUpdated
    }).data('combobox');
  
    amountElem = $('#TradePageAmount').on('input', onFieldsUpdated);
    priceElem = $('#TradePagePrice').on('input', onFieldsUpdated);
    buttonElem = $("#TradePageButton");
    openOrderTable = $("#OpenOrderTable");

    $('#TradePageButton').click(TradePage.placeOrder);
  };
  
  function onFieldsUpdated() {
    sellCurr = sellCurrElem.value();
    buyCurr = buyCurreElem.value();
    
    outAmount = amountElem.val();
    price = priceElem.val();
    inAmount = outAmount * price;
    
    if (!(sellCurr && buyCurr && inAmount)) {
      buttonElem.attr('disabled', true);
      TradePage.status.clear();
      return;
    }
    
    var outIssuer;
    if (sellCurr == 'XNS') {
      outIssuer = '';
      outAmount *= BALANCE_DISPLAY_DIVISOR;
    } else {
      outIssuer = ncc.accountID;
    }

    var inRoute;
    if (buyCurr == 'XNS') { 
      inAmount *= BALANCE_DISPLAY_DIVISOR;
      inRoute = { 'max': inAmount + 10, 'accountID': '' };
    } else {
      // need to discover the inIssuer
      inRoute = RipplePage.findBestRouteIn(buyCurr);
    }
    
    inIssuer = inRoute.accountID;
    
    if (sellCurr == buyCurr) {
      TradePage.status.error("Sell Currency cannot equal Buy Currency");
      return;
    }
    
    if (inRoute.max >= inAmount) {
      TradePage.status.info(
        // You are wanting to buy 10 USD for 1000 XNS (price .001)
        "You are wanting to buy " +
        (buyCurr == 'XNS' ? inAmount / BALANCE_DISPLAY_DIVISOR : inAmount) + ' ' + buyCurr + 
        " for " + 
        (sellCurr == 'XNS' ? outAmount / BALANCE_DISPLAY_DIVISOR : outAmount) + ' ' + sellCurr + 
        " (priced " + price + " each)"
      );
    } else {
      TradePage.status.error("Increase your trust network for " + buyCurr + " IOUs first.");
    }
  }
  
  TradePage.onShowTab = function () {
    onFieldsUpdated();

    remote.request_ledger(["lastclosed", "full"])
      .on('success', TradePage.onLedgerResponse)
      .request();
  };
  
  TradePage.placeOrder = function () {
    var takerPays = "" + inAmount + "/" + buyCurr + "/" + inIssuer;
    var takerGets = "" + outAmount + "/" + sellCurr + "/" + outIssuer;
    remote.transaction()
      .offer_create(ncc.accountID,
                    takerPays,
                    takerGets,
                    '0')
      .on('success', TradePage.onOfferCreateResponse)
      .submit()
    ;
  }
  
  TradePage.onOfferCreateResponse = function (res, noErrors) {
    if (noErrors) {
      sellCurrElem.value('USD');
      buyCurreElem.value('XNS');
      amountElem.val('');
      priceElem.val('');
      onFieldsUpdated();
    }
  };
  
  TradePage.status = {
    info: function (s) {
      if (s) {
        $("#TradePageStatus div.info").show().text(s);
        this.error(null);
        buttonElem.attr('disabled', false);
      } else {
        $("#TradePageStatus div.info").hide();
      }
    },
    
    error: function (e) {
      if (e) {
        $("#TradePageStatus div.error").show().text(e);
        this.info(null);
        buttonElem.attr('disabled', true);
      } else {
        $("#TradePageStatus div.error").hide();
      }
    },
    
    clear: function () {
      $("#TradePageStatus div").hide();
    }
  };
  
  function createOrderRow(a) {
    var takerGets = Amount(a.TakerGets),
        takerPays = Amount(a.TakerPays);
    
    return ('<tr data-sequence="' + a.Sequence + '">' +
              '<td>' + '' + '</td>' +
              '<td>' + takerGets.currency + '/' + takerPays.currency + '</td>' +
              '<td>' + (takerPays.value / takerGets.value) + '</td>' +
              '<td>' + takerGets.value + '</td>' +
              '<td>' + (a.status || 'closed') + '</td>' +
              '<td>' +
                '<button onclick="TradePage.cancelOffer(this.parentElement.parentElement);">' +
                  'cancel?' +
                '</button>' +
              '</td>' +
            '</tr>');
             
  }
  
  // the following methods populate and modify the offer table
  TradePage.onLedgerResponse = function (res) {
    if (res.ledger) {
      var tbody = openOrderTable.empty();
      _.each(
        res.ledger.accountState || [],
        function (a) {
          if (a.Account == ncc.accountID && a.LedgerEntryType == "Offer") {
            tbody.append(createOrderRow(a));
          }
        }
      );
    }
  };
  
  TradePage.appendOffer = function (a) {
    var tr = openOrderTable.find('tr[data-sequence=' + a.Sequence +']');
    if (tr.length) {
      tr.replaceWith(createOrderRow(a));
    } else {
      openOrderTable.append(createOrderRow(a));
    }
  };
  
  TradePage.cancelOffer = function (rowElem) {
    var row = $(rowElem),
        button = row.find('button');
    if (button.text() == 'cancel?') {
      button.text("cancel!");
    } else {
      remote.transaction()
        .offer_cancel(ncc.accountID, row.attr('data-sequence'))
        .on('success', 
            function callback(res) {
              row.css('opacity', '0.5');
              button.attr('diabled', true);
              button.text('canceling');
            });
    }
  };
  
  TradePage.removeOrderRow = function (seq) {
    openOrderTable.find('tr[data-sequence=' + seq +']').remove();
  };

  return TradePage;
})();

exports.TradePage = TradePage;


/******/}
/******/})