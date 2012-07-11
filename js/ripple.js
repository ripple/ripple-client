
var ripple={};

ripple.onShowTab = function()
{
	rpc.ripple_lines_get(ncc.accountID,ripple.getLinesResponse);
}

ripple.getLinesResponse  = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		$('#status').text(JSON.stringify(response));
		if(response.result.lines)
		{
			$('#RippleTable').empty();
			for(var n=0; n<response.result.lines.length; n++)
			{
				var str=ripple.processLine(response.result.lines[n]);
				$('#RippleTable').prepend(str);
			}
			
		}
	}else ncc.serverDown();
}

ripple.addLine=function()
{
	
	account=$("#NewCreditAccount").val();
	currency=$("#NewCreditCurrencyInput").val().substring(0,3);
	max=$("#NewCreditMax").val();
	
	rpc.ripple_line_set(ncc.masterKey,ncc.accountID, account,max, currency,ripple.setLineResponse);
}

ripple.setLineResponse  = function(response,success)
{
	if(success)
	{
		ncc.checkError(response);
		
		$('#status').text(JSON.stringify(response));
		
	}else ncc.serverDown();
}

// {"account":"iDDXKdsoMvrJ2CUsbFbNdLFhR5nivaiNnE","balance":"0","currency":"BTC","limit":"200","limit_peer":"0","node":"E152C3D5AF05B220C71C51B3FFA0FB3F287CDBEBD3BCBC1C199E4E78C812DE49"},
// min amount | progress bar  | max amount | other account name |  change  | forgive
ripple.processLine=function(line)
{
	var str='<tr><td>'+(-line.limit_peer)+'</td><td>'+line.balance+' '+line.currency+'</td><td>'+line.limit+'</td><td>'+line.account+'</td><td></td><td></td></tr>';
	return(str);
}


										

$(document).ready(function(){
	
		$.widget( "ui.combobox", {
			_create: function() {
				var input,
					self = this,
					select = this.element.hide(),
					selected = select.children( ":selected" ),
					value = selected.val() ? selected.text() : "",
					wrapper = this.wrapper = $( "<span>" )
						.addClass( "ui-combobox" )
						.insertAfter( select );

				input = $( '<input id="NewCreditCurrencyInput" >' )
					.appendTo( wrapper )
					.val(value ) 
					.addClass( "ui-state-default " )  // ui-combobox-input
					.autocomplete({
						delay: 0,
						minLength: 0,
						source: function( request, response ) {
							var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
							response( select.children( "option" ).map(function() {
								var text = $( this ).text();
								if ( this.value && ( !request.term || matcher.test(text) ) )
									return {
										label: text.replace(
											new RegExp(
												"(?![^&;]+;)(?!<[^<>]*)(" +
												$.ui.autocomplete.escapeRegex(request.term) +
												")(?![^<>]*>)(?![^&;]+;)", "gi"
											), "<strong>$1</strong>" ),
										value: text, 
										option: this
									};
							}) );
						},
						select: function( event, ui ) {
							ui.item.option.selected = true;
							self._trigger( "selected", event, {
								item: ui.item.option
							});
						},
						change: function( event, ui ) {
							if ( !ui.item ) {
								var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
									valid = false;
								select.children( "option" ).each(function() {
									if ( $( this ).text().match( matcher ) ) {
										this.selected = valid = true;
										return false;
									}
								});
							}
						}
					})
					.addClass( " ui-widget-content ui-corner-left" ); //ui-widget

				input.data( "autocomplete" )._renderItem = function( ul, item ) {
					return $( "<li></li>" )
						.data( "item.autocomplete", item )
						.append( "<a>" + item.label + "</a>" )
						.appendTo( ul );
				};

				$( "<a>" )
					.attr( "tabIndex", -1 )
					.attr( "title", "Show All Items" )
					.appendTo( wrapper )
					.button({
						icons: {
							primary: "ui-icon-triangle-1-s"
						},
						text: false
					})
					.removeClass( "ui-corner-all" )
					.addClass( "ui-corner-right ui-combobox-toggle" )
					.click(function() {
						// close if already visible
						if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
							input.autocomplete( "close" );
							return;
						}

						// work around a bug (likely same cause as #5265)
						$( this ).blur();

						// pass empty string as value to search for, displaying all results
						input.autocomplete( "search", "" );
						input.focus();
					});
			},

			destroy: function() {
				this.wrapper.remove();
				this.element.show();
				$.Widget.prototype.destroy.call( this );
			}
		});
	

	
		$( "#NewCreditCurrency" ).combobox();
	});