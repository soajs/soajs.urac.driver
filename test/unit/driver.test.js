"use strict";
var request = require("request");
var assert = require("assert");
var async = require("async");
var soajs = require("soajs");

var helper = require("../helper.js");

var holder = {
	service: null
};

var extKey = 'aa39b5490c4a4ed0e56d7ec1232a428f771e8bb83cfcee16de14f735d0f5da587d5968ec4f785e38570902fd24e0b522b46cb171872d1ea038e88328e7d973ff47d9392f72b2d49566209eb88eb60aed8534a965cf30072c39565bd8d72f68ac';

function executeMyRequest(params, apiPath, method, cb) {
	
	requester(apiPath, method, params, function (error, body) {
		assert.ifError(error);
		assert.ok(body);
		return cb(body);
	});
	
	function requester(apiName, method, params, cb) {
		
		var options = {
			uri: 'http://localhost:4000/myTest/' + apiName,
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
			assert.ok(body);
			return cb(null, body);
		});
	}
}

var lib = {
	
	startTestService: function (cb) {
		var config = {
			"session": true,
			"roaming": true,
			"awarenessEnv": true,
			"serviceVersion": 1,
			"requestTimeout": 2,
			"requestTimeoutRenewal": 2,
			"serviceName": "myTest",
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
		
		holder.service = new soajs.server.service(config);
		
		holder.service.init(function () {
			
			holder.service.post("/ldap/login", function (req, res) {
				var myDriver = helper.requireModule("./index");
				var data = {
					'username': req.soajs.inputmaskData['username'],
					'password': req.soajs.inputmaskData['password']
				};
				
				req.soajs.config = config;
				myDriver.ldapLogin(req.soajs, data, function (error, data) {
					return res.json(req.soajs.buildResponse(error, data));
				});
				
			});
			
			holder.service.post("/login", function (req, res) {
				var myDriver = helper.requireModule("./index");
				var data = {
					'username': req.soajs.inputmaskData['username'],
					'password': req.soajs.inputmaskData['password']
				};
				myDriver.login(req.soajs, data, function (err, record) {
					if (err) {
						req.soajs.log.error(err);
					}
					return res.json(req.soajs.buildResponse(null, record));
				});
				
			});
			
			holder.service.get("/getUser", function (req, res) {
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
			
			
			holder.service.get('/passport/login/:strategy', function (req, res) {
				req.soajs.config = config;
				var uracDriver = helper.requireModule("./index");
				uracDriver.passportLibInit(req, function (error, passport) {
					if (error) {
						console.log('errorrrrr');
						console.log(error);
						return res.json(req.soajs.buildResponse(error));
					}
					else {
						uracDriver.passportLibInitAuth(req, res, passport);
					}
				});
				
			});
			
			holder.service.get('/passport/validate/:strategy', function (req, res) {
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
			
			holder.service.start(cb);
		});
	},
	stopTestService: function (cb) {
		holder.service.stop(cb);
	}
};

describe("testing driver", function () {
	var auth;
	
	before(function (done) {
		lib.startTestService(function () {
			setTimeout(function () {
				var params = {
					"uri": "http://127.0.0.1:5000/reloadRegistry",
					"headers": {
						"content-type": "application/json"
					},
					"json": true
				};
				helper.requester("get", params, function (error, response) {
					assert.ifError(error);
					assert.ok(response);
					setTimeout(function () {
						done();
					}, 100);
				});
			}, 4000);
		});
		
	});
	
	describe("login user method", function () {
		it("login with username", function (done) {
			
			var params = {
				qs: {},
				form: {
					"username": "user1",
					"password": "123456"
				}
			};
			
			executeMyRequest(params, 'login', 'post', function (body) {
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
				console.log(body);
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
				console.log(body);
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
				assert.deepEqual(body.errors.details[0], {
					"code": 399,
					"message": "Missing Service config. Contact system Admin"
				});
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
		
		it("SUCCESS - will redirect user to twitter", function (done) {
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
		
		it("SUCCESS - will login user", function (done) {
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
		
		it("Fail - Missing param", function (done) {
			var params = {
				qs: {
					oauth_verifier: "CZ10nMKn8BSEYHpZZb8eQxUY3kuxGAR6"
				}
			};
			executeMyRequest(params, 'passport/validate/twitter', 'get', function (body) {
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