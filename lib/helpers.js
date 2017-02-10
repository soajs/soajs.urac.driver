'use strict';
var soajsCore = require('soajs');
var Hasher = soajsCore.hasher;
var userCollectionName = "users";
var groupsCollectionName = "groups";

var utils = {
	/**
	 * Save the user in the database
	 *
	 * @param {soajs object} soajs
	 * @param {driver object} driver
	 * @param {mode string} mode
	 * @param {user object} user
	 * @param {Callback(error object, record object) Function} cb
	 */
	"saveUser": function (soajs, driver, mode, user, cb) {
		var filePath = __dirname + "/../lib/drivers/" + mode + ".js";
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
				"socialId": {},
				"tenant": {
					"id": soajs.tenant.id,
					"code": soajs.tenant.code
				}
			};
			
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
					
					record.socialId[mode].id = profile.id;
					if (user.accessToken) {
						record.socialId[mode].accessToken = user.accessToken;
					}
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
					if (user.accessToken) {
						userRecord.socialId[mode].accessToken = user.accessToken;
					}
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
	},
	
	/**
	 * Return the groups of a record
	 *
	 * @param {soajs object} soajs
	 * @param {driver object} driver
	 * @param {record object} record
	 * @param {Callback(error object, record object) Function} callback
	 */
	"findGroups": function (soajs, driver, record, callback) {
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
			callback(record);
		});
	},
	
	/**
	 * Find the record in the database
	 *
	 * @param {soajs object} soajs
	 * @param {driver object} driver
	 * @param {condition object} condition
	 * @param {Main Callback(error object, record object) Function} mainCb
	 * @param {Callback(error object, record object) Function} callback
	 */
	"findRecord": function (soajs, driver, condition, mainCb, callback) {
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
				soajs.log.debug('record:');
				soajs.log.debug(record);
				return callback(record);
			}
			else {
				soajs.log.error('User not Found');
				return mainCb(401);
			}
		});
	},
	
	/**
	 * Return true if the object passed is environment, false otherwise
	 *
	 * @param {object object} obj
	 */
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
	
	/**
	 * Assure that the acl is defined per environment
	 *
	 * @param {soajs object} soajs
	 * @param {urac object} urac
	 * @param {Callback(error object, record object) Function} cb
	 */
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
							if (utils.objectIsEnv(ACL[regEnvironment])) {
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
							if (!utils.objectIsEnv(ACL[regEnvironment])) {
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
	},
	
	/**
	 * Assure that the acl is defined per environment
	 *
	 * @param {Services Configuration object} servicesConfig
	 * @param {Password string} pwd
	 * @param {hashed password string} cypher
	 * @param {configuration string} config
	 * @param {Callback(Hasher.compare) Function} cb
	 */
	"comparePasswd": function (servicesConfig, pwd, cypher, config, cb) {
		var hashConfig = {
			"hashIterations": config.hashIterations,
			"seedLength": config.seedLength
		};
		if (servicesConfig && servicesConfig.hashIterations && servicesConfig.seedLength) {
			hashConfig = {
				"hashIterations": servicesConfig.hashIterations,
				"seedLength": servicesConfig.seedLength
			};
		}
		
		Hasher.init(hashConfig);
		if (servicesConfig && servicesConfig.optionalAlgorithm && servicesConfig.optionalAlgorithm !== '') {
			var crypto = require("crypto");
			var hash = crypto.createHash(servicesConfig.optionalAlgorithm);
			pwd = hash.update(pwd).digest('hex');
		}
		
		Hasher.compare(pwd, cypher, cb);
	}
};

module.exports = utils;