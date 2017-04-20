'use strict';
var assert = require('assert');
var helper = require('../../helper.js');
var utils = helper.requireModule('./lib/drivers/ypsso.js');

describe('testing ypsso driver', function () {
  it('test mapProfile', function (done) {
    var data = {
      attributes: [
        {name: 'sAMAccountName', values: ['test']},
        {name: 'mail', values: ['test@test.com']},
        {name: 'givenname', values: ['test']},
        {name: 'sn', values: ['test']}
      ]
    };
    utils.mapProfile(data, function (error, body) {
      assert.ifError(error);
      assert.ok(body);
      done();
    });
  });
});