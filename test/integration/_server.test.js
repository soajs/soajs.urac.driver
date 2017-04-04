"use strict";
var shell = require('shelljs');
var assert = require('assert');

var sampleData = require("soajs.mongodb.data/modules/uracDriver");
var controller;

describe("importing sample data", function () {
	
	it("do import", function (done) {
		shell.pushd(sampleData.dir);
		shell.exec("chmod +x " + sampleData.shell, function (code) {
			assert.equal(code, 0);
			shell.exec(sampleData.shell, function (code) {
				assert.equal(code, 0);
				shell.popd();
				console.log('test data imported.');
				done();
			});
		});
	});
	
	after(function (done) {
		controller = require("soajs.controller");
		setTimeout(function () {
			require("./driver.test.js");
			done();
		}, 1000);
	});
});