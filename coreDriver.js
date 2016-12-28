"use strict";
var userRecord;
var uracDriver = require("./index.js");

var lib = {
	"init": function (soajs, id, cb) {
		userRecord = null;
		uracDriver.getRecord(soajs, {id: id.toString()}, function (err, record) {
			if (record) {
				userRecord = record;
			}
			cb();
		});
	},
	
	"getUrac": function (_ALL) {
		if (!userRecord) {
			return null;
		}
		var urac = null;
		if (userRecord.username) {
			urac = {
				"_id": userRecord._id,
				"username": userRecord.username,
				"firstName": userRecord.firstName,
				"lastName": userRecord.lastName,
				"email": userRecord.email,
				"groups": userRecord.groups,
				"profile": userRecord.profile,
				"tenant": userRecord.tenant,
				"oauthRefreshToken": userRecord.oauthRefreshToken,
				"oauthAccessToken": userRecord.oauthAccessToken
			};
			
			if (userRecord.socialLogin) {
				urac.socialLogin = {
					"strategy": userRecord.socialLogin.strategy,
					"id": userRecord.socialLogin.id
				};
			}
			
			if (_ALL) {
				if (userRecord.socialLogin) {
					urac.socialLogin.accessToken = userRecord.socialLogin.accessToken;
				}
				
				urac.config = userRecord.config;
			}
		}
		return urac;
	},
	
	"getAcl": function (soajs) {
		
		function getRecordAcl(soajs, record) {
			// same result as session.getAcl
			var key = soajs.tenant.key.iKey;
			var packageCode = soajs.tenant.application.package;
			
			var acl = null;
			
			if (record.config) {
				if (record.config.keys && record.config.keys[key] && record.config.keys[key].acl) {
					acl = record.config.keys[key].acl;
				}
				if (!acl && record.config.packages && record.config.packages[packageCode] && record.config.packages[packageCode].acl) {
					acl = record.config.packages[packageCode].acl;
				}
			}
			
			if (!acl && record.groupsConfig) {
				if (record.groupsConfig.keys && record.groupsConfig.keys[key] && record.groupsConfig.keys[key].acl) {
					acl = record.groupsConfig.keys[key].acl;
				}
				if (record.groupsConfig.packages && record.groupsConfig.packages[packageCode] && record.groupsConfig.packages[packageCode].acl) {
					acl = record.groupsConfig.packages[packageCode].acl;
				}
			}
			
			return acl;
		}
		
		getRecordAcl(soajs, userRecord);
	},
	
	"getConfig": function (soajs) {
		var key = soajs.tenant.iKey;
		if (!userRecord) {
			return null;
		}
		var config = null;
		if (userRecord.config.keys[key] && userRecord.config.keys[key].config) {
			config = userRecord.config.keys[key].config;
		}
		
		return config;
	},
	
	"getGroups": function () {
		if (!userRecord) {
			return null;
		}
		var groups = null;
		if (userRecord.groups) {
			groups = userRecord.groups;
		}
		return groups;
	}
	
};

module.exports = lib;