'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const driverConfig = require('./../config.js');

let bl = {
	
	/**
	 *
	 * @param soajs
	 * @param inputmaskData
	 * @param modelObj
	 * @param cb
	 */
	"lastLogin": (soajs, inputmaskData, modelObj, cb) => {
		let data = {};
		data.username = inputmaskData.username;
		data.lastLogin = new Date().getTime();
		modelObj.lastLogin(data, (err, record) => {
			if (err) {
				soajs.log.error(err);
				return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
			}
			return cb(null, record);
		});
	},
	
	/**
	 *
	 * @param soajs
	 * @param inputmaskData
	 * @param modelObj
	 * @param cb
	 * @returns {*}
	 */
	"save": (soajs, inputmaskData, modelObj, cb) => {
		if (!inputmaskData.mode || !inputmaskData.user) {
			return cb({"code": 400, "msg": driverConfig.errors[400] + " - mode and user are required."});
		}
		
		let mode = inputmaskData.mode;
		let user = inputmaskData.user;
		
		let userRecord = {
			"username": user.username,
			"email": user.email,
			
			"firstName": user.firstName,
			"lastName": user.lastName,
			
			"socialId": {
				[mode]: {
					"ts": new Date().getTime(),
					"id": user.id,
					"originalProfile": user.originalProfile || null,
					"accessToken": user.accessToken || null,
					"refreshToken": user.refreshToken || null
				}
			},
			
			'groups': [],
			"tenant": {
				"id": soajs.tenant.id,
				"code": soajs.tenant.code
			},
			
			'status': 'active',
			'ts': new Date().getTime(),
			'config': {},
			'profile': {},
			
			"lastLogin": new Date().getTime()
		};
		
		let allowedTenantObj = null;
		if (soajs.tenant.main && soajs.tenant.main.code) {
			userRecord.tenant = {
				"id": soajs.tenant.main.id,
				"code": soajs.tenant.main.code
			};
			allowedTenantObj = {
				"tenant": {
					"id": soajs.tenant.id,
					"code": soajs.tenant.code
				}
			};
			if (user.groups) {
				allowedTenantObj.groups = user.groups;
			}
		} else {
			if (user.groups) {
				userRecord.groups = user.groups;
			}
		}
		
		let data = {
			"id": user.id,
			"mode": mode
		};
		if (user.email) {
			data.email = user.email;
		}
		modelObj.getSocialNetworkUser(data, (err, record) => {
			if (err) {
				soajs.log.error(err);
				return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
			}
			
			if (record) {
				// update record
				if (!record.socialId) {
					record.socialId = {};
				}
				if (!record.socialId[mode]) {
					record.socialId[mode] = {};
				}
				record.socialId[mode].ts = userRecord.socialId[mode].ts;
				record.socialId[mode].id = userRecord.socialId[mode].id;
				record.socialId[mode].originalProfile = userRecord.socialId[mode].originalProfile;
				record.socialId[mode].accessToken = userRecord.socialId[mode].accessToken;
				record.socialId[mode].refreshToken = userRecord.socialId[mode].refreshToken;
				
				record.firstName = userRecord.firstName;
				record.lastName = userRecord.lastName;
				record.lastLogin = userRecord.lastLogin;
				
				//TODO: loop over config.allowedTenants in case of sub tenant and check if it is there ot not
				if (allowedTenantObj) {
					let inAllowed = false;
					if (record.config && record.config.allowedTenants && Array.isArray(record.config.allowedTenants)) {
						for (let i = 0; i < record.config.allowedTenants.length; i++) {
							let temp_allowedTenantObj = record.config.allowedTenants[i];
							if (temp_allowedTenantObj.tenant.id === allowedTenantObj.tenant.is) {
								inAllowed = true;
								if (allowedTenantObj.groups) {
									if (!temp_allowedTenantObj.groups || !Array.isArray(temp_allowedTenantObj.groups) || temp_allowedTenantObj.groups.length === 0) {
										record.config.allowedTenants[i].groups = allowedTenantObj.groups;
									}
								}
								break;
							}
						}
						if (!inAllowed) {
							record.config.allowedTenants.push(allowedTenantObj);
						}
					} else {
						if (!record.config) {
							record.config = {};
						}
						if (!record.config.allowedTenants) {
							record.config.allowedTenants = [];
							record.config.allowedTenants.push(allowedTenantObj);
						}
					}
				}
				
				//TODO: we need to add the mechanism to update the email but this requires checking if it exists first and how to handle such case
				
				modelObj.updateSocialNetworkUser(record, (err) => {
					if (err) {
						soajs.log.error(err);
						return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
					}
					return cb(null, record);
				});
			} else {
				if (allowedTenantObj) {
					userRecord.config.allowedTenants = [];
					userRecord.config.allowedTenants.push(allowedTenantObj);
				}
				modelObj.insertSocialNetworkUser(userRecord, (err, record) => {
					if (err) {
						soajs.log.error(err);
						return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
					}
					if (record && Array.isArray(record)) {
						record = record[0];
					}
					return cb(null, record);
				});
			}
		});
	},
	
	/**
	 * Find user record where status is always active
	 *
	 * @param soajs
	 * @param inputmaskData
	 * @param modelObj
	 * @param cb
	 */
	"find": (soajs, inputmaskData, modelObj, cb) => {
		let data = {};
		if (inputmaskData.username) {
			data.username = inputmaskData.username;
			modelObj.getUserByUsernameOrId(data, (err, record) => {
				if (err) {
					soajs.log.error(err);
					return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
				}
				if (record && record.status === "active") {
					return cb(null, record);
				} else if (record && record.status === "pendingNew") {
					soajs.log.error("User [" + data.username + "] status is " + record.status);
					return cb({"code": 405, "msg": driverConfig.errors[405]});
				} else if (record && record.status === "inactive") {
					soajs.log.error("User [" + data.username + "] status is " + record.status);
					return cb({"code": 406, "msg": driverConfig.errors[406]});
				}
				return cb(null, null);
			});
		} else if (inputmaskData.email) {
			data.email = inputmaskData.email;
			modelObj.getUserByEmail(data, (err, record) => {
				if (err) {
					soajs.log.error(err);
					return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
				}
				if (record && record.status === "active") {
					return cb(null, record);
				}
				return cb(null, null);
			});
		} else if (inputmaskData.pin) {
			data.pin = inputmaskData.pin;
			data.tId = inputmaskData.tId;
			modelObj.getUserByPin(data, (err, record) => {
				if (err) {
					soajs.log.error(err);
					return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
				}
				if (record && record.status === "active") {
					return cb(null, record);
				}
				return cb(null, null);
			});
		} else if (inputmaskData.id) {
			data.id = inputmaskData.id;
			modelObj.getUserByUsernameOrId(data, (err, record) => {
				if (err) {
					soajs.log.error(err);
					return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
				}
				return cb(null, record);
			});
		}
	},
	
	/**
	 *
	 * @param record
	 */
	"assureConfig": (record) => {
		if (!record) {
			record = {};
		}
		if (!record.config) {
			record.config = {};
		}
		
		//Groups ACL
		if (record.groupsConfig && record.groupsConfig.length >= 1) {
			// for now we will only take one group
			let group = record.groupsConfig[0];
			
			let mergedInfo = {"allowedPackages": {}, "allowedEnvironments": {}};
			if (group.config) {
				if (group.config.allowedPackages) {
					mergedInfo.allowedPackages = group.config.allowedPackages;
				}
				if (group.config.allowedEnvironments) {
					mergedInfo.allowedEnvironments = group.config.allowedEnvironments;
				}
				record.groupsConfig = mergedInfo;
			}
		}
	}
	
};

module.exports = bl;