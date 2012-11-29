exports.removeClassPrefix = function (el, group)
{
  var $el = $(el);
  var classes = $el.attr("class");

  if (!classes || !classes.length) return;

  classes = classes.split(" ").map(function(item) {
    return item.indexOf(group) === 0 ? "" : item;
  });
  $el.attr("class", classes.join(" "));
};

/**
 * Error handler for jQuery.ajax requests.
 *
 * @example
 *   $.get('http://acme.com/')
 *    .success(...)
 *    .error(webutil.getAjaxErrorHandler(callback, "Acme GET"));
 */
exports.getAjaxErrorHandler = function (callback, context)
{
  return function (request, type, errorThrown)
  {
    var message = "Ajax Error";
    if (context) message += " ("+context+")";
    message += ":";
    switch (type) {
    case 'timeout':
      message += "The request timed out.";
      break;
    case 'notmodified':
      message += "The request was not modified but was not retrieved from the cache.";
      break;
    case 'parsererror':
      message += "XML/Json format is bad.";
      break;
    default:
      message += "HTTP Error (" + request.status + " " + request.statusText + ").";
    }
    callback(new Error(message));
  };
};

exports.scrollToTop = function ()
{
  $("html, body").animate({ scrollTop: 0 }, "fast");
};
