"use strict";

const Hasher = require('soajs.core.modules').hasher;
const crypto = require("crypto");

let bl = {
/*
    "aclEnvObj": (aclObj) => {
        if (aclObj) {
            if (!Object.keys(aclObj).length) {
                return false;
            }
            if (!Object.hasOwnProperty.call(aclObj, 'access') && !Object.hasOwnProperty.call(aclObj, 'apis') && !Object.hasOwnProperty.call(aclObj, 'apisRegExp') && !Object.hasOwnProperty.call(aclObj, 'apisPermission')) {
                return !(aclObj.get || aclObj.post || aclObj.put || aclObj.delete);
            }
        }
        return false;
    },
*/
    "comparePasswd": (servicesConfig, pwd, cypher, config, cb) => {
        let hashConfig = {
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
            let hash = crypto.createHash(servicesConfig.optionalAlgorithm);
            pwd = hash.update(pwd).digest('hex');
        }

        Hasher.compare(pwd, cypher, cb);
    },

    "checkUserTenantAccess": (record, tenantObj) => {
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
        }
        return null;
    }

};

module.exports = bl;