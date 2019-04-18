'use strict';
var Hasher = require('soajs.core.modules').hasher;
var userCollectionName = "users";
var groupsCollectionName = "groups";
//var merge = require('merge');

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
            grpCriteria['tenant.id'] = record.tenant.id;
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
                if (groups && Array.isArray(groups) && groups.length !== 0)
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
        //soajs.log.debug(condition);
        var combo = {
            collection: userCollectionName,
            condition: condition
        };
        model.findEntry(soajs, combo, function (err, record) {
            if (err) {
                soajs.log.error(err);
            }
            if (record) {
                //soajs.log.debug('record:');
                //soajs.log.debug(record);
                return callback(record);
            }
            soajs.log.error('User not Found');
            return mainCb(401);
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
            if (!Object.hasOwnProperty.call(obj, 'access') && !Object.hasOwnProperty.call(obj, 'apis') && !Object.hasOwnProperty.call(obj, 'apisRegExp') && !Object.hasOwnProperty.call(obj, 'apisPermission')) {
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
        if (!urac.config) {
            urac.config = {};
        }

        //Groups ACL
        if (urac.groupsConfig && urac.groupsConfig.length >= 1) {
            // for now we will only take one group
            let group = urac.groupsConfig[0];

            let mergedInfo = {"allowedPackages": {}, "allowedEnvironments": {}};
            if (group.config) {
                if (group.config.allowedPackages) {
                    mergedInfo.allowedPackages = group.config.allowedPackages;
                }
                if (group.config.allowedEnvironments) {
                    mergedInfo.allowedEnvironments = group.config.allowedEnvironments;
                }
                urac.groupsConfig = mergedInfo;
            }
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