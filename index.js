'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const fs = require("fs");

const coreModule = require("soajs.core.modules");
const soajsValidator = coreModule.core.validator;
const driverConfig = require('./config.js');

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
			let modelUserObj = new SSOT.user(soajs);
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
				let userTenant = BL.common.checkUserTenantAccess(record, soajs.tenant);
				if (!userTenant) {
					modelUserObj.closeConnection();
					return cb({"code": 403, "msg": driverConfig.errors[403]});
				}
				if (userTenant.groups && Array.isArray(userTenant.groups) && userTenant.groups.length !== 0) {
					record.groups = userTenant.groups;
					record.tenant = userTenant.tenant;
					//Get Groups config
					let modelGroupObj = new SSOT.group(soajs);
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
					BL.user.assureConfig(record);
					return cb(null, record);
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
			let modelUserObj = new SSOT.user(soajs);
			let data = {};
			let pattern = soajsValidator.SchemaPatterns.email;
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
				BL.common.comparePasswd(soajs.servicesConfig, input.password, record.password, myConfig, (err, response) => {
					if (err || !response) {
						soajs.log.error(err);
						modelUserObj.closeConnection();
						return cb({"code": 402, "msg": driverConfig.errors[402]});
					}
					delete record.password;
					delete record.socialId;
					let userTenant = BL.common.checkUserTenantAccess(record, soajs.tenant);
					if (!userTenant) {
						modelUserObj.closeConnection();
						return cb({"code": 403, "msg": driverConfig.errors[403]});
					}
					if (userTenant.groups && Array.isArray(userTenant.groups) && userTenant.groups.length !== 0) {
						record.groups = userTenant.groups;
						record.tenant = userTenant.tenant;
						//Get Groups config
						let modelGroupObj = new SSOT.group(soajs);
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
						BL.user.assureConfig(record);
						return cb(null, record);
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
			let modelUserObj = new SSOT.user(soajs);
			let data = {};
			if (input.username) {
				data.username = input.username;
				resume();
			} else if (input.id) {
				data.id = input.id;
				modelUserObj.validateId(data, (err, _id) => {
					if (err) {
						modelUserObj.closeConnection();
						soajs.log.error(err);
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
					let userTenant = BL.common.checkUserTenantAccess(record, soajs.tenant);
					if (!userTenant) {
						modelUserObj.closeConnection();
						return cb({"code": 403, "msg": driverConfig.errors[403]});
					}
					if (userTenant.groups && Array.isArray(userTenant.groups) && userTenant.groups.length !== 0) {
						record.groups = userTenant.groups;
						record.tenant = userTenant.tenant;
						//Get Groups config
						let modelGroupObj = new SSOT.group(soajs);
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
						BL.user.assureConfig(record);
						return cb(null, record);
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
			let modelUserObj = new SSOT.user(soajs);
			BL.user.save(soajs, input, modelUserObj, (error, record) => {
				modelUserObj.closeConnection();
				return cb(error, record);
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
	let modelName = driverConfig.model;
	if (soajs.servicesConfig && soajs.servicesConfig.urac && soajs.servicesConfig.urac.model) {
		modelName = soajs.servicesConfig.urac.model;
	}
	let userModel = __dirname + "/model/" + modelName + "/user.js";
	if (fs.existsSync(userModel)) {
		SSOT.user = require(userModel);
	}
	let groupModel = __dirname + "/model/" + modelName + "/group.js";
	if (fs.existsSync(groupModel)) {
		SSOT.group = require(groupModel);
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