"use strict";
const coreModule = require("soajs.core.modules");
const soajsValidator = coreModule.core.validator;

const driverConfig = require('./config.js');
const fs = require("fs");
//const merge = require('merge');
const ActiveDirectory = require('activedirectory');

const passportLib = require('./lib/passport.js');

const request = require('request');

/**
 * Initialize the Business Logic model and set it on driver
 */
function initBLModel(soajs, cb) {
    let modelName = driverConfig.model;
    if (soajs.servicesConfig && soajs.servicesConfig.model) {
        modelName = soajs.servicesConfig.model;
    }
    if (process.env.SOAJS_TEST && soajs.inputmaskData && soajs.inputmaskData.model) {
        modelName = soajs.inputmaskData.model;
    }

    let modelPath = __dirname + "/model/" + modelName + ".js";
    return requireModel(modelPath, cb);

    /**
     * checks if model file exists, requires it and returns it.
     * @param filePath
     * @param cb
     */
    function requireModel(filePath, cb) {
        //check if file exist. if not return error
        fs.exists(filePath, function (exists) {
            if (!exists) {
                soajs.log.error('Requested Model Not Found!');
                return cb(601);
            }

            driver.model = require(filePath);
            return cb();
        });
    }

}

function checkUserTenantAccess(record, tenantObj) {
    if (record && record.tenant && tenantObj && tenantObj.id) {
        if (record.tenant.id === tenantObj.id) {
            return true;
        }
        if (record.config && record.config.allowedTenants) {
            if (record.config.allowedTenants[tenantObj.id]) {
                return true;
            }
        }
    }
    return false;
}

function getTenantGroup(record, tenantObj) {
    if (record && record.tenant && tenantObj && tenantObj.id) {
        if (record.tenant.id === tenantObj.id) {
            return ({"groups": record.groups, "tenant": record.tenant});
        }
        if (record.config && record.config.allowedTenants) {
            if (record.config.allowedTenants[tenantObj.id] && record.config.allowedTenants[tenantObj.id].groups) {
                let response = {
                    "groups": record.config.allowedTenants[tenantObj.id].groups,
                    "tenant": {"id": tenantObj.id, "code": tenantObj.code}
                };
                if (record.config.allowedTenants[tenantObj.id].pin)
                    response.tenant.pin = record.config.allowedTenants[tenantObj.id].pin;
                return (response);
            }
        }
    }
    return null;
}

const utilities = require("./lib/helpers.js");

let driver = {
    "model": null,

    /**
     * Initialize passport based on the strategy requested
     *
     */
    "passportLibInit": function (req, cb) {
        passportLib.init(req, cb);
    },

    /**
     * Authenticate through passport
     *
     */
    "passportLibInitAuth": function (req, response, passport) {
        passportLib.initAuth(req, response, passport);
    },

    /**
     * Get driver, do what is needed before authenticating, and authenticate
     *
     */
    "passportLibAuthenticate": function (req, res, passport, cb) {
        let authentication = req.soajs.inputmaskData.strategy;

        passportLib.getDriver(req, false, function (err, passportDriver) {
            passportDriver.preAuthenticate(req, function () {
                passport.authenticate(authentication, {session: false}, function (err, user) {
                    if (err) {
                        req.soajs.log.error(err);
                        return cb({"code": 499, "msg": err.toString()});
                    }
                    if (!user) {
                        cb({"code": 403, "msg": req.soajs.config.errors[403]});
                    }

                    req.soajs.inputmaskData.user = user;
                    initBLModel(req.soajs, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        let mode = req.soajs.inputmaskData.strategy;
                        utilities.saveUser(req.soajs, driver.model, mode, user, function (error, data) {
                            cb(error, data);
                        });
                    });
                })(req, res);

            });
        });

    },


    "loginByPin": function (soajs, data, cb) {
        let criteria = {
            $and: [
                {
                    $or: [
                        {'tenant.pin.code': data.pin},
                        {'config.allowedTenants.tenant.pin.code': data.pin}
                    ]
                },
                {'status': 'active'}
            ]
        };
        initBLModel(soajs, function (err) {
            if (err) {
                return cb(err);
            }
            driver.model.initConnection(soajs);
            utilities.findRecord(soajs, driver.model, criteria, cb, function (record) {
                delete record.password;
                delete record.socialId;
                if (!checkUserTenantAccess(record, soajs.tenant)) {
                    return cb(403);
                }
                let groupInfo = getTenantGroup(record, soajs.tenant);
                if (groupInfo && groupInfo.groups && Array.isArray(groupInfo.groups) && groupInfo.groups.length !== 0) {
                    record.groups = groupInfo.groups;
                    record.tenant = groupInfo.tenant;
                    //Get Groups config
                    utilities.findGroups(soajs, driver.model, record, function (record) {
                        driver.model.closeConnection(soajs);
                        return cb(null, record);
                    });
                }
                else {
                    driver.model.closeConnection(soajs);
                    return cb(null, record);
                }
            });
        });
    },

    /**
     * Verify login credentials and login
     *
     */
    "login": function (soajs, data, cb) {
        let username = data.username;
        let password = data.password;
        let criteria = {
            'username': username,
            'status': 'active'
        };

        let pattern = soajsValidator.SchemaPatterns.email;
        if (pattern.test(username)) {
            delete criteria.username;
            criteria.email = username;
        }

        initBLModel(soajs, function (err) {
            if (err) {
                return cb(err);
            }
            driver.model.initConnection(soajs);
            utilities.findRecord(soajs, driver.model, criteria, cb, function (record) {
                let myConfig = driverConfig;
                if (soajs.config) {
                    myConfig = soajs.config;
                }
                utilities.comparePasswd(soajs.servicesConfig.urac, password, record.password, myConfig, function (err, response) {
                    if (err || !response) {
                        driver.model.closeConnection(soajs);
                        return cb(413);
                    }
                    delete record.password;
                    delete record.socialId;

                    if (!checkUserTenantAccess(record, soajs.tenant)) {
                        return cb(403);
                    }
                    let groupInfo = getTenantGroup(record, soajs.tenant);
                    if (groupInfo && groupInfo.groups && Array.isArray(groupInfo.groups) && groupInfo.groups.length !== 0) {
                        record.groups = groupInfo.groups;
                        record.tenant = groupInfo.tenant;
                        //Get Groups config
                        utilities.findGroups(soajs, driver.model, record, function (record) {
                            driver.model.closeConnection(soajs);
                            return cb(null, record);
                        });
                    }
                    else {
                        driver.model.closeConnection(soajs);
                        return cb(null, record);
                    }

                });

            });
        });
    },

    /**
     * Get logged in record from database
     *
     */
    "getRecord": function (soajs, data, cb) {
        initBLModel(soajs, function (err) {
            if (err) {
                return cb(err);
            }
            driver.model.initConnection(soajs);
            let criteria = null;
            if (!(data.username || data.id)) {
                return cb(411);
            }
            if (data.username) {
                criteria = {
                    'username': data.username
                };
            }
            else {
                let id = null;
                try {
                    id = driver.model.validateId(soajs, data.id);
                    criteria = {
                        '_id': id
                    };
                }
                catch (e) {
                    return cb(411);
                }
            }
            if (!criteria)
                return cb(403);

            utilities.findRecord(soajs, driver.model, criteria, cb, function (record) {
                delete record.password;

                let groupInfo = getTenantGroup(record, soajs.tenant);
                if (groupInfo && groupInfo.groups && Array.isArray(groupInfo.groups) && groupInfo.groups.length !== 0) {
                    record.groups = groupInfo.groups;
                    record.tenant = groupInfo.tenant;
                    utilities.findGroups(soajs, driver.model, record, function (record) {
                        returnUser(record);
                    });
                }
                else {
                    returnUser(record);
                }

                function returnUser(record) {
                    utilities.assureConfig(soajs, record);
                    driver.model.closeConnection(soajs);
                    return cb(null, record);
                }
            });
        });
    },
    /**
     * Login through OpenAM
     *
     * Expects to have openam configuration object under soajs.servicesConfig.urac.
     *
     * Example openam configuration object:
     * {
     *   attributesURL: "https://test.com/openam/identity/json/attributes",
     *   attributesMap: [
     *     { field: 'sAMAccountName', mapTo: 'id' },
     *     { field: 'sAMAccountName', mapTo: 'username' },
     *     { field: 'mail', mapTo: 'email' },
     *     { field: 'givenname', mapTo: 'firstName' },
     *     { field: 'sn', mapTo: 'lastName' }
     *   ],
     *   timeout: 5000
     * }
     *
     */
    "openamLogin": function (soajs, data, cb) {
        let token = data.token;
        let openam;

        if (soajs.servicesConfig.urac && soajs.servicesConfig.urac.openam) {
            openam = soajs.servicesConfig.urac.openam;
        }
        else {
            return cb({"code": 712, "msg": soajs.config.errors[712]});
        }

        let openamAttributesURL = openam.attributesURL;
        let openamAttributesMap = openam.attributesMap;
        let openamTimeout = openam.timeout || 10000;

        request.post(openamAttributesURL, {
            form: {subjectid: token},
            timeout: openamTimeout
        }, function (error, response, body) {
            let userRecord;

            if (error) {
                soajs.log.error(error);
                return cb({"code": 710, "msg": soajs.config.errors[710]});
            }

            if (!response || response.statusCode !== 200) {
                soajs.log.error("OpenAM token invalid!");
                return cb({"code": 711, "msg": soajs.config.errors[711]});
            }

            try {
                userRecord = JSON.parse(body);
            } catch (err) {
                soajs.log.error("OpenAM response invalid!");
                return cb({"code": 712, "msg": soajs.config.errors[712]});
            }

            soajs.log.debug('Authenticated!');

            initBLModel(soajs, function (err) {
                if (err) {
                    return cb(err);
                }
                utilities.saveUser(soajs, driver.model, 'openam', {
                    userRecord: userRecord,
                    attributesMap: openamAttributesMap
                }, function (error, record) {
                    return cb(null, record);
                });
            });
        });
    },

    /**
     * Login through LDAP
     */
    "ldapLogin": function (soajs, data, cb) {
        let username = data.username;
        let password = data.password;
        let ldapServer;

        if (soajs.servicesConfig.urac && soajs.servicesConfig.urac.ldapServer) {
            ldapServer = soajs.servicesConfig.urac.ldapServer;
        }
        else {
            return cb({"code": 706, "msg": soajs.config.errors[706]});
        }
        let host = ldapServer.host;
        let port = ldapServer.port;
        let baseDN = ldapServer.baseDN.replace(new RegExp(' ', 'g'), '');
        let adminUser = ldapServer.adminUser.replace(new RegExp(' ', 'g'), '');
        let adminPassword = ldapServer.adminPassword;
        let url = host + ":" + port;

        let filter = 'uid=' + username;
        let fullFilter = 'uid=' + username + ',' + baseDN;

        let ad = new ActiveDirectory({
            url: url,
            baseDN: baseDN,
            username: adminUser,
            password: adminPassword
        });

        ad.authenticate(fullFilter, password, function (err, auth) {
            if (err) {
                soajs.log.error(err);
                if (err.code && err.code === 'ECONNREFUSED') {
                    soajs.log.error("Connection Refused!");
                    return cb({"code": 700, "msg": soajs.config.errors[700]});
                }
                if (err.lde_message) {
                    if (err.lde_message.includes('Incorrect DN given')) { // invalid admin username
                        soajs.log.error("Incorrect DN given!");
                        return cb({"code": 701, "msg": soajs.config.errors[701]});
                    }

                    if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(adminUser)) { // invalid admin credentials (wrong admin password)
                        soajs.log.error("Invalid Admin Credentials");
                        return cb({"code": 702, "msg": soajs.config.errors[702]});
                    }

                    if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(filter)) { // invalid user credentials (wrong user password)
                        soajs.log.error("Invalid User Credentials");
                        let obj = {"code": 703, "msg": soajs.config.errors[703]};
                        return cb(obj);
                    }
                }

                return cb({"code": 704, "msg": soajs.config.errors[704]});
            }

            if (auth) {
                soajs.log.debug('Authenticated!');

                ad.find(filter, function (err, user) {
                    // since the user is authenticated, no error can be generated in this find call
                    // since we are searching using the filter => we will have one result
                    let userRecord = user.other[0];

                    initBLModel(soajs, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        utilities.saveUser(soajs, driver.model, 'ldap', userRecord, function (error, record) {
                            return cb(null, record);
                        });
                    });

                });

            }
            else {
                soajs.log.error("Authentication failed.");
                return cb({"code": 705, "msg": soajs.config.errors[705]});
            }
        });
    }
};

module.exports = driver;