/**
 * AUTH INFO
 *
 * The auth info service is responsible for downloading the authentication
 * metadata.
 *
 * The authentication metadata contains information about the authentication
 * procedure the user needs to go through in order to decrypt their blob
 * successfully.
 */

var webutil = require("../util/web"),
    log = require("../util/log");

var module = angular.module('authinfo', []);

module.factory('rpAuthInfo', ['$rootScope', 'rpRippleTxt', function ($scope, $txt)
{
  var AuthInfo = {};

  AuthInfo.get = function (username, callback) {
    // XXX Request ripple.txt, then look for authinfo_url and query that service
    //     that for authinfo
    setImmediate(function () {
      // XXX This should not be hardcoded obviously
      callback(null, {
        version: 3,
        pakdf: {
          host: "auth1.ripple.com",
          url: "https://auth1.ripple.com/api/sign",
          exponent: "010001",
          modulus: "a5091daa41997943e3c98469e93377f668d05d8059bc53f72aaacdac3729a3070dc7439a5171160bf9ec2826b7191b03b0e84b28e14dd376de35d29a96f686666e053ab62a41ebc2b5f52e8cf06254100fd153a1cda4485f170c39c54689e52d",
          alpha: "70d49a95c6e599d9a1639d1606a9a9b044afae7946607a24d5a31681b47f9a3ee853893b50a18f5726a1d6cddd385a24ab8c89ac53ed4c77e16735fac22c73ffe3515b0e9a8f61a4cfa6d3a4c47419f5f624a834ad9549fb6c0a51076203555e"
        }
/*        pakdf: {
          host: "auth1.ripple.com",
          url: "https://auth1.ripple.com/api/sign",
          exponent: "010001",
          modulus: "c7f1bc1dfb1be82d244aef01228c1409c198894eca9e21430f1669b4aa3864c9f37f3d51b2b4ba1ab9e80f59d267fda1521e88b05117993175e004543c6e3611242f24432ce8efa3b81f0ff660b4f91c5d52f2511a6f38181a7bf9abeef72db056508bbb4eeb5f65f161dd2d5b439655d2ae7081fcc62fdcb281520911d96700c85cdaf12e7d1f15b55ade867240722425198d4ce39019550c4c8a921fc231d3e94297688c2d77cd68ee8fdeda38b7f9a274701fef23b4eaa6c1a9c15b2d77f37634930386fc20ec291be95aed9956801e1c76601b09c413ad915ff03bfdc0b6b233686ae59e8caf11750b509ab4e57ee09202239baee3d6e392d1640185e1cd",
          alpha: "7283d19e784f48a96062271a4fa6e2c3addf14e6edf78a4bb61364856d580f13552008d7b9e3b60ebd9555e9f6c7778ec69f976757d206134e54d61ba9d588a7e37a77cf48060522478352d76db000366ef669a1b1ca93c5e3e05bc344afa1e8ccb15d3343da94180dccf590c2c32408c3f3f176c8885e95d988f1565ee9b80c12f72503ab49917792f907bbb9037487b0afed967fefc9ab090164597fcd391c43fab33029b38e66ff4af96cbf6d90a01b891f856ddd3d94e9c9b307fe01e1353a8c30edd5a94a0ebba5fe7161569000ad3b0d3568872d52b6fbdfce987a687e4b346ea702e8986b03b6b1b85536c813e46052a31ed64ec490d3ba38029544aa"
        }*/
      });
    });
  };

  return AuthInfo;
}]);
