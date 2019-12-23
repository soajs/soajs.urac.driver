"use strict";

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
            "socialId": {},
            "tenant": {
                "id": soajs.tenant.id,
                "code": soajs.tenant.code
            },
            "lastLogin": new Date().getTime()
        };

        userRecord.socialId[mode] = {
            ts: new Date().getTime(),
            "id": user.id
        };

        let data = {};
        data.id = user.id;
        data.mode = mode;
        if (user.email)
            data.email = user.email;
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
                    record.socialId[mode] = {
                        ts: new Date().getTime()
                    };
                }

                record.socialId[mode].id = user.id;
                if (user.accessToken) {
                    record.socialId[mode].accessToken = user.accessToken;
                }
                if (user.refreshToken) { // first time application authorized
                    record.socialId[mode].refreshToken = user.refreshToken;
                }

                // Update record
                record.username = userRecord.username;
                record.password = userRecord.password;
                record.firstName = userRecord.firstName;
                record.lastName = userRecord.lastName;
                record.lastLogin = userRecord.lastLogin;

                modelObj.updateSocialNetworkUser(record, (err, response) => {
                    if (err) {
                        soajs.log.error(err);
                        return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
                    }
                    return cb(null, record);
                });
            } else {
                if (user.accessToken) {
                    userRecord.socialId[mode].accessToken = user.accessToken;
                }
                if (user.refreshToken) { // first time application authorized
                    userRecord.socialId[mode].refreshToken = user.refreshToken;
                }

                modelObj.insertSocialNetworkUser(userRecord, (err, record) => {
                    if (err) {
                        soajs.log.error(err);
                        return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
                    }
                    if (record && Array.isArray(record))
                        record = record[0];
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
                if (record && record.status === "active")
                    return cb(null, record);
                return cb(null, null);
            });
        } else if (inputmaskData.email) {
            data.email = inputmaskData.email;
            modelObj.getUserByEmail(data, (err, record) => {
                if (err) {
                    soajs.log.error(err);
                    return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
                }
                if (record && record.status === "active")
                    return cb(null, record);
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
                if (record && record.status === "active")
                    return cb(null, record);
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
     * Find user record by ID or username as well as assure ID
     *
     * @param soajs
     * @param inputmaskData
     * @param modelObj
     * @param cb
     */
    /*
    "findByIdOrUsername": (soajs, inputmaskData, modelObj, cb) => {
        if (!inputmaskData.id && !inputmaskData.username) {
            return cb({"code": 400, "msg": driverConfig.errors[400] + " - id or username is required."});
        }
        let data = {};
        if (inputmaskData.username)
            data.username = inputmaskData.username;
        else if (inputmaskData.id){
            data.id = inputmaskData.id;
        }
            modelObj.getUserByUsernameOrId(data, (err, record) => {
                if (err) {
                    soajs.log.error(err);
                    return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
                }
                return cb(null, record);
            });
    },
    */
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