# Basic use

To make a string in one of the Jade templates translatable, simply add the `l10n` attribute:

  p(l10n) I can be translated!

# Ambiguous strings

Sometimes the same string translates in two different ways depending on the context.

  button(l10n) Clear
  select
    option(l10n) Clear
    option(l10n) Opaque

You can deal with this by explicitly assigning a unique ID to one or both of the conflicting instances, like so:

  button(l10n) Clear
  select
    option(l10n="Clear (transparent)") Clear
    option(l10n) Opaque

# Dealing with subtags

Often when translating Jade templates you will run into situations where text is splintered across subtags, like so:

  p(l10n)
    | Send money to
    strong(ng-bind="otherGuy") ???

The parser we use will turn this into:

  msgid "Send money to {{1}}"

This makes it easy for the translators to move the element to a different position in the text if needed.

However, sometimes the subtag itself contains text that is important for comprehension:

  p(l10n)
    | This is a
    strong(l10n) great
    | example.

Would become:

  msgid "This is a {{1}} example."

  # ...

  msgid "great"

Here the context for the inner text snippet is lost. In a case like this we recommend using `l10n-inc` to mark the subtag for inclusion in the parent's translation:

  p(l10n)
    | This is a
    strong(l10n-inc) great
    | example.

Will become:

  msgid "This is a {{1:great}} example."

The translator can then translate and move the tag as needed:

  msgid "This is a {{1:great}} example."
  msgstr "Dies ist ein {{1:geniales}} Beispiel."

