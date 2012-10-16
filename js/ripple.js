var RipplePage = new (function () {
  var address, name, creditMax,
      addCreditLineButton;
  
  this.lines = {};
  
  this.onShowTab = function () {
    var recentSends = _.extend(
      blobVault.getRecentSends(),
      blobVault.addressBook.getEntries()
    );
    
    addCreditLineButton.attr('disabled', true);
    
    function onNewVal() {
      address = $("#NewCreditAccountSelect").val() || $("#NewCreditAccount").val();
      name = blobVault.addressBook.getName(address) || '';
      creditMax = $("#NewCreditMax").val();
      
      try { // checks that the value is representable and >= 0
        assert((new AmountValue(creditMax)).sign != "-");
      } catch (e) {
        creditMax = "bad";
      }
      
      var allgud = ncc.misc.isValidAddress(address) && creditMax != 'bad';
      addCreditLineButton.attr('disabled', !allgud);
    }
    
    $("#t-ripple input").on('keydown', function (e) {
      if (e.which == 13 && !$(this).autocomplete("widget").is(":visible") && !addCreditLineButton.attr('disabled')) {
        addCreditLineButton.click();
      }
    });
    
    $("#NewCreditAccount").combobox({
      data: recentSends,
      selected: '',
      button_title: 'Recently used addresses',
      onchange: onNewVal,
      onselect: onNewVal
    });
    
    $("#t-ripple input").on('keydown input', function (e) {
      if (e.which == 13 && !addCreditLineButton.attr('disabled')) {
        
      } else {
        onNewVal();
      }
    });
    
    var select = $("#NewCreditAccountSelect");
    select.children("option[value!='']").remove();
    _.each(
      recentSends,
      function (name, addr) {
        select.append(new Option(name, addr));
      }
    );
    
    $("#NewCreditAccount").trigger('input');
    RipplePage.renderLines();
  }
  
  this.getLinesResponse = function (response, success) {
    if (success) {
      ncc.checkError(response);
      ncc.status(JSON.stringify(response));
      
      if (response.result.lines) {
        RipplePage.lines = _.object(
          _.map(
            response.result.lines,
            function (l) { return l.account + '/' + l.currency; }
          ),
          response.result.lines
        );
        RipplePage.renderLines();
      }
    } else {
      ncc.serverDown();
    }
  };
  
  this.renderLines = function () {
    for (var curr in ncc.balance) {
      if (curr != 'XNS') {
        delete ncc.balance[curr];
      }
    }
    
    $('#RippleTable').empty();
    _.each(
      RipplePage.lines,
      function (line) {
        ncc.changeBalance(line.currency, line.balance);
        $('#RippleTable').prepend(RipplePage.renderLine(line));
      }
    );
  }
  
  this.addLine = function () {
    var currency = $("#NewCreditCurrency").val();
    rpc.ripple_line_set(ncc.masterKey, ncc.accountID, address, creditMax, currency, RipplePage.setLineResponse);
    $("#AddCreditLineButton, #t-ripple input").attr('disabled', true);
  }
  
  this.setLineResponse = function (res, success) {
    var sel = $("#NewCreditAccountSelect");
    
    if (success) {
      ncc.checkError(res);
      ncc.status(JSON.stringify(res));
      
      blobVault.updateRecentSends(address);
      blobVault.save();
      blobVault.pushToServer();
      
      sel.find("option[value=" + address + "]").remove();
      sel.prepend(new Option(name || address, address));
      
      var limit = res.result.transaction.LimitAmount,
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
    } else {
      ncc.serverDown();
    }
    
    $("#NewCreditAccount, #NewCreditMax").val('');
    $("#AddCreditLineButton, #t-ripple input").attr('disabled', false);
    $("#NewCreditAccount").trigger('input');
    address = '';
    name = '';
    creditMax = '';
  }
  
  this.renderLine = function (line) {
    return (
      '<tr>' + 
        '<td>' + (-line.limit_peer) + '</td>' +
        '<td>' + line.balance + ' ' + line.currency + '</td>' +
        '<td>' + line.limit + '</td>' +
        '<td>' + (blobVault.addressBook.getName(line.account) || line.account) + '</td>' +
        '<td></td>' + 
        '<td></td>' +
      '</tr>'
    );
  }
  
  // this will return the accountID of the line that has the most credit left in that currency 
  this.findBestRouteIn = function (currency) {
    var bestAccount = null,
        max = 0;
    
    // TODO(cleanup): use _.max
    RipplePage.lines.each(function (line) {
      if (line.currency == currency) {
        var left = line.limit - line.balance;
        if (left > max) {
          max = left;
          bestAccount = line.account;
        }
      }
    });
    
    return({ 'accountID' : bestAccount , 'max' : max }); 
  }  

  $(document).ready(function () {
    addCreditLineButton = $("#AddCreditLineButton");
    $("#NewCreditCurrency").combobox({ data: ncc.currencyOptions , selected: 'USD' });
  });

})();

