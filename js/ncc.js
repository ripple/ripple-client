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

var ncc = {};

ncc.currentView = '#StartScreen';
ncc.masterKey = '';
ncc.accountID = '';
ncc.accounts = [];
ncc.balance = {'XNS' : 0};
ncc.loggedIn = false;
ncc.advancedMode = false;
ncc.admin = false;
ncc.dataStore = dataStoreOptions[DATA_STORE];

ncc.currencyOptions = {
  "AUD" : "AUD-Australian Dollar",
  "BTC" : "BTC-Bitcoins",
  "EUR" : "EUR-Euro",
  "GBP" : "GBP-British Pound",
  "RUB" : "RUB-Russian Ruble",
  "USD" : "USD-US Dollar",
  "XAU" : "XAU-Ounces of Gold",
  "XAG" : "XAG-Ounces of Silver"
};

ncc.allCurrencyOptions = {
  "AUD" : "AUD-Australian Dollar",
  "BTC" : "BTC-Bitcoins",
  "EUR" : "EUR-Euro",
  "GBP" : "GBP-British Pound",
  "RUB" : "RUB-Russian Ruble",
  "USD" : "USD-US Dollar",
  "XAU" : "XAU-Ounces of Gold",
  "XAG" : "XAG-Ounces of Silver",
  "XNS" : "XNS-Newcoin Stamps" 
};

ncc.serverDown = function () {
  ncc.error('No response from server. Please check if it is running.');
}

ncc.checkError = function (response) {
  var ret = response.result.error_message || response.result.error,
      errorStr = (response.error || '') + (ret ? ' ' + ret : '');
  
  ncc.error(errorStr);
  
  return ret;
}

ncc.status = function (str) {
  if (str) {
    $('#StatusDiv').show();
    $('#status').text(str);
  } else {
    $('#StatusDiv').hide();
  }
}

ncc.error = function (str) {
  if (str) {
    $('#ErrorDiv').show();
    $('#error').text(str);
  } else {
    $('#ErrorDiv').hide();
  }
}

ncc.displayScreen = function (s) {
  $('.nav.nav-tabs:visible a[href="#t-' + s + '"]').click();
}

ncc.displayTab = function (s) {
  $('.nav.nav-tabs:visible a[href="#t-' + s + '"]').show();
}

ncc.processAccounts = function (accounts)
{
  ncc.accounts = accounts;
  
  // figure total balance
  var balance = 0;
  for (var i = 0; i < accounts.length; i++) {
    balance += accounts[i].Balance;
    ncc.accountID = accounts[i].Account;
    server.accountSubscribe(accounts[i].Account);
    rpc.account_tx(accounts[i].Account, history.onHistoryResponse);
  }
  
  if (blobVault.data.account_id != ncc.accountID) {
    blobVault.data.account_id = ncc.accountID;
    blobVault.save();
    blobVault.pushToServer();
  }
  
  ncc.changeBalance('XNS', balance - ncc.balance['XNS']);
  $('#RecvAddress').text(ncc.accountID);
}

ncc.changeBalance = function (currency, delta) {
  if (currency in ncc.balance) ncc.balance[currency] += delta;
  else ncc.balance[currency] = delta;
  
  var currElem = $('li#' + currency + 'Balance');
  
  if (ncc.balance[currency] > 0) {
    var amount = (currency == 'XNS') ? ncc.displayAmount(ncc.balance[currency])
                                     : ncc.balance[currency];
    
    if (currElem.length) {
      // edit
      currElem.html(amount + '<span>' + currency + '</span>');
    } else {
      // create
      $('#ClientState').after('<li id="' + currency + 'Balance">' + amount + '<span>' + currency + '</span></li>');
    }
  } else {
    // delete 
    currElem.remove();
  }
}

ncc.displayAmount = function (amount)
{
  if (amount === undefined) return "";
  if (amount.currency)
  {
    var value = amount.value;
    if (amount.currency == 'XNS')
    {
      value /= BALANCE_DISPLAY_DIVISOR;
      return ncc.addCommas(value);
    } else {
      return ncc.addCommas(value) + ' ' + amount.currency;
    }
  } else {  // simple XNS
    amount /= BALANCE_DISPLAY_DIVISOR;
    return ncc.addCommas(amount);
  }
}

ncc.addCommas = function (nStr) 
{
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

///////////////////////////

ncc.infoTabShown = function ()
{
  rpc.server_info(ncc.infoResponse);
}

ncc.infoResponse = function (response,success)
{
  if (success)
  {
    ncc.checkError(response);
    
    if (response.result.info)
    {
      $('#InfoServerState').text( response.result.info.serverState );
      $('#InfoPublicKey').text( response.result.info.validationPKey );
    }
    
  } else {
    ncc.serverDown();
  }
}

//////////

ncc.addPeer = function ()
{
  ip = $.trim( $("#NewPeerIP").val());
  port = $.trim( $("#NewPeerPort").val());
  rpc.connect(ip,port);
}

ncc.peersResponse = function (response,success)
{
  if (success)
  {
    ncc.checkError(response);
    
    //$('#status').text(JSON.stringify(response));
    if (response.result.peers)
    {
      $('#PeerTable').empty();
      var peers = response.result.peers;
      for(var i = 0; i < peers.length; i++)
      {
        $('#PeerTable').append('<tr><td>'+i+'</td><td>'+peers[i].ip+'</td><td>'+peers[i].port+'</td><td>'+peers[i].version+'</td></tr>');  // #PeerTable is actually the tbody element so this append works
      }
    }
  } else ncc.serverDown();
}

///////////

ncc.chageTabs = function (e)
{
  //if (e.target.attributes.href(onTabShown)
  //  e.target.onTabShown();
}

ncc.nop = function () {}

ncc.toggleAdvanced = function (ele)
{
  if (ncc.advancedMode)
  {
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

ncc.onLogIn = function ()
{
  ncc.loggedIn = true;
  
  $('#UnlogMainNav').hide();
  $('#UnlogTopNav').hide();
  $('#MainNav').show();
  $('#TopNav').show();
  
  if (ncc.advancedMode) {
    $('#AdvancedNav').show();
    $('#UnlogAdvancedNav').hide();
  }
  
  $('#MainNav a[href="#t-send"]').tab('show');
}

ncc.onLogOut = function ()
{
  ncc.loggedIn = false;
  
  $('#UnlogMainNav').show();
  $('#UnlogTopNav').show();
  $('#MainNav').hide();
  $('#TopNav').hide();
  if (ncc.advancedMode)
  {
    $('#AdvancedNav').hide();
    $('#UnlogAdvancedNav').show();
  }
  
  $('#UnlogTopNav a[href="#t-welcome"]').tab('show');
}

$(document).ready(function () {
          
  $("#t-send").on("show", send.onShowTab);
  $("#t-login").on("show", loginScreen.onShowTab);
  $("#t-ripple").on("show", ripple.onShowTab );
  $("#t-ledger").on("show", function () { rpc.ledger(ledgerScreen.ledgerResponse); });
  $("#t-orderbook").on("show", function () { rpc.ledger(orderBookScreen.ledgerResponse); });
  $("#t-history").on("show", history.onShowTab);
  $("#t-unl").on("show", function () { rpc.unl_list(unlScreen.unlResponse); });
  $("#t-peers").on("show", function () { rpc.peers(ncc.peersResponse); });
  $("#t-info").on("show", ncc.infoTabShown);
  $("#t-feed").on("show", feed.onShowTab);
  $("#t-trade").on("show", trade.onShowTab);
  $("#t-options").on("show", optionScreen.onShowTab); 
  $("#t-welcome").on("show", welcomeScreen.onShowTab);
  
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
  
  startUp.start();
  
  /* custom select boxes */
  
  if (!$.browser.opera) {
     
    // for large select 
     
    $('select.select').each(function () {
      var title = $(this).attr('title');
      if ($('option:selected', this).val() != '') {
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
      if ($('option:selected', this).val() != '') {
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
  };
});

