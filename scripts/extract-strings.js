var jade = require('jade');
var jsdom = require('jsdom');


try {
  var filename = process.argv[2];
  var html = jade.renderFile(filename);
} catch (e) {
  console.error(e.name);
  console.log("Usage: node scripts/extract-strings.js path/to/template.jade");
  process.exit(1);
}

jsdom.env({
  html: html,
  scripts: [
    'http://code.jquery.com/jquery-2.0.3.min.js'
  ],
  done: function (err, window) {
    if (err) {
      console.error(err);
      return;
    }
    var $ = window.jQuery;
    $('[rp-l10n]').each(function (i, tag) {
      tag = $(tag);
      console.log('msgid "' + tag.attr('rp-l10n') + '"');
      console.log('msgstr "' + tag.text() + '"');
    });
}});
