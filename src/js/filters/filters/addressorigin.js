var Base = ripple.Base;

angular
  .module('filters', [])
  .filter('rpaddressorigin', function() {
  return function(recipient) {
    if (~recipient.indexOf('@')) return 'federation';
    return !isNaN(Base.decode_check([0, 5], recipient, 'bitcoin')) ? 'bitcoin' : 'ripple';
  };
});
