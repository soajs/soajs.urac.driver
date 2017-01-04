"use strict";
var driverConfig = require('./config.js');
var fs = require("fs");
var merge = require('merge');

var passportLib = require('./lib/passport.js');

var userCollectionName = "users";
var groupsCollectionName = "groups";

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

function findRecord(soajs, condition, mainCb, callbck) {
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
}

function saveUser(soajs, user, cb) {
	var mode = soajs.inputmaskData.strategy;
	var filePath = __dirname + "/lib/drivers/" + mode + ".js";
	var socialNetworkDriver = require(filePath);
	socialNetworkDriver.mapProfile(user, function (error, profile) {
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
	});
}

function findGroups(soajs, record, callbck) {
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
}

function objectIsEnv(obj) {
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
}

function assureConfig(soajs, urac, cb) {
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
						if (objectIsEnv(ACL[regEnvironment])) {
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
						if (!objectIsEnv(ACL[regEnvironment])) {
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

driver = {
	"model": null,
	"passportLibInit": function (req, cb) {
		passportLib.init(req, cb);
	},
	"passportLibInitAuth": function (req, response, passport) {
		passportLib.initAuth(req, response, passport);
	},
	"passportLibAuthenticate": function (req, res, passport, cb) {
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
					saveUser(req.soajs, user, function (error, data) {
						cb(null, data);
					});
				})(req, res);
				
			});
		});
		
	},
	
	"login": function (soajs, data, cb) {
		var utils = require("./lib/utils.js");
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
		
		initBLModel(soajs, function () {
			driver.model.initConnection(soajs);
			findRecord(soajs, criteria, cb, function (record) {
				var myConfig = driverConfig;
				if (soajs.config) {
					myConfig = soajs.config;
				}
				utils.comparePasswd(soajs.servicesConfig.urac, password, record.password, myConfig, function (err, response) {
					if (err || !response) {
						driver.model.closeConnection(soajs);
						return cb(413);
					}
					delete record.password;
					delete record.socialId;
					
					if (record.groups && Array.isArray(record.groups) && record.groups.length !== 0) {
						//Get Groups config
						findGroups(soajs, record, function (record) {
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
		
		findRecord(soajs, criteria, cb, function (record) {
			delete record.password;
			
			if (record.groups && Array.isArray(record.groups) && record.groups.length !== 0) {
				//Get Groups config
				findGroups(soajs, record, function (record) {
					returnUser(record);
				});
			}
			else {
				returnUser(record);
			}
			
			function returnUser(record) {
				assureConfig(soajs, record);
				driver.model.closeConnection(soajs);
				return cb(null, record);
			}
		});
	}
};

module.exports = driver;