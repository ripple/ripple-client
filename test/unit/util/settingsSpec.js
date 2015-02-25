'use strict';

var expect = chai.expect;

describe('settings utils', function() {

  it('should check invalid', function(done) {
    expect(rippleclient.settingsUtils.blobIsValid({})).to.be.false;
    done();
  });

  it('should be false', function(done) {
    expect(rippleclient.settingsUtils.hasSetting()).to.be.false;
    done();
  });

  it('should be false 2', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({}, 's')).to.be.false;
    done();
  });

  it('should be false 3', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : {} }, 's')).to.be.false;
    done();
  });

  it('should be false 4', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : { clients : {} } }, 's')).to.be.false;
    done();
  });

  it('should be false 4', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : { clients : false } }, 's')).to.be.false;
    done();
  });

  it('should be false 5', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : { clients : { rippletradecom : {} } } }, 's')).to.be.false;
    done();
  });

  it('should be false 6', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : { clients : { rippletradecom : { s: { } } } } }, 's.x')).to.be.false;
    done();
  });

  it('should be true', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : { clients : { rippletradecom : { s: false } } } }, 's')).to.be.true;
    done();
  });

  it('should be true 2', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : { clients : { rippletradecom : { s: { x : 'f' } } } } }, 's.x')).to.be.true;
    done();
  });

  it('should be true 3', function(done) {
    expect(rippleclient.settingsUtils.hasSetting({ data : { clients : { rippletradecom : { s: { x : undefined } } } } }, 's.x')).to.be.true;
    done();
  });

  it('should get settings', function(done) {
    expect(rippleclient.settingsUtils.getSetting({ data : { clients : { rippletradecom : { s: 'got it' } } } }, 's')).to.equal('got it');
    done();
  });

  it('should get settings 2', function(done) {
    expect(rippleclient.settingsUtils.getSetting({ data : { clients : { rippletradecom : { s: { x : 'got it'} } } } }, 's.x')).to.equal('got it');
    done();
  });

  it('should get settings 3', function(done) {
    expect(rippleclient.settingsUtils.getSetting({ data : { clients : { rippletradecom : { s: { x : 'got it'} } } } }, 's.x', 'it is default')).to.equal('got it');
    done();
  });

  it('should get settings 4', function(done) {
    expect(rippleclient.settingsUtils.getSetting({ data : { clients : { rippletradecom : { s: { y : 'got it'} } } } }, 's.x', 'it is default')).to.equal('it is default');
    done();
  });
});
