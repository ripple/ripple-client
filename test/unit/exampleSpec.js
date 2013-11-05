'use strict';
var expect = chai.expect;

describe('Ridiculous Example Test', function(){
  var test;

  beforeEach(function(){
    test = true;
  });

  it('should be true', function() {
    expect(test).to.be.true;
  });
});
