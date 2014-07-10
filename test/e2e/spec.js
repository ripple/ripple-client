'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

describe('ripple client', function() {
  var ptor;

  beforeEach(function() {
    ptor = protractor.getInstance();
  });

  describe('bootstrap', function() {

    beforeEach(function() {
      ptor = protractor.getInstance();
      ptor.get('#');
    });

    it('should automatically redirect to /register when location hash/fragment is empty', function() {
      ptor.getCurrentUrl()
        .then(function(url) {
          expect(url).to.contain('/register');
        });
    });

  });

  describe('login', function() {

    beforeEach(function() {
      ptor.get('#/login');
    });

    it('should render login when user navigates to /login', function() {
      expect($("form[name='loginForm']")).to.exist;
    });

  });
});
