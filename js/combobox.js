$(document).ready(function(){

$.widget( "ui.combobox", {
	// default options
	options: {
		strict: false,
		data: null,
		selected: null
	},
	
	_create: function() {
		var self = this,
				select = this.element.hide();
				
		if (this.options.data) {
			$.each(this.options.data, function (val, text) {
				select.append(new Option(text,val));
			});
			select.val(this.options.selected);
		}
		
		var selected = select.children( ":selected" ),
				value = selected.val() ? selected.text() : "",
				strict = this.options.strict,
				input = this.input = $("<input>")
					.insertAfter( select )
					.val( value )
					.autocomplete({
						delay: 0,
						minLength: 0,
						source: function( request, response ) {
							var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
							response( select.children( "option" ).map(function() {
								var text = $( this ).text();
								if ( this.value && ( !request.term || matcher.test(text) ) ) {
									return {
										label: text.replace(
											new RegExp("(?![^&;]+;)(?!<[^<>]*)(" +
												$.ui.autocomplete.escapeRegex(request.term) +
												")(?![^<>]*>)(?![^&;]+;)", "gi"),
											"<strong>$1</strong>"
										),
										value: text,
										option: this
									};
								}
									
							}) );
						},
						
						select: function( event, ui ) {
							ui.item.option.selected = true;
							self._trigger( "selected", event, { item: ui.item.option } );
						},
						autocomplete : function(value) {
							this.element.val(value);
							this.input.val(value);
						},
						change: function( event, ui ) {
							if ( !ui.item ) {
								var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
										valid = false;
								select.children( "option" ).each(function() {
									if ( this.value.match( matcher ) ) {
										this.selected = valid = true;
										return false;
									}
								});
								if ( !valid ) {
									// if strict is true, then unmatched values are not allowed
									if ( strict ) {
										// remove invalid value, as it didn't match anything
										$( this ).val( "" );
										select.val( "" );
									}
									return false;
								}
							}
						}
					})
					.addClass( "ui-widget-content ui-corner-left" ); // ui-widget
		
		input.data( "autocomplete" )._renderItem = function( ul, item ) {
			return $( "<li></li>" )
				.data( "item.autocomplete", item )
				.append( "<a>" + item.label + "</a>" )
				.appendTo( ul );
		};
		
		this.button = $( "<button type='button' class='combo_button'>&nbsp;</button>" )
			.attr( "tabIndex", -1 )
			.attr( "title", "Show All Items" )
			.insertAfter( input )
			.button({
				icons: {
					primary: "ui-icon-triangle-1-s"
				},
				text: false
			})
			.removeClass( "ui-corner-all" )
			.addClass( "ui-corner-right ui-button-icon" )
			.click(function() {
				// close if already visible
				if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
					input.autocomplete( "close" );
					return;
				}
				
				// pass empty string as value to search for, displaying all results
				input.autocomplete( "search", "" );
				input.focus();
			});
		}
	});
});