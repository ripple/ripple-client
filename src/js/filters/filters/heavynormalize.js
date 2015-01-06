angular
  .module('filters', [])
  .filter('rpheavynormalize', function () {
  return function (value, maxLength) {
    return String(value)
      // Remove non-printable and non-ASCII characters
      .replace(/[^ -~]/g, '')
      // Enforce character limit
      .substr(0, maxLength || 160)
      // Remove leading whitespace
      .replace(/^\s+/g, '')
      // Remove trailing whitespace
      .replace(/\s+$/g, '')
      // Normalize all other whitespace
      .replace(/\s+/g, ' ');
  };
});
