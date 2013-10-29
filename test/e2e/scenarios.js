'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('ripple client', function() {

  beforeEach(function() {
    var base = window.__rp_client_base || '';
    browser().navigateTo(base + '/index_debug.html');
  });


  it('should automatically redirect to /balance when location hash/fragment is empty', function() {
    expect(browser().location().url()).toBe("/register");
  });

  describe('login', function() {

    beforeEach(function() {
      browser().navigateTo('#/login');
    });


    it('should render login when user navigates to /login', function() {
      expect(element('[ng-view] p:first').text()).
        toMatch(/Enter the Name and Passphrase used to encrypt your Wallet below/);
    });

  });


  describe('register', function() {

    beforeEach(function() {
      browser().navigateTo('#/register');
    });


    it('should render register when user navigates to /register', function() {
      expect(element('[ng-view] p:first').text()).
        toMatch(/Ripple is an open source p2p payment network./);
    });

  });
});
