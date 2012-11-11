var SendPage = new (function () {
  var address, name, currency, amount, // private variables
      
      amntElem, // amount
      currElem, // currency
      destElem, // destination
      nameElem, // (optional) name
      buttonElem; // button
  
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
  
  $(document).ready(function () {
    buttonElem = $("#SendPageButton");
    amntElem = $("#SendAmount");
    nameElem = $("#SendDestName");
    $("#t-send input").on('keydown', function (e) {
      if (e.which == 13 && !buttonElem.attr('disabled') && !$(this).widget) {
        buttonElem.click();
      }
    });
    amntElem.on('input', onFieldsUpdated);
  });
  
  this.onShowTab = function () {
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
  
  this.send = function () {

    var tx = remote.transaction();
    tx.payment(ncc.accountID, address, String(amount));
    tx.set_flags('CreateAccount');
    tx.on('success', SendPage.onSendResponse);
    tx.on('error', SendPage.onSendError);
    tx.submit();

    buttonElem.text("Sending...");
    ncc.misc.forms.disable('#t-send');
  };
  
  this.onSendResponse = function (res) {
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
    delete address;
    delete name;
    delete currency;
    delete amount;
    
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

  this.onSendError = function () {
    buttonElem.text("Send Money");
    ncc.misc.forms.enable('#t-send');
    onFieldsUpdated();
  };
})();
