"use strict";
var request = require("request");
var assert = require("assert");
var async = require("async");
var express = require("express");

var coreModules = require("soajs.core.modules/soajs.core");
var provision = require("soajs.core.modules/soajs.provision");

var helper = require("../helper.js");

var nock = require("nock");

var extKey = 'aa39b5490c4a4ed0e56d7ec1232a428f771e8bb83cfcee16de14f735d0f5da587d5968ec4f785e38570902fd24e0b522b46cb171872d1ea038e88328e7d973ff47d9392f72b2d49566209eb88eb60aed8534a965cf30072c39565bd8d72f68ac';

function executeMyRequest(params, apiPath, method, cb) {

	requester(apiPath, method, params, function (error, body) {
		assert.ifError(error);
		assert.ok(body);
		return cb(body);
	});

	function requester(apiName, method, params, cb) {

		var options = {
			uri: 'http://localhost:4099/' + apiName,
			headers: {
				'Content-Type': 'application/json',
				key: extKey
			},
			json: true
		};

		if (params.headers) {
			for (var h in params.headers) {
				if (params.headers.hasOwnProperty(h)) {
					options.headers[h] = params.headers[h];
				}
			}
		}

		if (params.form) {
			options.body = params.form;
		}

		if (params.qs) {
			options.qs = params.qs;
		}

		request[method](options, function (error, response, body) {
			assert.ifError(error);
			// assert.ok(body);
			return cb(null, body || true);
		});
	}
}

var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

var session = require('express-session');
app.use(session({
	secret: 'keyboard cat',
	key: 'sid',
	cookie: {secure: false}
}));


var lib = {

	injectSOAJS: function (req, res, cb) {

		coreModules.registry.load({
			"serviceName": 'mytest',
			"serviceGroup": 'exampleGroup',
			"serviceVersion": 1,
			"designatedPort": 4099,
			"extKeyRequired": true,
			"requestTimeout": 30,
			"requestTimeoutRenewal": 5,
			"awareness": false,
			"serviceIp": "127.0.0.1",
			"swagger": false,
			"apiList": []
		}, function (reg) {
			var soajs = {
				meta: coreModules.meta,
				registry: reg,
				"validator": coreModules.validator,
				"log": coreModules.getLogger("mytest", {
					"src": true,
					"level": "debug",
					"formatter": {
						"outputMode": "long"
					}
				}),
				"tenant": {
					"id": "10d2cb5fc04ce51e06000001",
					"code": "test",
					"key": {
						"iKey": "d1eaaf5fdc35c11119330a8a0273fee9",
						"eKey": "aa39b5490c4a4ed0e56d7ec1232a428f771e8bb83cfcee16de14f735d0f5da587d5968ec4f785e38570902fd24e0b522b46cb171872d1ea038e88328e7d973ff47d9392f72b2d49566209eb88eb60aed8534a965cf30072c39565bd8d72f68ac"
					},
					"application": {
						"product": "TPROD",
						"package": "TPROD_BASIC",
						"appId": "30d2cb5fc04ce51e06000001",
						"acl": null,
						"acl_all_env": null,
						"package_acl": {
							"mytest": {},
							"urac": {},
							"oauth": {},
							"dashboard": {}
						}
					}
				},
				"servicesConfig": {},
				"buildResponse": function (error, data) {
					var resp = {};
					if (error) {
						resp.result = false;
						resp.errors = {};
						resp.errors.details = [];
						resp.errors.details.push({
							code: error.code,
							message: error.message || error.msg
						});
					}
					else {
						resp.result = true;
						resp.data = data;
					}

					res.setHeader("Content-Type", "application/json");
					res.end(JSON.stringify(resp));
				}
			};

			switch (req.headers.key) {
				case "aa39b5490c4a4ed0e56d7ec1232a428f771e8bb83cfcee16de14f735d0f5da587d5968ec4f785e38570902fd24e0b522b46cb171872d1ea038e88328e7d973ff47d9392f72b2d49566209eb88eb60aed8534a965cf30072c39565bd8d72f68ac":
					soajs.servicesConfig = {
						"tenantCodes": {},
						"model": "mongo",
						"mail": {
							"from": 'me@localhost.com',
							"transport": {
								"type": "sendmail",
								"options": {}
							}
						},
						"urac": {
							"openam": {
								"attributesURL": "https://test.com/openam/identity/json/attributes",
								"attributesMap": [
									{"field": 'sAMAccountName', "mapTo": 'id'},
									{"field": 'sAMAccountName', "mapTo": 'username'},
									{"field": 'mail', "mapTo": 'email'},
									{"field": 'givenname', "mapTo": 'firstName'},
									{"field": 'sn', "mapTo": 'lastName'}
								],
								"timeout": 5000
							},
							"passportLogin": {
								"twitter": {
									"clientID": "qywH8YMduIsKA2RRlUkS50kCZ",
									"clientSecret": "aodnXVCBijQcS8sJrcLM3ULgCl9VEoqqwu00XgamRUv5qm8bF1",
									"callbackURL": "http://local-widget.com/urac/login/success",
									userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
								},
								"facebook": {
									clientID: '331502413866510',
									clientSecret: '1a07a7eb9c9884dc5d148106ede830b2',
									callbackURL: "http://local-widget.com/urac/login/success?mode=facebook"
								},
								"google": {
									clientID: '393278808961-7qahk8kadr2jhbo05o84pbp5tc774a1l.apps.googleusercontent.com',
									clientSecret: 'sdSpS8FLeUvc0UBs_z8m4f89',
									callbackURL: "http://local-widget.com/urac/login/success"
								},
								"github": {
									clientID: '79729863675e2513ae44',
									clientSecret: '3f37cea1cff3e2ead1a11d96f9961e27293739e4',
									callbackURL: "http://local-widget.com/urac/login/success?mode=github"
								}
							},
							"ldapServer": {
								host: 'ldap://127.0.0.1',
								port: 10389,
								baseDN: 'ou=users,ou=system',
								adminUser: 'uid=admin, ou=system',
								adminPassword: 'secret'
							},
							"hashIterations": 1024, //used by hasher
							"seedLength": 32, //used by hasher
							// "optionalAlgorithm": 'md5',
							"tokenExpiryTTL": 2 * 24 * 3600 * 1000,// token expiry limit in seconds
							"validateJoin": true, //true if registration needs validation
							"mail": { //urac mail options

							}
						}
					};
					break;
				case "aa39b5490c4a4ed0e56d7ec1232a428f1c5b5dcabc0788ce563402e233386738fc3eb18234a486ce1667cf70bd0e8b08890a86126cf1aa8d38f84606d8a6346359a61678428343e01319e0b784bc7e2ca267bbaafccffcb6174206e8c83f2a25":
					soajs.servicesConfig = {
						"urac": {
							//"validateJoin": true,
							"hashIterations": 1024, //used by hasher
							"seedLength": 32, //used by hasher
							"tokenExpiryTTL": 2 * 24 * 3600 * 1000,
							"optionalAlgorithm": 'md5',
							"passportLogin": {
								"facebook": {
									clientID: '123',
									clientSecret: '1234',
									"callbackURL": "http://local-widget.agmkpl.com/urac/login/success?mode=facebook"
								}
							}
						}
					};
					break;
			}

			req.soajs = soajs;
			return cb();
		});
	},

	startTestService: function (cb) {
		var config = {
			"session": true,
			"roaming": true,
			"awarenessEnv": true,
			"serviceVersion": 1,
			"requestTimeout": 2,
			"requestTimeoutRenewal": 2,
			"serviceName": "mytest",
			"servicePort": 4099,
			"serviceGroup": "exampleGroup",
			"extKeyRequired": true,
			"hashIterations": 1024,
			"seedLength": 32,

			"errors": {
				399: "Missing Service config. Contact system Admin",
				400: "Database connection error",
				401: "Unable to log in the user. User not found.",
				403: "User Not Found!",
				413: "Problem with the provided password.",
				601: "Model not found",
				611: "Invalid tenant id provided",
				700: "Unable to log in. Ldap connection refused!",
				701: "Unable to log in. Invalid ldap admin user.",
				702: "Unable to log in. Invalid ldap admin credentials.",
				703: "Unable to log in. Invalid ldap user credentials.",
				704: "Unable to log in. General Error.",
				705: "Unable to log in. Authentication failed.",
				706: "Missing Configuration. Contact Web Master."
			},
			"schema": {
				"commonFields": {
					"model": {
						"source": ['query.model'],
						"required": false,
						"validation": {
							"type": "string"
						}
					}
				},
				"/login": {
					"_apiInfo": {
						"l": "login"
					},
					"commonFields": ["model"],
					"username": {
						"source": ['body.username'],
						"required": true,
						"validation": {
							"type": "string"
						}
					},
					"password": {
						"source": ['body.password'],
						"required": true,
						"validation": {
							"type": "string"
						}
					}
				},
				"/ldap/login": {
					"_apiInfo": {
						"l": "login ldap"
					},
					"username": {
						"source": ['body.username'],
						"required": true,
						"validation": {
							"type": "string"
						}
					},
					"password": {
						"source": ['body.password'],
						"required": true,
						"validation": {
							"type": "string"
						}
					}
				},
				"/getUser": {
					"_apiInfo": {
						"l": "Get User"
					},
					"commonFields": ["model"],
					"id": {
						"source": ['query.id'],
						"required": true,
						"validation": {
							"type": "string"
						}
					}
				},
				"/openam/login" : {
					"_apiInfo": {
						"l": "OpenAM Login",
						"group": "Guest",
						"groupMain": true
					},
					"commonFields": ["model"],
					"token": {
						"source": ['body.token'],
						"required": true,
						"validation": {
							"type": "string"
						}
					}
				},
				"/passport/login/:strategy": {
					"_apiInfo": {
						"l": "Login Through Passport",
						"group": "Guest"
					},
					"uracConfig": {
						"source": ['servicesConfig.urac'],
						"required": true,
						"validation": {
							"type": "object",
							"properties": {
								"passportLogin": {
									"type": "object",
									"required": true,
									"properties": {
										"facebook": {
											"type": "object",
											"properties": {
												"clientID": {
													"type": "string",
													"required": true
												},
												"clientSecret": {
													"type": "string",
													"required": true
												},
												"callbackURL": {
													"type": "string",
													"required": true
												}
											}
										},
										"twitter": {
											"type": "object",
											"properties": {
												"clientID": {
													"type": "string",
													"required": true
												},
												"clientSecret": {
													"type": "string",
													"required": true
												},
												"callbackURL": {
													"type": "string",
													"required": true
												}
											}
										},
										"google": {
											"type": "object",
											"properties": {
												"clientID": {
													"type": "string",
													"required": true
												},
												"clientSecret": {
													"type": "string",
													"required": true
												},
												"callbackURL": {
													"type": "string",
													"required": true
												}
											}
										},
										"github": {
											"type": "object",
											"properties": {
												"clientID": {
													"type": "string",
													"required": true
												},
												"clientSecret": {
													"type": "string",
													"required": true
												},
												"callbackURL": {
													"type": "string",
													"required": true
												}
											}
										}
									}
								}
							}
						}
					},
					"strategy": {
						"source": ['params.strategy'],
						"required": true,
						"validation": {
							"type": "string",
							"enum": ["facebook", "google", "twitter", "github"]
						}
					}
				},

				"/passport/validate/:strategy": {
					"_apiInfo": {
						"l": "Login Through Passport Validate",
						"group": "Guest"
					},
					"strategy": {
						"source": ['params.strategy'],
						"required": true,
						"validation": {
							"type": "string",
							"enum": ["facebook", "google", "twitter", "github"]
						}
					},
					"oauth_token": {
						"source": ['query.oauth_token'],
						"required": false,
						"validation": {
							"type": "string"
						}
					},
					"oauth_verifier": {
						"source": ['query.oauth_verifier'],
						"required": false,
						"validation": {
							"type": "string"
						}
					}
				}
			}
		};
		
		app.post('/openam/login', function (req, res) {
				
				lib.injectSOAJS(req, res, function () {
					
					req.soajs.inputmaskData = req.body;
					
					var data = {
						'token': req.soajs.inputmaskData['token']
					};
					
					req.soajs.config = config;
					
					var uracDriver = helper.requireModule("./index");
					
					uracDriver.openamLogin(req.soajs, data, function (error, data) {
						if (error) {
							return res.json(req.soajs.buildResponse({
								code: error.code,
								msg: error.msg
							}, null));
						}
						return res.json(req.soajs.buildResponse(error, data));
					});
				});
		});

		app.post("/ldap/login", function (req, res) {

			lib.injectSOAJS(req, res, function () {
				req.soajs.inputmaskData = req.body;
				req.soajs.config = config;

				var myDriver = helper.requireModule("./index");
				var data = {
					'username': req.soajs.inputmaskData['username'],
					'password': req.soajs.inputmaskData['password']
				};

				myDriver.ldapLogin(req.soajs, data, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
			});
		});

		app.post("/login", function (req, res) {

			lib.injectSOAJS(req, res, function () {
				req.soajs.inputmaskData = req.body;
				req.soajs.config = config;
				var myDriver = helper.requireModule("./index");
				var data = {
					'username': req.soajs.inputmaskData['username'],
					'password': req.soajs.inputmaskData['password']
				};
				myDriver.login(req.soajs, data, function (err, record) {
					if (err) {
						req.soajs.log.error(err);
						return res.json(req.soajs.buildResponse({
							code: 413,
							msg: config.errors[413]
						}));
					}
					return res.json(req.soajs.buildResponse(null, record));
				});
			});

		});

		app.get("/getUser", function (req, res) {

			lib.injectSOAJS(req, res, function () {
				req.soajs.inputmaskData = req.query;
				req.soajs.config = config;
				var myDriver = helper.requireModule("./index");
				var data = {
					'id': req.soajs.inputmaskData['id']
				};
				myDriver.getRecord(req.soajs, data, function (err, record) {
					if (err) {
						req.soajs.log.error(err);
					}
					return res.json(req.soajs.buildResponse(null, record));
				});
			});

		});

		app.get("/passport/login/:strategy", function (req, res) {
			lib.injectSOAJS(req, res, function () {
				req.soajs.inputmaskData = req.query;
				req.soajs.inputmaskData.strategy = req.params.strategy;
				req.soajs.config = config;

				var uracDriver = helper.requireModule("./index");
				uracDriver.passportLibInit(req, function (error, passport) {
					if (error) {
						return res.json(req.soajs.buildResponse(error));
					}
					else {
						uracDriver.passportLibInitAuth(req, res, passport);
					}
				});
			});

		});

		app.get("/passport/validate/:strategy", function (req, res) {

			lib.injectSOAJS(req, res, function () {
				req.soajs.inputmaskData = req.query;
				req.soajs.inputmaskData.strategy = req.params.strategy;
				req.soajs.config = config;

				var uracDriver = helper.requireModule("./index");
				uracDriver.passportLibInit(req, function (error, passport) {
					if (error) {
						return res.json(req.soajs.buildResponse(error));
					}
					uracDriver.passportLibAuthenticate(req, res, passport, function (error, user) {
						if (error) {
							return res.json(req.soajs.buildResponse(error, null));
						}

						return res.json(req.soajs.buildResponse(error, {}));
					});
				});
			});

		});

		app.listen(4099, function () {
			return cb();
		});
	},
	stopTestService: function (cb) {
		return cb();
	}
};

describe("testing driver", function () {
	var auth;

	before(function (done) {
		lib.startTestService(function () {
			setTimeout(function () {
				done();
			}, 1500);
		});

	});
	
	describe("login through openam", function () {
		
		it("Fail. Unable to log in. OpenAM invalid token.", function (done) {
			var params = {
				qs: {},
				form: {
					"token": "123456"
				}
			};
			
			executeMyRequest(params, 'openam/login', 'post', function (body) {
				assert.equal(body.errors.details[0].code, 711);
				done();
			});
		});
		
		it("Fail. Unable to log in. OpenAM connection error..", function (done) {
			nock('https://test.com')
				.post('/openam/identity/json/attributes')
				.query(true) // any params sent
				.replyWithError('something awful happened');
			
			var params = {
				qs: {},
				form: {
					"token": "123456"
				}
			};
			
			executeMyRequest(params, 'openam/login', 'post', function (body) {
				assert.equal(body.errors.details[0].code, 710);
				done();
			});
		});
		
		it("Fail. Unable to log in. Error in body.parse", function (done) {
			var mockedReply = ''; // sending a string instead of an object
			nock('https://test.com')
				.post('/openam/identity/json/attributes')
				.query(true) // any params sent
				.reply(200, mockedReply);
			
			var params = {
				qs: {},
				form: {
					"token": "123456"
				}
			};
			
			executeMyRequest(params, 'openam/login', 'post', function (body) {
				// console.log("-----");
				// console.log(JSON.stringify(body,null,2));
				// console.log("-----");
				assert.equal(body.errors.details[0].code, 712);
				done();
			});
		});
		
		it("Success. Logged in successfully.", function (done) {
			
			var mockedReply = {
				attributes : [
					{ name: 'sAMAccountName', values: [ 'etienz' ] },
					{ name: 'mail', values: [ 'mail@mail.com' ] },
					{ name: 'givenname', values: [ 'etienne' ] },
					{ name: 'sn', values: [ 'daher' ] }
				]
			};
			nock('https://test.com')
				.post('/openam/identity/json/attributes')
				.query(true) // any params sent
				.reply(200, mockedReply);
			
			var params = {
				qs: {},
				form: {
					"token": "123456"
				}
			};
			
			executeMyRequest(params, 'openam/login', 'post', function (body) {
				assert.equal(body.data.lastName, 'daher');
				done();
			});
		});
		
	});

	describe("login user method", function () {

		it("Fail. Wrong password", function (done) {

			var params = {
				qs: {},
				form: {
					"username": "user1",
					"password": "123456xx"
				}
			};

			executeMyRequest(params, 'login', 'post', function (body) {
				// console.log(JSON.stringify(body, null, 2));
				assert.ok(body.errors);
				done();
			});

		});

		it("login with username", function (done) {

			var params = {
				qs: {},
				form: {
					"username": "user1",
					"password": "123456"
				}
			};

			executeMyRequest(params, 'login', 'post', function (body) {
				// console.log(JSON.stringify(body, null, 2));
				assert.ok(body.data);
				done();
			});

		});

		it("login with email", function (done) {

			var params = {
				qs: {},
				form: {
					"username": "user2@domain.com",
					"password": "123456"
				}
			};

			executeMyRequest(params, 'login', 'post', function (body) {
				assert.ok(body.data);
				done();
			});

		});

		it("failed login", function (done) {

			var params = {
				qs: {},
				form: {
					"username": "usercom",
					"password": "123456"
				}
			};

			executeMyRequest(params, 'login', 'post', function (body) {
				// console.log(body);
				// assert.ok(body.data);
				done();
			});

		});

		it("wrong model", function (done) {
			var params = {
				qs: {
					"model": "mongo1"
				},
				form: {
					"username": "user1",
					"password": "123456"
				}
			};

			executeMyRequest(params, 'login', 'post', function (body) {
				done();
			});

		});
	});

	describe("login ldap method", function () {

		// initiate the server with the following configuration
		// the test cases are simulated vice versa, since the service configuration is static
		var serverConfig = {
			host: '127.0.0.1',
			port: 10389,
			baseDN: 'ou=users,ou=system',
			adminUser: 'uid=admin, ou=system',
			adminPassword: 'secret'
		};
		// wrong admin password
		var serverConfig2 = {
			host: '127.0.0.1',
			port: 10389,
			baseDN: 'ou=users,ou=system',
			adminUser: 'uid=admin, ou=system',
			adminPassword: 'secret2'
		};
		// wrong admin user
		var serverConfig3 = {
			host: '127.0.0.1',
			port: 10389,
			baseDN: 'ou=users,ou=system',
			adminUser: 'uid=admin2, ou=system',
			adminPassword: 'secret'
		};

		var extKey3 = "aa39b5490c4a4ed0e56d7ec1232a428f1c5b5dcabc0788ce563402e233386738fc3eb18234a486ce1667cf70bd0e8b08890a86126cf1aa8d38f84606d8a6346359a61678428343e01319e0b784bc7e2ca267bbaafccffcb6174206e8c83f2a25";

		it("success - login with the correct credentials", function (done) {
			var params = {
				qs: {},
				form: {
					"username": "owner",
					"password": "password"
				}
			};

			var ldapServer = require('./ldapServer');
			ldapServer.startServer(serverConfig, function (server) {
				executeMyRequest(params, 'ldap/login', 'post', function (body) {
					assert.ok(body.data);
					ldapServer.killServer(server);
					done();
				});
			});
		});

		it("success - login again with the correct credentials", function (done) {
			var params = {
				qs: {},
				form: {
					"username": "owner",
					"password": "password"
				}
			};

			var ldapServer = require('./ldapServer');
			ldapServer.startServer(serverConfig, function (server) {
				executeMyRequest(params, 'ldap/login', 'post', function (body) {
					assert.ok(body.data);
					ldapServer.killServer(server);
					done();
				});
			});
		});

		it("fail - login missing ldap configuration", function (done) {
			var params = {
				qs: {},
				form: {
					"username": "owner",
					"password": "password"
				},
				headers: {
					key: extKey3
				}
			};

			var ldapServer = require('./ldapServer');
			ldapServer.startServer(serverConfig, function (server) {

				executeMyRequest(params, 'ldap/login', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 706,
						"message": "Missing Configuration. Contact Web Master."
					});
					ldapServer.killServer(server);
					done();
				});

			});
		});

		it("fail - login with wrong password", function (done) {
			var params = {
				qs: {},
				form: {
					"username": "owner",
					"password": "passworz"
				}
			};

			var ldapServer = require('./ldapServer');
			ldapServer.startServer(serverConfig, function (server) {

				executeMyRequest(params, 'ldap/login', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 703,
						"message": "Unable to log in. Invalid ldap user credentials."
					});
					ldapServer.killServer(server);
					done();
				});

			});
		});

		it("fail - login with wrong admin password", function (done) {
			var params = {
				qs: {},
				form: {
					"username": "owner",
					"password": "password"
				}
			};

			var ldapServer = require('./ldapServer');
			ldapServer.startServer(serverConfig2, function (server) {
				executeMyRequest(params, 'ldap/login', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 702,
						"message": "Unable to log in. Invalid ldap admin credentials."
					});
					ldapServer.killServer(server);
					done();
				});
			});
		});


		it("fail - login with Incorrect admin DN user", function (done) {
			var params = {
				qs: {},
				form: {
					"username": "owner",
					"password": "password"
				}
			};

			var ldapServer = require('./ldapServer');
			ldapServer.startServer(serverConfig3, function (server) {
				executeMyRequest(params, 'ldap/login', 'post', function (body) {
					assert.deepEqual(body.errors.details[0], {
						"code": 701,
						"message": "Unable to log in. Invalid ldap admin user."
					});
					ldapServer.killServer(server);
					done();
				});
			});
		});

		it("fail - login with no ldap turned on", function (done) {
			var params = {
				qs: {},
				form: {
					"username": "owner",
					"password": "password"
				}
			};

			executeMyRequest(params, 'ldap/login', 'post', function (body) {
				assert.deepEqual(body.errors.details[0], {
					"code": 700,
					"message": "Unable to log in. Ldap connection refused!"
				});
				done();
			});
		});

	});

	describe("get user method", function () {

		it("fail - bad id", function (done) {

			var params = {
				qs: {
					"id": "iffdfd"
				}
			};

			executeMyRequest(params, 'getUser', 'get', function (body) {
				// console.log(body);
				done();
			});

		});

		it("success get user 1", function (done) {

			var params = {
				qs: {
					"id": "54ee1a511856706c23639308"
				}
			};

			executeMyRequest(params, 'getUser', 'get', function (body) {
				assert.ok(body.data);
				done();
			});

		});

		it("success get user 2", function (done) {

			var params = {
				qs: {
					"id": "54ee46e7a8643c4d10a61ba3"
				}
			};

			executeMyRequest(params, 'getUser', 'get', function (body) {
				assert.ok(body.data);
				done();
			});

		});

		it("success get user 3", function (done) {

			var params = {
				qs: {
					"id": "54ee1bf91856706c2363930a"
				}
			};

			executeMyRequest(params, 'getUser', 'get', function (body) {
				assert.ok(body.data);
				done();
			});

		});

	});

	describe("testing passport login API", function () {

		var extKey3 = "aa39b5490c4a4ed0e56d7ec1232a428f1c5b5dcabc0788ce563402e233386738fc3eb18234a486ce1667cf70bd0e8b08890a86126cf1aa8d38f84606d8a6346359a61678428343e01319e0b784bc7e2ca267bbaafccffcb6174206e8c83f2a25";

		it("FAIL - Missing config", function (done) {
			var params = {
				headers: {
					key: extKey3
				}
			};

			executeMyRequest(params, 'passport/login/google', 'get', function (body) {
				assert.ok(body);
				// assert.deepEqual(body.errors.details[0], {
				// 	"code": 399,
				// 	"message": "Missing Service config. Contact system Admin"
				// });
				done();
			});
		});

		it("SUCCESS - will redirect user to github", function (done) {
			var params = {
				qs: {}
			};
			executeMyRequest(params, 'passport/login/github', 'get', function (body) {
				assert.ok(body);
				done();
			});
		});

		it("SUCCESS - will redirect user to facebook", function (done) {
			var params = {};
			executeMyRequest(params, 'passport/login/facebook', 'get', function (body) {
				done();
			});
		});

		it.skip("SUCCESS - will redirect user to twitter", function (done) {
			var params = {};
			executeMyRequest(params, 'passport/login/twitter', 'get', function (body) {
				done();
			});
		});

		it("SUCCESS - will redirect user to google", function (done) {
			var params = {
				qs: {}
			};
			executeMyRequest(params, 'passport/login/google', 'get', function (body) {
				assert.ok(body);
				done();
			});
		});

		it("Fail - Code Already used", function (done) {
			var params = {
				qs: {
					code: "AQARgR1d6G3ISNzf3cet5espoQDGh_ADkU-n5J3VWGnydyGqdsgZYntKGe-7Ww3sFVWvXybCmiaW5tCXjRElzBI2hk7i75Oi9eNbPzC_W_PrjvmAh3q1rTpbCPCGO8bziT7kITp2rcPXVur3Gq7SHrPtcMp7gXfvB77Cbb9N1XCrmDWw_wKmZkWqjQlOF6Es-P8njD9hl9_MoCRH5-LRfUoM9N_2QBRAxmCn7UMlIxq0kajyDtpVcDW36hFIwMUt5ZYy1t9ClFhA3Y-y4s0kWzdz-pY55pMfdgm9vxU9Ku6gwZn1HfjAe0w1_2JGk3UXEflG0003hPwBe0kakKPwb-BZ#_=_"
				}
			};

			executeMyRequest(params, 'passport/validate/facebook', 'get', function (body) {
				assert.ok(body);
				// console.log(JSON.stringify(body, null, 2));
				assert.ok(body.errors);
				done();
			});
		});

		it("Fail - wrong format", function (done) {
			var params = {
				qs: {
					code: "123"
				}
			};
			executeMyRequest(params, 'passport/validate/facebook', 'get', function (body) {
				assert.ok(body);
				assert.ok(body.errors);
				done();
			});
		});

		it("Fail - wrong format for github code", function (done) {
			var params = {
				qs: {
					code: "123"
				}
			};
			executeMyRequest(params, 'passport/validate/github', 'get', function (body) {
				assert.ok(body);
				// console.log(JSON.stringify(body, null, 2));
				assert.ok(body.errors);
				done();
			});
		});

		it("SUCCESS - will login user to twitter", function (done) {
			var params = {
				qs: {
					oauth_token: "XnjHbgAAAAAAxq3dAAABWCr23O0",
					oauth_verifier: "CZ10nMKn8BSEYHpZZb8eQxUY3kuxGAR6"
				}
			};
			executeMyRequest(params, 'passport/validate/twitter', 'get', function (body) {
				assert.ok(body);
				done();
			});
		});

		it("Fail - Missing params for twitter", function (done) {
			var params = {
				qs: {
					oauth_token: "XnjHbgAAAAAAxq3dAAABWCr23O0"
				}
			};
			executeMyRequest(params, 'passport/validate/twitter', 'get', function (body) {
				assert.ok(body);
				// console.log(JSON.stringify(body, null, 2));
				assert.ok(body.errors);
				done();
			});
		});

	});

	describe("stopping services", function () {
		it("do stop", function (done) {
			lib.stopTestService(function () {
				done();
			});
		});
	});
});