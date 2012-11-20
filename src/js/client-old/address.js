// XXX Make non-global

var AddressBookPage = window.AddressBookPage = (function () {
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
