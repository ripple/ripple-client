
var Base58Utils = (function () {
  var alphabets = {
    'ripple':  "rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz",
    'bitcoin': "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  };
  
  var sha256  = function (bytes) {
    return sjcl.codec.bytes.fromBits(sjcl.hash.sha256.hash(sjcl.codec.bytes.toBits(bytes)));
  };
  
  var sha256hash = function (bytes) {
    return sha256(sha256(bytes));
  };
  
  var arraySet = function (count, value) {
    var a = new Array(count);
    var i;
    
    for (i = 0; i != count; i += 1)
      a[i] = value;
      
    return a;
  };
  
  return {
    // --> input: big-endian array of bytes. 
    // <-- string at least as long as input.
    encode_base: function (input, alphabetName) {
      var alphabet	= alphabets[alphabetName || 'ripple'];
      var bi_base	= new BigInteger(String(alphabet.length));
      var bi_q	= nbi();
      var bi_r	= nbi();
      var bi_value	= new BigInteger(input);
      var buffer	= [];
      
      while (bi_value.compareTo(BigInteger.ZERO) > 0)
      {
        bi_value.divRemTo(bi_base, bi_q, bi_r);
        bi_q.copyTo(bi_value);
        buffer.push(alphabet[bi_r.intValue()]);
      }
      
      for (var i = 0; i != input.length && !input[i]; i += 1) {
        buffer.push(alphabet[0]);
      }
      
      return buffer.reverse().join("");
    },
    
    // --> input: String
    // <-- array of bytes or undefined.
    decode_base: function (input, alphabetName) {
      var alphabet = alphabets[alphabetName || 'ripple'],
          bi_base = new BigInteger(String(alphabet.length)),
          bi_value = nbi();
      
      var i;
      while (i != input.length && input[i] === alphabet[0]) {
        i += 1;
      }
      
      for (i = 0; i != input.length; i += 1) {
        var v = alphabet.indexOf(input[i]);
        
        if (v < 0) {
          return undefined;
        }
        
        var r = nbi();
        r.fromInt(v); 
        bi_value = bi_value.multiply(bi_base).add(r);
      }
      
      // toByteArray:
      // - Returns leading zeros!
      // - Returns signed bytes!
      var bytes =  bi_value.toByteArray().map(function (b) {
        return b ? (b < 0 ? 256 + b : b) : 0;
      });
      
      var extra = 0;
      while (extra != bytes.length && !bytes[extra]) {
        extra += 1;
      }
      
      if (extra) {
        bytes = bytes.slice(extra);
      }
      
      var zeros = 0;
      while (zeros !== input.length && input[zeros] === alphabet[0]) {
        zeros += 1;
      }
      
      return [].concat(arraySet(zeros, 0), bytes);
    },
    
    // --> input: Array
    // <-- String
    encode_base_check: function (version, input, alphabet) {
      var buffer  = [].concat(version, input);
      var check   = sha256(sha256(buffer)).slice(0, 4);
      return Base58Utils.encode_base([].concat(buffer, check), alphabet);
    },
    
    // --> input : String
    // <-- NaN || BigInteger
    decode_base_check: function (version, input, alphabet) {
      var buffer = Base58Utils.decode_base(input, alphabet);
      
      if (!buffer || buffer[0] !== version || buffer.length < 5) {
        return NaN;
      }
      
      var computed = sha256hash(buffer.slice(0, -4)).slice(0, 4),
          checksum = buffer.slice(-4);
      
      var i;
      for (i = 0; i != 4; i += 1)
        if (computed[i] !== checksum[i])
          return NaN;
      
      return buffer.slice(1, -4);
    }
  }
})();

module.exports = Base58Utils;
