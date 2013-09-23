/**
 * KEY DERIVATION FUNCTION
 *
 * This service takes care of the key derivation, i.e. converting low-entropy
 * secret into higher entropy secret via either computationally expensive
 * processes or peer-assisted key derivation (PAKDF).
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('kdf', []);

// Full domain hash based on SHA512
function fdh(data, bytelen)
{
  var bitlen = bytelen << 3;

  if (typeof data === "string") {
    data = sjcl.codec.utf8String.toBits(data);
  }

  // Add hashing rounds until we exceed desired length in bits
  var counter = 0, output = [];
  while (sjcl.bitArray.bitLength(output) < bitlen) {
    var hash = sjcl.hash.sha512.hash(sjcl.bitArray.concat([counter], data));
    output = sjcl.bitArray.concat(output, hash);
    counter++;
  }

  // Truncate to desired length
  output = sjcl.bitArray.clamp(output, bitlen);

  return output;
}

module.factory('rpKdf', [function ()
{
  var Kdf = {};

  Kdf.deriveRemotely = function (opts, username, purpose, secret, callback)
  {
    var iExponent = new sjcl.bn(String(opts.exponent)),
        iModulus = new sjcl.bn(String(opts.modulus)),
        iAlpha = new sjcl.bn(String(opts.alpha));

    var publicInfo = "PAKDF_1_0_0:"+opts.host.length+":"+opts.host+
          ":"+username.length+":"+username+":",
        publicSize = Math.ceil(Math.min((7+iModulus.bitLength()) >>> 3, 256)/8),
        publicHash = fdh(publicInfo, publicSize),
        publicHex  = sjcl.codec.hex.fromBits(publicHash),
        iPublic    = new sjcl.bn(String(publicHex)).setBitM(0),
        secretInfo = publicInfo+":"+secret.length+":"+secret+":",
        secretSize = (7+iModulus.bitLength()) >>> 3,
        secretHash = fdh(secretInfo, secretSize),
        secretHex  = sjcl.codec.hex.fromBits(secretHash),
        iSecret    = new sjcl.bn(String(secretHex)).mod(iModulus);

    if (iSecret.jacobi(iModulus) !== 1) {
      iSecret = iSecret.mul(iAlpha).mod(iModulus);
    }

    var iRandom;
    for (;;) {
      iRandom = sjcl.bn.random(iModulus, 0);
      if (iRandom.jacobi(iModulus) === 1)
        break;
    }

    var iBlind = iRandom.powermodMontgomery(iPublic.mul(iExponent), iModulus),
        iSignreq = iSecret.mulmod(iBlind, iModulus),
        signreq = sjcl.codec.hex.fromBits(iSignreq.toBits());

    $.ajax({
      type: "POST",
      url: opts.url,
      data: {
        info: publicInfo,
        signreq: signreq
      },
      dataType: "json",
      success: function (data) {
        if (data.result === "success") {
          var iSignres = new sjcl.bn(String(data.signres));
          var iRandomInv = iRandom.inverseMod(iModulus);
          var iSigned = iSignres.mulmod(iRandomInv, iModulus);

          callback(null, iSigned.toBits());
        } else {
          // XXX Handle error
        }
      },
      error: function () {
        callback(new Error("Could not query PAKDF server "+opts.host));
      }
    });
  };

  return Kdf;
}]);
