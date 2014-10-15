/**
 * POPUP
 *
 * The popup service is used to provide modals, alerts, and confirmation screens
 */

var module = angular.module('popup', []);

module.factory('rpPopup', ['$compile',
                           function ($compile)
{
  var popupService = {};

  // Get the popup
  popupService.getPopup = function(create)
  {
    if (!popupService.popupElement && create)
    {
      popupService.popupElement = $( '<div class="modal fade"></div>' );
      popupService.popupElement.appendTo( 'BODY' );
    }

    return popupService.popupElement;
  };

  popupService.compileAndRunPopup = function (popup, scope, options) {
    $compile(popup)(scope);
    popup.modal(options);
  };

  popupService.blank = function(content,scope) {
    var popup = popupService.getPopup(true);

    var html = '<div class="modal-dialog"><div class="modal-content">';
    html += content;
    html += '</div></div>';

    popup.html(html);

    popupService.compileAndRunPopup(popup, scope);
  };

  popupService.confirm = function(title, actionText, actionButtonText, actionFunction, actionButtonCss, cancelButtonText, cancelFunction, cancelButtonCss, scope, options) {
    actionText = (actionText) ? actionText : "Are you sure?";
    actionButtonText = (actionButtonText) ? actionButtonText : "Ok";
    actionButtonCss = (actionButtonCss) ? actionButtonCss : "btn btn-info";
    cancelButtonText = (cancelButtonText) ? cancelButtonText : "Cancel";
    cancelButtonCss = (cancelButtonCss) ? cancelButtonCss : "";

    var popup = popupService.getPopup(true);
    var confirmHTML = '<div class="modal-dialog"><div class="modal-content">';

    if (title) {
      confirmHTML += "<div class=\"modal-header\"><h1>"+title+"</h1></div>";
    }

    confirmHTML += "<div class=\"modal-body\"><p class=\"question\">"+actionText+"</p>"
        +    "<div class=\"actions\">";

    if (actionFunction) {
      confirmHTML += "<button class=\"" + actionButtonCss + " \" ng-click=\""+actionFunction+"\">"+actionButtonText+"</button>";
    }
    else {
      confirmHTML += "<button class=\"" + actionButtonCss + " \">"+actionButtonText+"</button>";
    }

    if (cancelFunction) {
      confirmHTML += "<button class=\"" + cancelButtonCss + " btn-cancel\" ng-click=\""+cancelFunction+"\">"+cancelButtonText+"</button>";
    }
    else {
      confirmHTML += "<button class=\"" + cancelButtonCss + " btn-cancel\">"+cancelButtonText+"</button>";
    }

    confirmHTML += "</div></div></div></div>";

    popup.html(confirmHTML);

    popup.find(".btn").click(function () {
      popupService.close();
    });

    popupService.compileAndRunPopup(popup, scope, options);
  };

  popupService.close = function()
  {
    var popup = popupService.getPopup();
    if (popup) {
      popup.modal('hide');
    }
  };

  return popupService;
}]);
