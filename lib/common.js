'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const Hasher = require('soajs.core.modules').hasher;
const crypto = require("crypto");

let bl = {
	"comparePasswd": (serviceConfig, pwd, cypher, defaultConfig, cb) => {
		if (!serviceConfig) {
			serviceConfig = {};
		}
		
		let hashConfig = {
			"hashIterations": serviceConfig.hashIterations || defaultConfig.hashIterations
		};
		
		Hasher.init(hashConfig);
		
		if (serviceConfig.optionalAlgorithm && serviceConfig.optionalAlgorithm !== '') {
			let hash = crypto.createHash(serviceConfig.optionalAlgorithm);
			pwd = hash.update(pwd).digest('hex');
		}
		
		Hasher.compare(pwd, cypher, cb);
	},
	
	"checkUserTenantAccess": (record, tenantObj, log) => {
		if (record && record.tenant && tenantObj && tenantObj.id) {
			if (record.tenant.id === tenantObj.id) {
				return ({"groups": record.groups, "tenant": record.tenant});
			}
			if (record.config && record.config.allowedTenants) {
				for (let i = 0; i < record.config.allowedTenants.length; i++) {
					if (record.config.allowedTenants[i].tenant && (record.config.allowedTenants[i].tenant.id === tenantObj.id)) {
						let response = {
							"groups": record.config.allowedTenants[i].groups,
							"tenant": record.config.allowedTenants[i].tenant
						};
						return (response);
					}
				}
			}
			if (tenantObj.roaming) {
				if (record.tenant.id === tenantObj.roaming.tId) {
					return ({"groups": record.groups, "tenant": record.tenant});
				}
			}
			if (log && log.error) {
				log.error("User [" + record.username + "] has no access to tenant [" + tenantObj.id + "]");
			}
		}
		return null;
	}
	
};

module.exports = bl;