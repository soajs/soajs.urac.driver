'use strict';
var Hasher = require('soajs.core.modules').hasher;
var userCollectionName = "users";
var groupsCollectionName = "groups";
var merge = require('merge');

var utils = {
	/**
	 * Save the user in the database
	 *
	 * @param {SOAJS object} soajs
	 * @param {Model Object} model
	 * @param {String} mode
	 * @param {Object} user
	 * @param {Callback(error object, record object) Function} cb
	 */
	"saveUser": function (soajs, model, mode, user, cb) {
		var filePath = __dirname + "/../lib/drivers/" + mode + ".js";
		var socialNetworkDriver = require(filePath);
		socialNetworkDriver.mapProfile(user, function (error, profile) {
			model.initConnection(soajs);
			
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
			
			model.findEntry(soajs, combo, function (err, record) {
				if (err) {
					soajs.log.error(err);
					model.closeConnection(soajs);
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
					model.saveEntry(soajs, comboUpdate, function (err, ret) {
						model.closeConnection(soajs);
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
					model.insertEntry(soajs, comboInsert, function (err, results) {
						model.closeConnection(soajs);
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
	 * @param {SOAJS object} soajs
	 * @param {Model Object} model
	 * @param {Object} record
	 * @param {Callback(error object, record object) Function} callback
	 */
	"findGroups": function (soajs, model, record, callback) {
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
		
		model.findEntries(soajs, combo, function (err, groups) {
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
	 * @param {SOAJS object} soajs
	 * @param {Model Object} model
	 * @param {Object} condition
	 * @param {Main Callback(error object, record object) Function} mainCb
	 * @param {Callback(error object, record object) Function} callback
	 */
	"findRecord": function (soajs, model, condition, mainCb, callback) {
		soajs.log.debug(condition);
		var combo = {
			collection: userCollectionName,
			condition: condition
		};
		model.findEntry(soajs, combo, function (err, record) {
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
	 * Check the ACL obj. Return true if the object passed is an environment, false otherwise
	 *
	 * @param {Object} obj
	 */
	"objectIsEnv": function (obj) {
		if (obj) {
			if (JSON.stringify(obj) === '{}') {
				return false;
			}
			if (!Object.hasOwnProperty.call(obj, 'access') && !Object.hasOwnProperty.call(obj,'apis') && !Object.hasOwnProperty.call(obj,'apisRegExp') && !Object.hasOwnProperty.call(obj,'apisPermission')) {
				return !(obj.get || obj.post || obj.put || obj.delete);
			}
		}
		return false;
	},
	
	/**
	 * Assure that the acl is defined per environment
	 *
	 * @param {SOAJS object} soajs
	 * @param {Object} urac: the user record
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
		var ACL, packageCode, key;
		//NOTE: we need to assure config = {packages: {}, keys : {}}
		if (!urac.config) {
			urac.config = {};
		}
		if (!urac.config.packages) {
			urac.config.packages = {};
		}
		else {
			for (packageCode in urac.config.packages) {
				if (Object.hasOwnProperty.call(urac.config.packages, packageCode)) {
					var ACL = urac.config.packages[packageCode].acl_all_env;
					if(!ACL){
						ACL = urac.config.packages[packageCode].acl_all_env = urac.config.packages[packageCode].acl;
					}
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
			for (key in urac.config.keys) {
				if (Object.hasOwnProperty.call(urac.config.keys, key)) {
					var ACL = urac.config.keys[key].acl_all_env;
					if(!ACL){
						ACL = urac.config.keys[key].acl_all_env = urac.config.keys[key].acl;
					}
					if (ACL && typeof ACL === "object") {
						if (ACL[regEnvironment]) {
							if (utils.objectIsEnv(ACL[regEnvironment])) {
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
						for (key in group.config.keys) {
							if (Object.hasOwnProperty.call(group.config.keys, key)) {
								ACL = group.config.keys[key].acl;
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
						for (packageCode in group.config.packages) {
							if (Object.hasOwnProperty.call(group.config.packages, packageCode)) {
								ACL = group.config.packages[packageCode].acl;
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
	 * Compare the input password with the database password
	 *
	 * @param {Object} servicesConfig: Services Configuration
	 * @param {String} pwd: The password
	 * @param {String} cypher: Hashed password
	 * @param {Object} config
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