var RippleAddress = require('./types').RippleAddress,
    AmountValue = require('./types').AmountValue;

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
