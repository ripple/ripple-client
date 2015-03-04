
/**
 * Check if userblob is actual blob class, not just empty dummy object
 *
 * @param userBlob
 */
exports.blobIsValid = function(userBlob) {
  return userBlob instanceof rippleVaultClient.Blob;
}

/**
 * Check if there is such setting in user blob
 * use like hasSetting($scope.userBlob, 'trust.advancedMode')
 *
 * @param userBlob
 * @param settingName
 */
exports.hasSetting = function(userBlob, settingName) {
  if (!userBlob || !userBlob.data || typeof settingName !== 'string') return false;
  var d = userBlob.data;
  if (d.clients && d.clients.rippletradecom) {
    var parts = settingName.split('.');
    var o = d.clients.rippletradecom;
    while (parts.length) {
      var part = parts.shift();
      if (_.has(o, part)) {
        o = o[part];
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
};

/**
 * Check if there is such setting in user blob
 * use like var s = getSetting($scope.userBlob, 'trust.advancedMode', false);
 *
 * @param userBlob
 * @param settingName
 * @param def Default value. Optional.
 */
exports.getSetting = function(userBlob, settingName, def) {
  if (!userBlob || !userBlob.data || typeof settingName !== 'string') return def;
  var d = userBlob.data;
  if (d.clients && d.clients.rippletradecom) {
    var parts = settingName.split('.');
    var o = d.clients.rippletradecom;
    while (parts.length) {
      var part = parts.shift();
      if (_.has(o, part)) {
        o = o[part];
      } else {
        return def;
      }
    }
    return o;
  }
  return def;
};
