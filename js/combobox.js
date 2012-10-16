$(document).ready(function (){

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
        defaultOption = new Option('', ''),
        select, input;
    
    if (this.element[0].nodeName == "SELECT") {
      select = this.element.hide()
      input = this.input = $("<input>").insertAfter(select);
    } else {
      input = this.element;
      select = $("<select>").attr('id', this.element[0].id + 'Select')
                            .insertBefore(this.element)
                            .hide();
    }
    
    if (this.options.data) {
      select.append(defaultOption);
      $.each(this.options.data, function (val, text) {
        select.append(new Option(text, val));
      });
      select.val(this.options.selected);
    }
    
    var selected = select.children(":selected"),
        value = selected.val() ? selected.text() : "",
        strict = this.options.strict;
    
    function valChanged(e) {
      var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(this.value) + "$", "i");
      select.children("option").each(function () {
        if (matcher.test(this.text)) {
          this.selected = true;
          return false;
        } else {
          defaultOption.selected = true;
        }
      });
      
      var a = input.data('autocomplete'),
          m = a.menu,
          es = m.element.find('li:visible');
      
      if ((e.which == 13 && es.length) || (es.length == 1 && (new RegExp(es.eq(0).text(), "i")).test(input.val()))) {
        m.active = m.active || es.eq(0);
        m.select(event);
        e.preventDefault();
      }
    }
    
    input.val(value)
      .on('input', valChanged)
      .on('keydown', valChanged)
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
          self._trigger("onselect", event, { item: ui.item.option });
        },
        
        autocomplete : function (value) {
          select.val(value);
          input.val(value);
        },
        
        change: function (event, ui) {
          valChanged.call(this, event);
          self._trigger("onchange", event);
          if (!ui.item) {
            var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex($(this).val()) + "$", "i"),
                valid = false;
            select.children("option").each(function () {
              if (this.value.match(matcher)) {
                this.selected = valid = true;
                return false;
              }
            });
            if (!valid) {
              // if strict is true, then unmatched values are not allowed
              if (strict) {
                // remove invalid value, as it didn't match anything
                $(this).val("");
                select.val("");
              }
              return false;
            }
          }
        },
        
        open: function (event, ui) {
          input.animate({'borderBottomLeftRadius': 0});
        },
        
        close: function (event, ui) {
          input.animate({'borderBottomLeftRadius': 10});
        }
        
      })
      .addClass("ui-widget-content ui-corner-left"); // ui-widget
    
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
    }
  });
});