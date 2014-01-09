// returns the raw address after removing any parameters 
exports.stripRippleAddress = function (addr)
{
  if(typeof(addr)=='string')
  {
    var index=addr.indexOf("?");
    if(index>=0)
    {
      return(addr.slice(0,index));
    }
  }
  return(addr);
}
//returns the destination tag of an address if there is one 
exports.getDestTagFromAddress = function (addr)
{
  var index=addr.indexOf("?");
  if(index>=0)
  {
    addr=addr.slice(index,addr.length);
    index=addr.indexOf("dt=");
    if(index>=0)
    {
      addr=addr.slice(index+3,addr.length);
      index=addr.indexOf("&");
      if(index>0) return( addr.slice(0,index) );
      else return(addr);
    }
    index=addr.indexOf("d=");
    if(index>=0)
    {
      addr=addr.slice(index+2,addr.length);
      index=addr.indexOf("&");
      if(index>0) return( addr.slice(0,index) );
      else return(addr);
    }
  }
  return(undefined);
}

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
    switch (type) {
      case 'timeout':
        message = "The request timed out.";
        break;
      case 'notmodified':
        message = "The request was not modified but was not retrieved from the cache.";
        break;
      case 'parsererror':
        message = "XML/Json format is bad.";
        break;
      default:
        message = "HTTP Error (" + request.status + " " + request.statusText + ").";
    }
    callback(new Error(message));
  };
};

exports.scrollToTop = function ()
{
  $("html, body").animate({ scrollTop: 0 }, "fast");
};

exports.findIssuer= function(lines, currency)
{
  var maxIssuer=null;
  var maxLimit=0;

  for (var n in lines) {
    if (lines.hasOwnProperty(n)) {
      if (lines[n].currency === currency) {
        var limit = +lines[n].limit.to_text();
        if (limit > maxLimit) {
          maxLimit = limit;
          maxIssuer = lines[n].account;
        }
      }
    }
  }
  return maxIssuer;
}

exports.getContact = function (contacts,value)
{
  for (var i=0;i<contacts.length;i++) {
    if (contacts[i].name === value || contacts[i].address === value) {
      return contacts[i];
    }
  }

  return false;
};

/**
 * Given an address, return the contact name.
 */
exports.isContact = function (contacts, address) {
  try {
    for (var i = 0, l = contacts.length; i < l; i++) {
      if (contacts[i].address === address) {
        return contacts[i].name;
      }
    }
  } catch (e) {}
};

/**
 * Return the address of a contact.
 *
 * Pass in an address or a contact name and get an address back.
 */
exports.resolveContact = function (contacts, value)
{
  for (var i = 0, l = contacts.length; i < l; i++) {
    if (contacts[i].name === value) {
      return contacts[i].address;
    }
  }

  if (ripple.UInt160.is_valid(value)) {
    return ripple.UInt160.json_rewrite(value);
  }

  return '';
};

/**
 * Given an address, return the contact name.
 *
 * If a contact is not found with the given address, simply return the address
 * again.
 */
exports.unresolveContact = function (contacts, address)
{
  var contact;
  return (contact = exports.isContact(contacts, address)) ? contact : address;
};

/**
 * Creates a combobox query function out of a select options array.
 *
 * @param options {array} An array of select options like {name: '', value: ''}.
 */
exports.queryFromOptions = function (options)
{
  var opts = _.map(options, function (entry) {
    if ("string" === typeof entry) {
      return entry;
    } else if ("object" === typeof entry) {
      return entry.name;
    } else {
      return null;
    }
  });
  return exports.queryFromArray(opts);
};

/**
 * Creates a combobox query function out of a plain array of strings.
 *
 * @param options {array} An array of options, e.g. ['First choice', '2nd']
 */
exports.queryFromArray = function (options)
{
  return function (match, re) {
    if (re instanceof RegExp) {
      return options.filter(function (name) {
        return "string" === typeof name
          ? name.match(re)
          : false;
      });
    } else return options;
  };
};

/**
 * Escapes a string for use as a literal inside of a regular expression.
 *
 * From: http://stackoverflow.com/questions/3446170
 */
exports.escapeRegExp = function (str)
{
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};
