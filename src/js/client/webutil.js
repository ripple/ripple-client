exports.removeClassPrefix = function (el, group)
{
  var $el = $(el);
  var classes = $el.attr("class").split(" ").map(function(item) {
    return item.indexOf(group) === 0 ? "" : item;
  });
  $el.attr("class", classes.join(" "));
}
