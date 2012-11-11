var unlScreen = {
  'unl': []
};

unlScreen.addUNLNode = function () {
  addr = $.trim($("#NewUNLNodeKey").val());
  note = $.trim($("#NewUNLNodeNote").val());
  remote.request_unl_add(addr, note).request();
};

unlScreen.unlResponse = function (res) {
  if (res.unl) {
    $('#UNLTable').empty();
    unlScreen.unl = res.unl;
    for(var i = 0; i < unlScreen.unl.length; i++) {
      var rowStr = '<tr><td>' + i + '</td><td>' + unlScreen.unl[i].publicKey + '</td><td>' + unlScreen.unl[i].comment;
      rowStr += '</td><td><button class="btn btn-danger" onclick="unlScreen.remove(' + i + ')">Remove</button></td></tr>';
      $('#UNLTable').append(rowStr);
    }
  }
};

unlScreen.remove = function (index) {
  if (index < unlScreen.unl.length) {
    remote.request_unl_delete(unlScreen.unl[index].publicKey).request();
  }
};
