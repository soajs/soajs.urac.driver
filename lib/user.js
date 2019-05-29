"use strict";


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
                return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
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
            return cb({"code": 400, "msg": soajs.config.errors[400] + " - mode and user are required."});
        }
        let mode = inputmaskData.mode;
        let user = inputmaskData.user;
        let filePath = __dirname + "/../lib/drivers/" + mode + ".js";
        let socialNetworkDriver = require(filePath);
        socialNetworkDriver.mapProfile(user, function (err, profile) {
            if (err) {
                soajs.log.error(err);
                return cb({"code": 411, "msg": soajs.config.errors[411] + " - " + err.message});
            }
            if (!profile) {
                return cb({"code": 412, "msg": soajs.config.errors[412]});
            }
            let userRecord = {
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
                },
                "lastLogin": new Date().getTime()
            };

            userRecord.socialId[mode] = {
                ts: new Date().getTime(),
                "id": profile.id
            };

            let data = {};
            data.id = profile.id;
            data.mode = mode;
            if (profile.email)
                data.email = profile.email;
            modelObj.getSocialNetworkUser(data, (err, record) => {
                if (err) {
                    soajs.log.error(err);
                    return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
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

                    modelObj.saveSocialNetworkUser(record, (err, record) => {
                        if (err) {
                            soajs.log.error(err);
                            return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
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

                    modelObj.insertSocialNetworkUser(userRecord, (err, record) => {
                        if (err) {
                            soajs.log.error(err);
                            return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
                        }
                        return cb(null, record);
                    });
                }
            });
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
                    return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
                }
                if (record.status === "active")
                    return cb(null, record);
                return cb(null, null);
            });
        } else if (inputmaskData.email) {
            data.email = inputmaskData.email;
            modelObj.getUserByEmail(data, (err, record) => {
                if (err) {
                    soajs.log.error(err);
                    return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
                }
                if (record.status === "active")
                    return cb(null, record);
                return cb(null, null);
            });
        } else if (inputmaskData.pin) {
            data.pin = inputmaskData.pin;
            modelObj.getUserByPin(data, (err, record) => {
                if (err) {
                    soajs.log.error(err);
                    return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
                }
                if (record.status === "active")
                    return cb(null, record);
                return cb(null, null);
            });
        } else if (inputmaskData.id) {
            data.username = inputmaskData.username;
            modelObj.getUserByUsernameOrId(data, (err, record) => {
                if (err) {
                    soajs.log.error(err);
                    return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
                }
                return cb(null, record);
            });
        }
    },

    /**
     * Find user record by ID or username as well as assure ID
     *
     * @param soajs
     * @param inputmaskData
     * @param modelObj
     * @param cb
     */
    "findByIdOrUsername": (soajs, inputmaskData, modelObj, cb) => {
        if (!inputmaskData.id && !inputmaskData.username) {
            return cb({"code": 400, "msg": soajs.config.errors[400] + " - id or username is required."});
        }
        let data = {};
        if (inputmaskData.username)
            data.username = inputmaskData.username;
        else if (inputmaskData.id){
            data.id = inputmaskData.id;
        }
            modelObj.getUserByUsernameStatus(data, (err, record) => {
                if (err) {
                    soajs.log.error(err);
                    return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
                }
                return cb(null, record);
            });
    },

    /**
     *
     * @param record
     */
    "assureConfig": (record) => {
        if (!record)
            record = {};

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