#
# This is the Guardfile for use with guard-livereload.
#
# Once the new official livereload-cli (Node.js-based) is out, we'll get rid of this.
#

guard 'livereload' do
  watch(%r{build/dist/ripple-client-desktop-debug.js})
  watch(%r{build/dist/deps-debug.js})
  watch(%r{build/.+\.css})
  watch(%r{config\.js})
  watch(%r{.+\.html})
end
