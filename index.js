"use strict";
var driverConfig = require('./config.js');
var fs = require("fs");

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