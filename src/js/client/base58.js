
var Base58Utils = (function () {
  var alphabets = {
    'ripple':  "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz",
    'bitcoin': "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  };

  var SHA256  = function (bytes) {
    return sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(bytes)));
  };

  return {
    // --> input: big-endian array of bytes.
    // <-- string at least as long as input.
    encode_base: function (input, alphabetName) {
      var alphabet = alphabets[alphabetName || 'ripple'],
          base     = new sjcl.bn(alphabet.length),
          bi       = sjcl.bn.fromBits(sjcl.codec.bytes.toBits(input)),
          buffer   = [];

      while (bi.greaterEquals(base)) {
        var mod = bi.mod(base);
        buffer.push(alphabet[mod.limbs[0]]);
        bi = bi.div(base);
      }
      buffer.push(alphabet[bi.limbs[0]]);

      // Convert leading zeros too.
      for (var i = 0; i != input.length && !input[i]; i += 1) {
        buffer.push(alphabet[0]);
      }

      return buffer.reverse().join("");
    },

    // --> input: String
    // <-- array of bytes or undefined.
    decode_base: function (input, alphabetName) {
      var alphabet = alphabets[alphabetName || 'ripple'],
          base     = new sjcl.bn(alphabet.length),
          bi       = new sjcl.bn(0);

      var i;
      while (i != input.length && input[i] === alphabet[0]) {
        i += 1;
      }

      for (i = 0; i != input.length; i += 1) {
        var v = alphabet.indexOf(input[i]);

        if (v < 0) {
          return null;
        }

        bi = bi.mul(base).addM(v);
      }

      var bytes = sjcl.codec.bytes.fromBits(bi.toBits()).reverse();

      // Remove leading zeros
      while(bytes[bytes.length-1] === 0) {
        bytes.pop();
      }

      // Add the right number of leading zeros
      for (i = 0; input[i] === alphabet[0]; i++) {
        bytes.push(0);
      }

      bytes.reverse();

      return bytes;
    },

    // --> input: Array
    // <-- String
    encode_base_check: function (version, input, alphabet) {
      var buffer  = [].concat(version, input);
      var check   = SHA256(SHA256(buffer)).slice(0, 4);
      return Base58Utils.encode_base([].concat(buffer, check), alphabet);
    },

    // --> input : String
    // <-- NaN || BigInteger
    decode_base_check: function (version, input, alphabet) {
      var buffer = Base58Utils.decode_base(input, alphabet);

      if (!buffer || buffer[0] !== version || buffer.length < 5) {
        return NaN;
      }

      var computed = SHA256(SHA256(buffer.slice(0, -4))).slice(0, 4),
          checksum = buffer.slice(-4);

      var i;
      for (i = 0; i != 4; i += 1)
        if (computed[i] !== checksum[i])
          return NaN;

      return buffer.slice(1, -4);
    }
  };
})();

module.exports = Base58Utils;
