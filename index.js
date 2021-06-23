'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const fs = require("fs");

const get = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

const driverConfig = require('./config.js');

let model = process.env.SOAJS_SERVICE_MODEL || "mongo";

let BL = {
	user: require("./lib/user.js"),
	group: require("./lib/group.js"),
	common: require('./lib/common.js')
};
let SSOT = {};

let driver = {
	"modelInit": false,
	
	/**
	 * Login by pin code
	 *
	 * @param soajs
	 * @param input
	 * @param cb
	 */
	"loginByPin": function (soajs, input, cb) {
		initBLModel(soajs, function (error) {
			if (error) {
				return cb(error);
			}
			if (!input || !input.pin) {
				return cb({"code": 403, "msg": driverConfig.errors[403]});
			}
			let modelUserObj = null;
			if (SSOT.userModelObj) {
				modelUserObj = SSOT.userModelObj;
			} else {
				modelUserObj = new SSOT.user(soajs);
			}
			BL.user.find(soajs, {"pin": input.pin, "tId": soajs.tenant.id}, modelUserObj, (error, record) => {
				if (error) {
					modelUserObj.closeConnection();
					return cb(error);
				}
				if (!record) {
					modelUserObj.closeConnection();
					return cb({"code": 403, "msg": driverConfig.errors[403]});
				}
				delete record.password;
				delete record.socialId;
				let autoRoaming = get(["registry", "custom", "urac", "value", "autoRoaming"], soajs);
				let userTenant = BL.common.checkUserTenantAccess(record, soajs.tenant, soajs.log, autoRoaming);
				if (!userTenant) {
					modelUserObj.closeConnection();
					return cb({"code": 403, "msg": driverConfig.errors[403]});
				}
				if (userTenant.groups && Array.isArray(userTenant.groups) && userTenant.groups.length !== 0) {
					record.groups = userTenant.groups;
					record.tenant = userTenant.tenant;
					//Get Groups config
					// let modelGroupObj = new SSOT.group(soajs);
					let modelGroupObj = null;
					if (SSOT.groupModelObj) {
						modelGroupObj = SSOT.groupModelObj;
					} else {
						modelGroupObj = new SSOT.group(soajs);
					}
					let data = {
						"groups": record.groups
					};
					BL.group.find(soajs, data, modelGroupObj, function (error, groups) {
						modelGroupObj.closeConnection();
						if (error) {
							modelUserObj.closeConnection();
							return cb(error);
						}
						if (groups && Array.isArray(groups) && groups.length !== 0) {
							record.groupsConfig = groups;
						}
						returnUser(record);
					});
				} else {
					returnUser(record);
				}
				
				function returnUser(record) {
					let data = {
						"username": record.username
					};
					BL.user.lastLogin(soajs, data, modelUserObj, () => {
						modelUserObj.closeConnection();
					});
					BL.user.assureConfig(record, (error, record) => {
						return cb(null, record);
					});
				}
			});
		});
	},
	
	/**
	 * Login with username and password
	 * @param soajs
	 * @param input
	 * @param cb
	 */
	"login": function (soajs, input, cb) {
		initBLModel(soajs, function (error) {
			if (error) {
				return cb(error);
			}
			// let modelUserObj = new SSOT.user(soajs);
			let modelUserObj = null;
			if (SSOT.userModelObj) {
				modelUserObj = SSOT.userModelObj;
			} else {
				modelUserObj = new SSOT.user(soajs);
			}
			let data = {};
			let pattern = /^(?:[\w!#$%&'*+\-\/=?^`{|}~]+\.)*[\w!#$%&'*+\-\/=?^`{|}~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])]))$/;
			
			if (!input || !input.username) {
				return cb({"code": 403, "msg": driverConfig.errors[403]});
			}
			if (pattern.test(input.username)) {
				data.email = input.username;
			} else {
				data.username = input.username;
			}
			BL.user.find(soajs, data, modelUserObj, (error, record) => {
				if (error) {
					modelUserObj.closeConnection();
					return cb(error);
				}
				if (!record) {
					modelUserObj.closeConnection();
					return cb({"code": 403, "msg": driverConfig.errors[403]});
				}
				let myConfig = driverConfig;
				if (soajs.config) {
					myConfig = soajs.config;
				}
				
				let encryptionConfig = {};
				if (soajs.servicesConfig.hashIterations) {
					encryptionConfig.hashIterations = soajs.servicesConfig.hashIterations;
				} else {
					let hashIterations = get(["registry", "custom", "urac", "value", "hashIterations"], soajs);
					if (hashIterations) {
						encryptionConfig.hashIterations = hashIterations;
					}
				}
				if (soajs.servicesConfig.optionalAlgorithm) {
					encryptionConfig.optionalAlgorithm = soajs.servicesConfig.optionalAlgorithm;
				} else {
					let optionalAlgorithm = get(["registry", "custom", "urac", "value", "optionalAlgorithm"], soajs);
					if (optionalAlgorithm) {
						encryptionConfig.optionalAlgorithm = optionalAlgorithm;
					}
				}
				
				BL.common.comparePasswd(encryptionConfig, input.password, record.password, myConfig, (err, response) => {
					if (err || !response) {
						if (err) {
							soajs.log.error(err.message);
						}
						modelUserObj.closeConnection();
						return cb({"code": 402, "msg": driverConfig.errors[402]});
					}
					delete record.password;
					delete record.socialId;
					let autoRoaming = get(["registry", "custom", "urac", "value", "autoRoaming"], soajs);
					let userTenant = BL.common.checkUserTenantAccess(record, soajs.tenant, soajs.log, autoRoaming);
					if (!userTenant) {
						modelUserObj.closeConnection();
						return cb({"code": 403, "msg": driverConfig.errors[403]});
					}
					if (userTenant.groups && Array.isArray(userTenant.groups) && userTenant.groups.length !== 0) {
						record.groups = userTenant.groups;
						record.tenant = userTenant.tenant;
						//Get Groups config
						// let modelGroupObj = new SSOT.group(soajs);
						let modelGroupObj = null;
						if (SSOT.groupModelObj) {
							modelGroupObj = SSOT.groupModelObj;
						} else {
							modelGroupObj = new SSOT.group(soajs);
						}
						let data = {
							"groups": record.groups
						};
						BL.group.find(soajs, data, modelGroupObj, function (error, groups) {
							modelGroupObj.closeConnection();
							if (error) {
								modelUserObj.closeConnection();
								return cb(error);
							}
							if (groups && Array.isArray(groups) && groups.length !== 0) {
								record.groupsConfig = groups;
							}
							returnUser(record);
						});
					} else {
						returnUser(record);
					}
					
					function returnUser(record) {
						let data = {
							"username": record.username
						};
						BL.user.lastLogin(soajs, data, modelUserObj, () => {
							modelUserObj.closeConnection();
						});
						BL.user.assureConfig(record, (error, record) => {
							return cb(null, record);
						});
					}
				});
			});
		});
	},
	
	/**
	 * Get logged in record from database
	 *
	 * @param soajs
	 * @param input
	 * @param cb
	 */
	"getRecord": function (soajs, input, cb) {
		initBLModel(soajs, function (error) {
			if (error) {
				return cb(error);
			}
			// let modelUserObj = new SSOT.user(soajs);
			let modelUserObj = null;
			if (SSOT.userModelObj) {
				modelUserObj = SSOT.userModelObj;
			} else {
				modelUserObj = new SSOT.user(soajs);
			}
			let data = {};
			if (input.username) {
				data.username = input.username;
				resume();
			} else if (input.id) {
				data.id = input.id;
				modelUserObj.validateId(data, (err, _id) => {
					if (err) {
						modelUserObj.closeConnection();
						soajs.log.error(err.message);
						return cb({"code": 404, "msg": driverConfig.errors[404]});
					}
					data.id = _id;
					resume();
				});
			} else {
				resume();
			}
			
			function resume() {
				BL.user.find(soajs, data, modelUserObj, (error, record) => {
					if (error) {
						modelUserObj.closeConnection();
						return cb(error);
					}
					if (!record) {
						modelUserObj.closeConnection();
						return cb({"code": 403, "msg": driverConfig.errors[403]});
					}
					delete record.password;
					let autoRoaming = get(["registry", "custom", "urac", "value", "autoRoaming"], soajs);
					let userTenant = BL.common.checkUserTenantAccess(record, soajs.tenant, soajs.log, autoRoaming);
					if (!userTenant) {
						modelUserObj.closeConnection();
						return cb({"code": 403, "msg": driverConfig.errors[403]});
					}
					if (userTenant.groups && Array.isArray(userTenant.groups) && userTenant.groups.length !== 0) {
						record.groups = userTenant.groups;
						record.tenant = userTenant.tenant;
						//Get Groups config
						// let modelGroupObj = new SSOT.group(soajs);
						let modelGroupObj = null;
						if (SSOT.groupModelObj) {
							modelGroupObj = SSOT.groupModelObj;
						} else {
							modelGroupObj = new SSOT.group(soajs);
						}
						let data = {
							"groups": record.groups
						};
						BL.group.find(soajs, data, modelGroupObj, function (error, groups) {
							modelGroupObj.closeConnection();
							if (error) {
								modelUserObj.closeConnection();
								return cb(error);
							}
							if (groups && Array.isArray(groups) && groups.length !== 0) {
								record.groupsConfig = groups;
							}
							returnUser(record);
						});
					} else {
						returnUser(record);
					}
					
					function returnUser(record) {
						modelUserObj.closeConnection();
						BL.user.assureConfig(record, (error, record) => {
							return cb(null, record);
						});
					}
				});
			}
		});
	},
	
	/**
	 * Save user profile to database
	 *
	 * @param soajs
	 * @param input
	 * @param cb
	 */
	"saveUser": function (soajs, input, cb) {
		initBLModel(soajs, function (error) {
			if (error) {
				return cb(error);
			}
			// let modelUserObj = new SSOT.user(soajs);
			let modelUserObj = null;
			if (SSOT.userModelObj) {
				modelUserObj = SSOT.userModelObj;
			} else {
				modelUserObj = new SSOT.user(soajs);
			}
			BL.user.save(soajs, input, modelUserObj, (error, record) => {
				
				if (record && record.status === "active") {
					
					let returnUser = (record) => {
						modelUserObj.closeConnection();
						BL.user.assureConfig(record, (error, record) => {
							return cb(null, record);
						});
					};
					
					let autoRoaming = get(["registry", "custom", "urac", "value", "autoRoaming"], soajs);
					let userTenant = BL.common.checkUserTenantAccess(record, soajs.tenant, soajs.log, autoRoaming);
					if (!userTenant) {
						modelUserObj.closeConnection();
						return cb({"code": 403, "msg": driverConfig.errors[403]});
					}
					if (userTenant.groups && Array.isArray(userTenant.groups) && userTenant.groups.length !== 0) {
						record.groups = userTenant.groups;
						record.tenant = userTenant.tenant;
						//Get Groups config
						// let modelGroupObj = new SSOT.group(soajs);
						let modelGroupObj = null;
						if (SSOT.groupModelObj) {
							modelGroupObj = SSOT.groupModelObj;
						} else {
							modelGroupObj = new SSOT.group(soajs);
						}
						let data = {
							"groups": record.groups
						};
						BL.group.find(soajs, data, modelGroupObj, function (error, groups) {
							modelGroupObj.closeConnection();
							if (error) {
								modelUserObj.closeConnection();
								return cb(error);
							}
							if (groups && Array.isArray(groups) && groups.length !== 0) {
								record.groupsConfig = groups;
							}
							returnUser(record);
						});
					} else {
						returnUser(record);
					}
					
				} else if (record && (record.status === "pendingNew" || record.status === "pendingJoin")) {
					modelUserObj.closeConnection();
					soajs.log.error("User [" + record.username + "] status is " + record.status);
					return cb({"code": 405, "msg": driverConfig.errors[405]});
				} else if (record && record.status === "inactive") {
					modelUserObj.closeConnection();
					soajs.log.error("User [" + record.username + "] status is " + record.status);
					return cb({"code": 406, "msg": driverConfig.errors[406]});
				} else {
					modelUserObj.closeConnection();
					return cb({"code": 403, "msg": driverConfig.errors[403]});
				}
				
				/*
				modelUserObj.closeConnection();
				return cb(error, record);
				*/
			});
		});
	}
};

/**
 * Initialize the Business Logic model for user and group
 *
 * @param soajs
 * @param cb
 * @returns {*}
 */
function initBLModel(soajs, cb) {
	if (driver.modelInit) {
		return cb(null);
	}
	
	let masterCode = get(["registry", "custom", "urac", "value", "masterCode"], soajs);
	
	let userModel = __dirname + "/model/" + model + "/user.js";
	if (fs.existsSync(userModel)) {
		SSOT.user = require(userModel);
		SSOT.userModelObj = null;
		// if (masterCode) {
		// 	SSOT.userModelObj = new SSOT.user(soajs);
		// }
	}
	let groupModel = __dirname + "/model/" + model + "/group.js";
	if (fs.existsSync(groupModel)) {
		SSOT.group = require(groupModel);
		SSOT.groupModelObj = null;
		// if (masterCode) {
		// 	SSOT.groupModelObj = new SSOT.group(soajs);
		// }
	}
	if (SSOT.user && SSOT.group) {
		driver.modelInit = true;
		return cb(null);
	} else {
		soajs.log.error('Requested model not found. make sure you have a model for user and another one for group!');
		return cb({"code": 601, "msg": driverConfig.errors[601]});
	}
}

module.exports = driver;