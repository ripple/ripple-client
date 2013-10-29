# Introduction to ripple-l10n

Ripple uses a custom internationalization system based on the
[GNU gettext](http://en.wikipedia.org/wiki/Gettext) translation solution.

## Basic information

When translating strings you may encounter placeholders for external elements:

```
You will receive {{1}}.
```

These stand for data shown to the user, the example above might show up in the
client as: `You will receive 100 USD.`

Make sure you keep the tags, i.e. the `{{1}}` intact. These elements must never
be removed or added. However, in most cases it is safe to reorder the elements.
If it is not safe to reorder, the string will be marked with a developer comment
warning you that the order must be preserved.

## Subelements

Sometimes subelements contain text that is part of the overall sentence. This
will look like this:

```
You {{1:must}} agree to the terms before continuing.
```

This could be because "must" has special formatting or because it may be
replaced by other content in some circumstances. When you come across this,
please translate the text inside the brackets along with the rest of the
sentence, but be sure to keep the `{{1:` and `}}` intact.
