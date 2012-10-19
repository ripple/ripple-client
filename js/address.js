var AddressBookPage = new (function () {
  var AddressBookTable = $("#AddressBookTable"),
      
      populatedRow = function (name, addr) {
        return ('<tr data-name="' + name + '" data-addr="' + addr + '">' +
                  '<td class="addr">' + addr + '</td>' +
                  '<td class="name">' + name + '</td>' +
                  '<td class="edit">' +
                    '<button class="edit" onclick="AddressBookPage.editRow(this.parentElement.parentElement)">edit</button>' +
                    '<button class="save" onclick="AddressBookPage.saveRow(this.parentElement.parentElement)">save</button>' +
                  '</td>' +
                '</tr>');
      },
      
      newRow = ('<tr data-name="" data-addr="">' +
                  '<td class="addr"><input name="addr" /></td>' +
                  '<td class="name"><input name="name" /></td>' +
                  '<td class="edit">' +
                    '<button class="edit" onclick="AddressBookPage.editRow(this.parentElement.parentElement)">edit</button>' +
                    '<button class="save" onclick="AddressBookPage.saveRow(this.parentElement.parentElement)">save</button>' +
                  '</td>' +
                '</tr>'),
      
      addRow = ('<tr>' +
                  '<td class="addr">&nbsp;</td>' +
                  '<td class="name">&nbsp;</td>' +
                  '<td class="edit">' +
                    '<button class="add" onclick="AddressBookPage.newRow()">add</button>' +
                  '</td>' +
                '</tr>');
  
  this.onShowTab = function () {
    AddressBookTable.html('');
    
    _.each(
      blobVault.addressBook.getEntries(),
      function (name, addr) {
        AddressBookTable.append(populatedRow(name, addr));
      }
    );
    
    AddressBookTable.append(addRow);
  };
  
  this.newRow = function () {
    var row = $(newRow),
        editButton = row.find('button.edit'),
        saveButton = row.find('button.save');
    
    AddressBookTable.find('tr:last').before(row);
    editButton.hide();
    saveButton.show();
    
    row.find('input').keydown(function (e) { if (e.which == 13) saveButton.click(); });
    row.find('input:first').focus();
  };
  
  this.editRow = function (rowElem) {
    var row = $(rowElem),
        editButton = row.find('button.edit'),
        saveButton = row.find('button.save');
    
    editButton.hide();
    saveButton.show();
    
    row.find('td.name').html($('<input name="name">').val(row.attr('data-name')));
    row.find('td.name input').focus().keydown(function (e) { if (e.which == 13) saveButton.click(); });
  }
  
  this.saveRow = function (rowElem) {
    var row = $(rowElem),
        oldName = row.attr('data-name'),
        newName = row.find('td.name input').val(),
        addr = row.find('td.addr input').val() || row.attr('data-addr');
    
    if (newName) {
      row.find('button.save').hide();
      row.find('button.edit').show();
      row.find('td.name').text(newName);
      row.find('td.addr').text(addr);
      row.attr('data-name', newName);
      row.attr('data-addr', addr);
    } else {
      row.remove();
    }
    
    // update blobVault
    blobVault.addressBook.setEntry(newName, addr);
    blobVault.save();
    
    return false;
  }
})();


$(document).ready(function () {
  // ...
});
