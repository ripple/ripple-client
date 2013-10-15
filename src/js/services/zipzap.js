/**
 * ZIPZAP
 */

var module = angular.module('zipzap', []);

module.factory('rpZipzap', ['$rootScope', function($scope)
{
  var Zipzap = function ()
  {
    // zipzap.php is currently responsible for this
    /*
     var verb = 'GET';
     var URI = '/v1/PayCenters?q=Chicago';
     var accessID = '';
     var secret = '';

     // UTC date
     var d = new Date();
     var date = new Date(d.getTime() + (d.getTimezoneOffset() * 60000));

     // ISO 8601 Extended Format.
     // Because Date.toISOString() ignores timezone offset
     var padDigits = function padDigits(number, digits) {
     return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
     };
     var x_zipzap_date = date.getFullYear()
     + "-" + padDigits((date.getMonth()+1),2)
     + "-" + padDigits(date.getDate(),2)
     + "T"
     + padDigits(date.getHours(),2)
     + ":" + padDigits(date.getMinutes(),2)
     + ":" + padDigits(date.getSeconds(),2)
     + "Z";

     var stringToSign = verb + "\n" + x_zipzap_date + "\n" + URI;

     // TODO btoa will not work in IE
     var signature = btoa(
     sjcl.codec.hex.fromBits(
     new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(secret),sjcl.hash.sha1).encrypt(stringToSign)
     )
     );
     */

    this.baseUrl = 'zipzap.php';
    this.params = {};
  };

  Zipzap.prototype.paycenters = function ()
  {
    this.params.type = 'GET';
    this.params.URI = '/v1/PayCenters?q=Chicago';
  };

  Zipzap.prototype.register = function (rpAddress)
  {
    this.params.type = 'POST';
    this.params.URI = '/v1/accounts';
    this.params.rpAddress = rpAddress;

    this.params.data = {
      "MerchantCustomerID": "8SDF8d8gfs",
      "FirstName": "Sam",
      "LastName": "Doe",
      "Address": "123 Main St",
      "City": "San Francisco",
      "State": "CA",
      "PostalCode": "94111",
      "CountryCode": "US",
      "Phone": "+1.415.408.7500",
      "DateOfBirth": "1976-03-31",
      "Email": "sam@doe.com",
      "AcctType": "Multi"
    }
  };

  Zipzap.prototype.request = function (callback)
  {
    console.log('request called');

    var url = this.baseUrl + '?uri=' + this.params.URI + '&verb=' + this.params.type;

    if (this.params.rpAddress)
      url += "&rpAddress=" + this.params.rpAddress;

    $.ajax({
      'type': this.params.type,
      'url': url,
      'data': this.params.data,
      'dataType' : 'json',
      'success': function(data){
        if (data.aaa) {
          this.register();
          this.request(callback);
        }
        callback(data);
        console.log('request response',data);
      },
      'error': function(err){
        console.log('error',err);
      }
    });
  };

  return new Zipzap();
}]);