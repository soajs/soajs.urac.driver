'use strict';
var assert = require('assert');
var helper = require('../../helper.js');
var utils = helper.requireModule('./lib/drivers/openam.js');

describe('testing openam driver', function () {
  it('test mapProfile', function (done) {
    var data = {
      userRecord: {
        attributes: [
          { name: 'sAMAccountName', values: [ 'test' ] },
          { name: 'mail', values: [ 'test@test.com' ] },
          { name: 'givenname', values: [ 'test' ] },
          { name: 'sn', values: [ 'test' ] }
        ]
      },
      attributesMap: [
        { field: 'sAMAccountName', mapTo: 'id' },
        { field: 'sAMAccountName', mapTo: 'username' },
        { field: 'mail', mapTo: 'email' },
        { field: 'givenname', mapTo: 'firstName' },
        { field: 'sn', mapTo: 'lastName' }
      ]
    };
    utils.mapProfile(data, function (error, body) {
      assert.ifError(error);
      assert.ok(body);
      done();
    });
  });
	
	it('test mapProfile, setting one the user record attributes to null', function (done) {
		var data = {
			userRecord: {
				attributes: [
					{ name: 'sAMAccountName', values: [] }
				]
			},
			attributesMap: [
				{ field: 'sAMAccountName', mapTo: 'id' }
			]
		};
		utils.mapProfile(data, function (error, body) {
			assert.ifError(error);
			assert.ok(body);
			done();
		});
	});
});