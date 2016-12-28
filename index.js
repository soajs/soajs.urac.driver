"use strict";
var driverConfig = require('./config.js');
var fs = require("fs");

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

driver = {
	"model": null,
	"passportLibInit" : function(req,cb) {
		passportLib.init(req, cb);
	},
	"passportLibInitAuth" : function(req,response,passport) {
		passportLib.initAuth(req, response,passport);
	},
	"passportLibAuthenticate" : function(req, res, passport, initBLModel) {
		passportLib.authenticate(req, res, passport, initBLModel);
	},
	"customLogin": function (soajs, data, cb) {
		var user = data.user;
		var mode = data.strategy;
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
				
				function setSession(record, setURACCallback) {
					delete record.password;
					var returnRecord = JSON.parse(JSON.stringify(record));
					record.socialLogin = {};
					record.socialLogin = record.socialId[mode];
					record.socialLogin.strategy = mode;
					delete record.socialId;
					delete returnRecord.socialId;
					delete returnRecord.socialLogin;
					if (soajs.session) {
						return setURACCallback(null, record);
					}
					else {
						return cb(null, record);
					}
				}
				
				driver.model.findEntry(soajs, combo, function (err, record) {
					if (err) {
						soajs.log.error(err);
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
							setSession(record, function(error, record){
								return cb(null, record);
							});
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
							var data = {config: soajs.config, error: err, code: 400};
							checkIfError(req, cb, data, false, function () {
								setSession(results[0], function(error, record){
									return cb(null, record);
								});
							});
						});
					}
				});
				
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
				
				utils.comparePasswd(soajs.servicesConfig.urac, password, record.password, soajs.config, function (err, response) {
					if (err || !response) {
						driver.model.closeConnection(soajs);
						return cb(413);
					}
					delete record.password;
					delete record.socialId;
					
					if (!record.groups || !Array.isArray(record.groups) || record.groups.length === 0) {
						driver.model.closeConnection(soajs);
						return cb(null, record);
					}
					
					//Get Groups config
					var grpCriteria = {
						"code": {"$in": record.groups}
					};
					if (record.tenant) {
						grpCriteria.tenant = record.tenant;
					}
					var combo = {
						collection: groupsCollectionName,
						condition: grpCriteria
					};
					
					driver.model.findEntries(soajs, combo, function (err, groups) {
						driver.model.closeConnection(soajs);
						record.groupsConfig = null;
						if (err) {
							soajs.log.error(err);
						}
						else {
							record.groupsConfig = groups;
						}
						return cb(null, record);
					});
				});
				
			});
			
		});
	},
	"getRecord": function (soajs, data, cb) {
		var id = data.id;
		var criteria = {
			'_id': id
		};
		driver.model.initConnection(soajs);
		findRecord(soajs, criteria, cb, function (record) {
			driver.model.closeConnection(soajs);
			return cb(null, record);
		});
	}
};

module.exports = driver;