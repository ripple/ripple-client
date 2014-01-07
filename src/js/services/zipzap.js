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
    this.params.action = 'signup';
    this.params.type = 'POST';

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
        "QuestionID": "80a06fff-284d-e311-8fba-0653b901631c",
//        "QuestionID": "6f160854-8e48-e311-874f-1e35e7c25ebe",
        "Answer": fields.ssn
      }]
    }
  };

  Zipzap.prototype.locate = function (query)
  {
    this.params.action = 'locate';
    this.params.type = 'GET';
    this.params.q = encodeURIComponent(encodeURIComponent(query));
  };

  Zipzap.prototype.request = function (callback)
  {
    console.log('request called');

    var url = this.baseUrl + '?action=' + this.params.action;

    if (this.params.q) {
      url = url + '&q=' + this.params.q;
    }

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
