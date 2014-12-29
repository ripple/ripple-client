var Base58Utils = require('./base58');

var RippleAddress = (function () {
  function appendInt(a, i) {
    return [].concat(a, i >> 24, (i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff);
  }

  function firstHalfOfSHA512(bytes) {
    return sjcl.bitArray.bitSlice(
      sjcl.hash.sha512.hash(sjcl.codec.bytes.toBits(bytes)),
      0, 256
    );
  }

  function SHA256_RIPEMD160(bits) {
    return sjcl.hash.ripemd160.hash(sjcl.hash.sha256.hash(bits));
  }

  return function (seed) {
    this.seed = Base58Utils.decode_base_check(33, seed);

    if (!this.seed) {
      throw 'Invalid seed.';
    }

    this.getAddress = function (seq) {
      seq = seq || 0;

      var privateGen, publicGen, i = 0;
      do {
        privateGen = sjcl.bn.fromBits(firstHalfOfSHA512(appendInt(this.seed, i)));
        i++;
      } while (!sjcl.ecc.curves.c256.r.greaterEquals(privateGen));

      publicGen = sjcl.ecc.curves.c256.G.mult(privateGen);

      var sec;
      i = 0;
      do {
        sec = sjcl.bn.fromBits(firstHalfOfSHA512(appendInt(appendInt(publicGen.toBytesCompressed(), seq), i)));
        i++;
      } while (!sjcl.ecc.curves.c256.r.greaterEquals(sec));

      var pubKey = sjcl.ecc.curves.c256.G.mult(sec).toJac().add(publicGen).toAffine();

      return Base58Utils.encode_base_check(0, sjcl.codec.bytes.fromBits(SHA256_RIPEMD160(sjcl.codec.bytes.toBits(pubKey.toBytesCompressed()))));
    };
  };
})();

exports.RippleAddress = RippleAddress;

