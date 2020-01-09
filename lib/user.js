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
			"password": user.password,
			"firstName": user.firstName,
			"lastName": user.lastName,
			"email": user.email,
			'status': 'active',
			'ts': new Date().getTime(),
			'groups': [],
			'config': {},
			'profile': {},
			"socialId": {
				[mode]: {
					"ts": new Date().getTime(),
					"id": user.id,
					"originalProfile": user.originalProfile || null,
					"accessToken": user.accessToken || null,
					"refreshToken": user.refreshToken || null
				}
			},
			"tenant": {
				"id": soajs.tenant.id,
				"code": soajs.tenant.code
			},
			"lastLogin": new Date().getTime()
		};
		
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
				record.username = userRecord.username;
				record.password = userRecord.password;
				record.firstName = userRecord.firstName;
				record.lastName = userRecord.lastName;
				record.lastLogin = userRecord.lastLogin;
				//TODO: we need to add the mechanism to update the email but this requires checking if it exists first and how to handle such case
				
				modelObj.updateSocialNetworkUser(record, (err) => {
					if (err) {
						soajs.log.error(err);
						return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
					}
					return cb(null, record);
				});
			} else {
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