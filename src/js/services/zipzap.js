/**
 * ZIPZAP
 */

var module = angular.module('zipzap', []);

module.factory('rpZipzap', ['$rootScope', function($scope)
{
  var Zipzap = function ()
  {
    this.baseUrl = Options.zipzap.requester;
    this.params = {
      data: {}
    };
  };

  Zipzap.prototype.register = function (rpAddress,fields)
  {
    this.params.type = 'POST';
    this.params.URI = '/v1/accounts';

    this.params.data = {
      "MerchantCustomerID": rpAddress,
      "FirstName": fields.firstname,
      "LastName": fields.lastname,
      "Address": fields.address,
      "City": fields.city,
      "State": fields.state,
      "PostalCode": fields.zipcode,
      "CountryCode": fields.countrycode ? fields.countrycode.toUpperCase() : '',
      "Phone": fields.phone,
      "DateOfBirth": fields.dob,
      "Email": fields.email,
      "AcctType": "Multi",
      "ComplianceAnswers": [{
        "QuestionID": "1",
        "Answer": fields.ssn
      }]
    }
  };

  Zipzap.prototype.getAccount = function (rpAddress)
  {
    this.params.type = 'GET';
    this.params.URI = '/v1/accounts/MerchantCustomerID/' + rpAddress;
    this.params.rpAddress = rpAddress;
  };

  Zipzap.prototype.locate = function (query)
  {
    this.params.type = 'GET';
    this.params.URI = '/v1/PayCenters?q=' + encodeURIComponent(encodeURIComponent(query));
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
        data = data ? data : {};

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
