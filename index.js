"use strict";
var driverConfig = require('./config.js');
var fs = require("fs");
var merge = require('merge');

var passportLib = require('./lib/passport.js');

var userCollectionName = "users";
var groupsCollectionName = "groups";

var ActiveDirectory = require('activedirectory');

var model = null;
var driver;

function initBLModel(soajs, cb) {
	var modelName = driverConfig.model;
	if (soajs.servicesConfig && soajs.servicesConfig.model) {
		modelName = soajs.servicesConfig.model
	}
	if (process.env.SOAJS_TEST && soajs.inputmaskData.model) {
		modelName = soajs.inputmaskData.model;
	}
	
	var modelPath = __dirname + "/model/" + modelName + ".js";
	return requireModel(modelPath, cb);
	
	/**
	 * checks if model file exists, requires it and returns it.
	 * @param filePath
	 * @param cb
	 */
	function requireModel(filePath, cb) {
		//check if file exist. if not return error
		fs.exists(filePath, function (exists) {
			if (!exists) {
				soajs.log.error('Requested Model Not Found!');
				return cb(601);
			}
			
			driver.model = require(filePath);
			return cb();
		});
	}
	
}

var utilities = {
	"findRecord": function (soajs, condition, mainCb, callbck) {
		soajs.log.debug(condition);
		var combo = {
			collection: userCollectionName,
			condition: condition
		};
		driver.model.findEntry(soajs, combo, function (err, record) {
			if (err) {
				soajs.log.error(err);
			}
			if (record) {
				soajs.log.debug('==== record ===');
				soajs.log.debug(record);
				return callbck(record);
			}
			else {
				soajs.log.error('User not Found');
				return mainCb(401);
			}
		});
	},
	"findGroups": function (soajs, record, callbck) {
		//Get Groups config
		var grpCriteria = {
			"code": {
				"$in": record.groups
			}
		};
		if (record.tenant) {
			grpCriteria.tenant = record.tenant;
		}
		var combo = {
			collection: groupsCollectionName,
			condition: grpCriteria
		};
		
		driver.model.findEntries(soajs, combo, function (err, groups) {
			record.groupsConfig = null;
			if (err) {
				soajs.log.error(err);
			}
			else {
				record.groupsConfig = groups;
			}
			callbck(record);
		});
	},
	"objectIsEnv": function (obj) {
		if (obj) {
			if (JSON.stringify(obj) === '{}') {
				return false;
			}
			if (!Object.hasOwnProperty.call(obj, 'access') && !obj.apis && !obj.apisRegExp && !obj.apisPermission) {
				if (obj.get || obj.post || obj.put || obj.delete) {
					return false;
				}
				return true;
			}
		}
		return false;
	},
	"assureConfig": function (soajs, urac, cb) {
		// same as session.setURAC
		if (!urac) {
			if (cb && (typeof cb === "function")) {
				return cb();
			}
			else {
				return;
			}
		}
		var regEnvironment = (process.env.SOAJS_ENV || "dev");
		regEnvironment = regEnvironment.toLowerCase();
		
		//NOTE: we need to assure config = {packages: {}, keys : {}}
		if (!urac.config) {
			urac.config = {};
		}
		if (!urac.config.packages) {
			urac.config.packages = {};
		}
		else {
			for (var packageCode in urac.config.packages) {
				if (Object.hasOwnProperty.call(urac.config.packages, packageCode)) {
					var ACL = urac.config.packages[packageCode].acl;
					urac.config.packages[packageCode].acl_all_env = urac.config.packages[packageCode].acl;
					if (ACL && typeof ACL === "object") {
						if (ACL[regEnvironment]) {
							if (utilities.objectIsEnv(ACL[regEnvironment])) {
								urac.config.packages[packageCode].acl = ACL[regEnvironment];
							}
						}
					}
				}
			}
		}
		if (!urac.config.keys) {
			urac.config.keys = {};
		}
		else {
			//urac.config.keys[key].acl
			for (var key in urac.config.keys) {
				if (Object.hasOwnProperty.call(urac.config.keys, key)) {
					var ACL = urac.config.keys[key].acl;
					urac.config.keys[key].acl_all_env = urac.config.keys[key].acl;
					if (ACL && typeof ACL === "object") {
						if (ACL[regEnvironment]) {
							if (!utilities.objectIsEnv(ACL[regEnvironment])) {
								urac.config.keys[key].acl = ACL[regEnvironment];
							}
						}
					}
				}
			}
		}
		
		//Groups ACL
		// - merge all group.config.keys[key].acl
		// - merge all group.config.packages[packageCode].acl
		if (urac.groupsConfig) {
			var mergedInfo = {"keys": {}, "packages": {}};
			for (var i = 0; i <= urac.groupsConfig.length; i++) {
				var group = urac.groupsConfig[i];
				if (group && group.config) {
					if (group.config.keys) {
						//merge all keys ACL
						for (var key in group.config.keys) {
							if (Object.hasOwnProperty.call(group.config.keys, key)) {
								var ACL = group.config.keys[key].acl;
								if (ACL) {
									if (mergedInfo.keys[key] && mergedInfo.keys[key].acl_all_env) {
										mergedInfo.keys[key].acl_all_env = merge.recursive(true, mergedInfo.keys[key].acl_all_env, ACL);
									}
									else {
										mergedInfo.keys[key] = {
											"acl_all_env": ACL
										};
									}
									
									if (mergedInfo.keys[key] && mergedInfo.keys[key].acl) {
										mergedInfo.keys[key].acl = mergedInfo.keys[key].acl_all_env[regEnvironment];
									}
									else {
										mergedInfo.keys[key] = {
											"acl": mergedInfo.keys[key].acl_all_env[regEnvironment]
										};
									}
								}
							}
						}
					}
					if (group.config.packages) {
						//merge all packages ACL
						for (var packageCode in group.config.packages) {
							if (Object.hasOwnProperty.call(group.config.packages, packageCode)) {
								var ACL = group.config.packages[packageCode].acl;
								if (ACL) {
									if (mergedInfo.packages[packageCode] && mergedInfo.packages[packageCode].acl_all_env) {
										mergedInfo.packages[packageCode].acl_all_env = merge.recursive(true, mergedInfo.packages[packageCode].acl_all_env, ACL);
									}
									else {
										mergedInfo.packages[packageCode] = {"acl_all_env": ACL};
									}
									
									if (mergedInfo.packages[packageCode] && mergedInfo.packages[packageCode].acl) {
										mergedInfo.packages[packageCode].acl = mergedInfo.packages[packageCode].acl_all_env[regEnvironment];
									}
									else {
										mergedInfo.packages[packageCode] = {
											"acl": mergedInfo.packages[packageCode].acl_all_env[regEnvironment]
										};
									}
								}
							}
						}
					}
				}
			}
			urac.groupsConfig = mergedInfo;
		}
		
		if (cb && (typeof cb === "function")) {
			return cb();
		}
		else {
			return;
		}
	}
};

driver = {
	"model": null,
	"passportLibInit": function (req, cb) {
		passportLib.init(req, cb);
	},
	"passportLibInitAuth": function (req, response, passport) {
		passportLib.initAuth(req, response, passport);
	},
	"passportLibAuthenticate": function (req, res, passport, cb) {
		function saveUser(soajs, user, cb) {
			var mode = soajs.inputmaskData.strategy;
			var filePath = __dirname + "/lib/drivers/" + mode + ".js";
			var socialNetworkDriver = require(filePath);
			socialNetworkDriver.mapProfile(user, function (error, profile) {
				driver.model.initConnection(soajs);
				
				var userRecord = {
					"username": profile.username,
					"password": profile.password,
					"firstName": profile.firstName,
					"lastName": profile.lastName,
					"email": profile.email,
					'status': 'active',
					'ts': new Date().getTime(),
					'groups': [],
					'config': {
						'packages': {},
						'keys': {}
					},
					'profile': {},
					"socialId": {}
				};
				
				userRecord.socialId[mode] = {
					ts: new Date().getTime(),
					"id": user.profile.id
				};
				
				var condition = {
					$or: []
				};
				if (userRecord.email) {
					condition["$or"].push({'email': userRecord.email});
				}
				var c = {};
				c['socialId.' + mode + '.id'] = user.profile.id;
				condition["$or"].push(c);
				
				var combo = {
					collection: userCollectionName,
					condition: condition
				};
				
				driver.model.findEntry(soajs, combo, function (err, record) {
					if (err) {
						soajs.log.error(err);
						driver.model.closeConnection(soajs);
						return cb({"code": 400, "msg": soajs.config.errors[400]});
					}
					
					if (record) {
						// update record
						if (!record.socialId) {
							record.socialId = {};
						}
						if (!record.socialId[mode]) {
							record.socialId[mode] = {
								ts: new Date().getTime()
							};
						}
						
						record.socialId[mode].id = user.profile.id;
						record.socialId[mode].accessToken = user.accessToken;
						if (user.refreshToken) { // first time application authorized
							record.socialId[mode].refreshToken = user.refreshToken;
						}
						
						var comboUpdate = {
							collection: userCollectionName,
							record: record
						};
						driver.model.saveEntry(soajs, comboUpdate, function (err, ret) {
							driver.model.closeConnection(soajs);
							if (err) {
								soajs.log.error(err);
							}
							return cb(null, record);
						});
					}
					else {
						userRecord.socialId[mode].accessToken = user.accessToken;
						if (user.refreshToken) { // first time application authorized
							userRecord.socialId[mode].refreshToken = user.refreshToken;
						}
						
						var comboInsert = {
							collection: userCollectionName,
							record: userRecord
						};
						driver.model.insertEntry(soajs, comboInsert, function (err, results) {
							driver.model.closeConnection(soajs);
							if (err) {
								soajs.log.error(err);
								return cb({"code": 400, "msg": soajs.config.errors[400]});
							}
							return cb(null, results[0]);
						});
					}
				});
			});
		}
		
		var authentication = req.soajs.inputmaskData.strategy;
		
		passportLib.getDriver(req, false, function (err, driver) {
			driver.preAuthenticate(req, function (error) {
				passport.authenticate(authentication, {session: false}, function (err, user, info) {
					if (err) {
						req.soajs.log.error(err);
						return cb({"code": 499, "msg": err.toString()});
					}
					if (!user) {
						cb({"code": 403, "msg": req.soajs.config.errors[403]});
					}
					
					req.soajs.inputmaskData.user = user;
					initBLModel(req.soajs, function (err) {
						saveUser(req.soajs, user, function (error, data) {
							cb(null, data);
						});
					});
				})(req, res);
				
			});
		});
		
	},
	
	"login": function (soajs, data, cb) {
		var helper = require("./lib/helpers.js");
		var username = data.username;
		var password = data.password;
		var criteria = {
			'username': username,
			'status': 'active'
		};
		var pattern = soajs.validator.SchemaPatterns.email;
		if (pattern.test(username)) {
			delete criteria.username;
			criteria.email = username;
		}
		
		initBLModel(soajs, function (err) {
			if (err) {
				return cb(err);
			}
			driver.model.initConnection(soajs);
			utilities.findRecord(soajs, criteria, cb, function (record) {
				var myConfig = driverConfig;
				if (soajs.config) {
					myConfig = soajs.config;
				}
				helper.comparePasswd(soajs.servicesConfig.urac, password, record.password, myConfig, function (err, response) {
					if (err || !response) {
						driver.model.closeConnection(soajs);
						return cb(413);
					}
					delete record.password;
					delete record.socialId;
					
					if (record.groups && Array.isArray(record.groups) && record.groups.length !== 0) {
						//Get Groups config
						utilities.findGroups(soajs, record, function (record) {
							driver.model.closeConnection(soajs);
							return cb(null, record);
						});
					}
					else {
						driver.model.closeConnection(soajs);
						return cb(null, record);
					}
					
				});
				
			});
		});
	},
	"getRecord": function (soajs, data, cb) {
		initBLModel(soajs, function (err) {
			driver.model.initConnection(soajs);
			var id;
			try {
				id = driver.model.validateId(soajs, data.id);
			}
			catch (e) {
				return cb(411);
			}
			
			var criteria = {
				'_id': id
			};
			utilities.findRecord(soajs, criteria, cb, function (record) {
				delete record.password;
				
				if (record.groups && Array.isArray(record.groups) && record.groups.length !== 0) {
					//Get Groups config
					utilities.findGroups(soajs, record, function (record) {
						returnUser(record);
					});
				}
				else {
					returnUser(record);
				}
				
				function returnUser(record) {
					utilities.assureConfig(soajs, record);
					driver.model.closeConnection(soajs);
					return cb(null, record);
				}
			});
		});
	},
	"ldapLogin": function (soajs, data, cb) {
		function saveProfile(soajs, profile, cb) {
			
			initBLModel(soajs, function () {
				driver.model.initConnection(soajs);
				
				var userRecord = {
					"username": profile.username,
					"password": profile.password,
					"firstName": profile.firstName,
					"lastName": profile.lastName,
					"email": profile.email,
					'status': 'active',
					'ts': new Date().getTime(),
					'groups': [],
					'config': {
						'packages': {},
						'keys': {}
					},
					'profile': {},
					"socialId": {}
				};
				
				var mode = 'ldap';
				
				userRecord.socialId[mode] = {
					ts: new Date().getTime(),
					"id": profile.id
				};
				
				var condition = {
					$or: []
				};
				if (userRecord.email) {
					condition["$or"].push({'email': userRecord.email});
				}
				var c = {};
				c['socialId.' + mode + '.id'] = profile.id;
				condition["$or"].push(c);
				
				var combo = {
					collection: userCollectionName,
					condition: condition
				};
				
				driver.model.findEntry(soajs, combo, function (err, record) {
					if (err) {
						soajs.log.error(err);
						driver.model.closeConnection(soajs);
						return cb({"code": 400, "msg": soajs.config.errors[400]});
					}
					
					if (record) {
						// update record
						if (!record.socialId) {
							record.socialId = {};
						}
						if (!record.socialId[mode]) {
							record.socialId[mode] = {
								ts: new Date().getTime()
							};
						}
						
						var comboUpdate = {
							collection: userCollectionName,
							record: record
						};
						driver.model.saveEntry(soajs, comboUpdate, function (err, ret) {
							driver.model.closeConnection(soajs);
							if (err) {
								soajs.log.error(err);
							}
							return cb(null, record);
						});
					}
					else {
						
						var comboInsert = {
							collection: userCollectionName,
							record: userRecord
						};
						driver.model.insertEntry(soajs, comboInsert, function (err, results) {
							driver.model.closeConnection(soajs);
							if (err) {
								soajs.log.error(err);
								return cb({"code": 400, "msg": soajs.config.errors[400]});
							}
							return cb(null, results[0]);
						});
					}
				});
				
			});
			
		}
		
		var username = data.username;
		var password = data.password;
		
		var host = driverConfig.ldap.host;
		var port = driverConfig.ldap.port;
		var baseDN = driverConfig.ldap.baseDN.replace(new RegExp(' ', 'g'), '');
		var adminUser = driverConfig.ldap.adminUser.replace(new RegExp(' ', 'g'), '');
		var adminPassword = driverConfig.ldap.adminPassword;
		
		var url = host + ":" + port;
		
		var filter = 'uid=' + username;
		var fullFilter = 'uid=' + username + ',' + baseDN;
		
		var ad = new ActiveDirectory({
			url: url,
			baseDN: baseDN,
			username: adminUser,
			password: adminPassword
		});
		
		ad.authenticate(fullFilter, password, function (err, auth) {
			if (err) {
				soajs.log.error(err);
				if (err.code && err.code === 'ECONNREFUSED') {
					soajs.log.error("Connection Refused!");
					return cb({"code": 700, "msg": soajs.config.errors[700]});
				}
				if (err.lde_message) {
					if (err.lde_message.includes('Incorrect DN given')) { // invalid admin username
						soajs.log.error("Incorrect DN given!");
						return cb({"code": 701, "msg": soajs.config.errors[701]});
					}
					
					if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(adminUser)) { // invalid admin credentials (wrong admin password)
						soajs.log.error("Invalid Admin Credentials");
						return cb({"code": 702, "msg": soajs.config.errors[702]});
					}
					
					if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(filter)) { // invalid user credentials (wrong user password)
						soajs.log.error("Invalid User Credentials");
						var obj = {"code": 703, "msg": soajs.config.errors[703]};
						return cb(obj);
					}
				}
				
				return cb({"code": 704, "msg": soajs.config.errors[704]});
			}
			
			if (auth) {
				soajs.log.debug('Authenticated!');
				
				ad.find(filter, function (err, user) {
					// since the user is authenticated, no error can be generated in this find call
					// since we are searching using the filter => we will have one result
					var record = user.other[0];
					
					/*
					 temporary code tbd -=-=-=-=-=-=-
					 */
					var profile = {
						id: record.dn,
						firstName: record.cn,
						lastName: record.sn,
						email: record.mail,
						password: '',
						username: record.dn,
						groups: [],
						tenant: {}
					};
					// console.log(soajs.tenant);
					// console.log("console.log(profile);");
					// console.log(profile);
					soajs.session.setURAC(profile, function (err) {
						saveProfile(soajs, profile, function (error, record) {
							return cb(null, record);
						});
					});
					
				});
				
			}
			else {
				soajs.log.error("Authentication failed.");
				return cb({"code": 705, "msg": soajs.config.errors[705]});
			}
		});
	}
};

module.exports = driver;