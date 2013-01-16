var Base58Utils = require('./base58');

var RippleAddress = (function () {
  function append_int(a, i) {
    return [].concat(a, i >> 24, (i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff)
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
      throw "Invalid seed."
    }

    this.getAddress = function (seq) {
      seq = seq || 0;

      var private_gen, public_gen, i = 0;
      do {
        private_gen = sjcl.bn.fromBits(firstHalfOfSHA512(append_int(this.seed, i)));
        i++;
      } while (!sjcl.ecc.curves.c256.r.greaterEquals(private_gen));

      public_gen = sjcl.ecc.curves.c256.G.mult(private_gen);

      var sec;
      i = 0;
      do {
        sec = sjcl.bn.fromBits(firstHalfOfSHA512(append_int(append_int(public_gen.toBytesCompressed(), seq), i)));
        i++;
      } while (!sjcl.ecc.curves.c256.r.greaterEquals(sec));

      var pubKey = sjcl.ecc.curves.c256.G.mult(sec).toJac().add(public_gen).toAffine();

      return Base58Utils.encode_base_check(0, sjcl.codec.bytes.fromBits(SHA256_RIPEMD160(sjcl.codec.bytes.toBits(pubKey.toBytesCompressed()))));
    };
  };
})();

exports.RippleAddress = RippleAddress;

