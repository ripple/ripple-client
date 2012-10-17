$(document).ready(function () {

$.widget("ui.combobox", {
  // default options
  options: {
    strict: false,
    data: null,
    selected: null,
    button_title: "Show All Items"
  },
  
  _create: function () {
    var self = this,
        select, input;
    
    if (this.element[0].nodeName == "SELECT") {
      select = this.element.hide()
      input = $("<input>").insertAfter(select);
    } else {
      input = this.element;
      select = $("<select>").attr('id', this.element[0].id + 'Select')
                            .insertBefore(this.element)
                            .hide();
    }
    
    this.input = input;
    this.select = select;
    
    if (this.options.data) {
      select.append(new Option('', ''));
      $.each(this.options.data, function (val, text) {
        select.append(new Option(text, val));
      });
      select.val(this.options.selected);
    }
    
    var selected = select.children(":selected"),
        value = selected.val() ? selected.text() : "";
    
    // input definition
    input.val(value)
      .on('blur', function () {
        if (!self.select.val() && self.options.strict) {
          self.input.val('');
          self._trigger("onchange");
        }
      })
      .on('input', function (e) {
        self.cleanup(e);
      })
      .on('keydown', function (e) {
        if (e.which == 13) {
          var m = input.data('autocomplete').menu,
              es = m.element.find('li:visible');
          
          if (es.length) {
            m.active = m.active || es.eq(0);
            m.select(event);
            // add this if you're using forms
            // e.preventDefault();
          }
        }
      })
      .autocomplete({
        delay: 0,
        minLength: 0,
        source: function (request, response) {
          var escapedTerm = $.ui.autocomplete.escapeRegex(request.term),
              matcher = new RegExp(escapedTerm, "i");
          response(select.children("option").map(function () {
            var text = $(this).text();
            if (this.value && (!request.term || matcher.test(text))) {
              return {
                label: text.replace(
                  new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + escapedTerm + ")(?![^<>]*>)(?![^&;]+;)", "gi"),
                  "<strong>$1</strong>"
               ),
                value: text,
                option: this
              };
            }
            
          }));
        },
        
        select: function (event, ui) {
          ui.item.option.selected = true;
          input.val(ui.item.value);
          self._trigger("onchange", event, { item: ui.item.option });
          self._trigger("onselect");
        },
        
        autocomplete : function (value) {
          select.val(value);
          input.val(value);
        },
        
        change: function (event, ui) {
          self.cleanup();
        },
        
        open: function (event, ui) {
          input.stop();
          input.animate({'borderBottomLeftRadius': 0});
          self.widget = $(this).autocomplete('widget');
        },
        close: function (event, ui) {
          input.stop();
          input.animate({'borderBottomLeftRadius': borderRadius });
          delete self.widget;
        }
        
      })
      .addClass("ui-widget-content ui-corner-left"); // ui-widget
    
    var borderRadius = input.css('borderBottomLeftRadius');
    
    input.data("autocomplete")._renderItem = function (ul, item) {
      return $("<li></li>")
        .data("item.autocomplete", item)
        .append("<a>" + item.label + "</a>")
        .appendTo(ul);
    };
    
    this.button = $("<button type='button' class='combo_button'>&nbsp;</button>")
      .attr("tabIndex", -1)
      .attr("title", this.options.button_title)
      .insertAfter(input)
      .button({
        icons: {
          primary: "ui-icon-triangle-1-s"
        },
        text: false
      })
      .removeClass("ui-corner-all")
      .addClass("ui-corner-right ui-button-icon")
      .click(function () {
        // close if already visible
        if (input.autocomplete("widget").is(":visible")) {
          input.autocomplete("close");
          return;
        }
        
        if (!input.attr("disabled")) {
          // pass empty string as value to search for, displaying all results
          input.autocomplete("search", "");
          input.focus();
        }
      });
  },
  
  cleanup: function (e) {
    var self = this,
        selectVal = self.select.val(),
        matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(self.input.val()) + "$", "i");
    
    self.select.children("option").each(function () {
      if (matcher.test(this.value)) {
        this.selected = true;
        self.input.val(this.value);
        return false;
      } else if (matcher.test(this.text)) {
        this.selected = true;
        self.input.val(this.text);
        return false;
      } else {
        self.select.val('');
      }
    });
    
    if (self.select.val() != selectVal) {
      self._trigger("onchange");
    }
    
    if (self.select.val()) {
      self._trigger("onselect");
      e && e.stopImmediatePropagation();
      setTimeout(function () {
        self.input.autocomplete("close");
      }, 1);
    }
  },
  
  value: function () {
    if (this.options.strict) {
      return this.select.children(":selected").val();
    } else {
      return this.select.children(":selected").val() || (this.input.val());
    }
  },
  
  updateData: function (data) {
    var self = this;
    self.select.children("option[value!='']").remove();
    _.each(data, function (name, addr) {
      self.select.append(new Option(name, addr));
    });
    self.cleanup();
  },
  
  promoteEntry: function (value) {
    var sel = this.select;
        text = sel.find("option[value=" + value + "]").remove().text();
    sel.prepend(new Option(text, value));
  }
}
  
  

);});