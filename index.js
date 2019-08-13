"use strict";

const fs = require("fs");
const ActiveDirectory = require('activedirectory');
const request = require('request');

const coreModule = require("soajs.core.modules");
const soajsValidator = coreModule.core.validator;
const driverConfig = require('./config.js');

let BL = {
    user: require("./lib/user.js"),
    group: require("./lib/group.js"),
    common: require('./lib/common.js'),
    passport: require('./lib/passport.js')
};
let SSOT = {};

/**
 * Initialize the Business Logic model for user and group
 *
 * @param soajs
 * @param cb
 * @returns {*}
 */
function initBLModel(soajs, cb) {
    if (driver.modelInit)
        return cb(null);
    let modelName = driverConfig.model;
    if (soajs.servicesConfig && soajs.servicesConfig.urac && soajs.servicesConfig.urac.model)
        modelName = soajs.servicesConfig.urac.model;
    let userModel = __dirname + "/model/" + modelName + "/user.js";
    if (fs.existsSync(userModel))
        SSOT.user = require(userModel);
    let groupModel = __dirname + "/model/" + modelName + "/group.js";
    if (fs.existsSync(groupModel))
        SSOT.group = require(groupModel);

    if (SSOT.user && SSOT.group) {
        driver.modelInit = true;
        return cb(null);
    }
    else {
        soajs.log.error('Requested model not found. make sure you have a model for user and another one for group!');
        return cb({"code": 601, "msg": driverConfig.errors[601]});
    }
}

let driver = {
    "modelInit": false,

    /**
     * Initialize passport based on the strategy requested
     *
     * @param req
     * @param cb
     */
    "passportLibInit": function (req, cb) {
        BL.passport.init(req, cb);
    },

    /**
     * Authenticate through passport
     *
     * @param req
     * @param response
     * @param passport
     */
    "passportLibInitAuth": function (req, response, passport, cb) {
        BL.passport.initAuth(req, response, passport, cb);
    },

    /**
     * Get driver, do what is needed before authenticating, and authenticate
     *
     * @param req
     * @param res
     * @param passport
     * @param cb
     */
    "passportLibAuthenticate": function (req, res, passport, cb) {
        let authentication = req.soajs.inputmaskData.strategy;

        BL.passport.getDriver(req, false, function (err, passportDriver) {
            passportDriver.preAuthenticate(req, function () {
                passport.authenticate(authentication, {session: false}, function (err, user) {
                    if (err) {
                        req.soajs.log.error(err);
                        return cb({"code": 720, "msg": driverConfig.errors[720]});
                    }
                    if (!user) {
                        cb({"code": 403, "msg": driverConfig.errors[403]});
                    }

                    req.soajs.inputmaskData.user = user;
                    initBLModel(req.soajs, function (error) {
                        if (error) {
                            return cb(error);
                        }
                        req.soajs.inputmaskData.mode = req.soajs.inputmaskData.strategy;
                        let modelUserObj = new SSOT.user(req.soajs);
                        BL.user.save(req.soajs, req.soajs.inputmaskData, modelUserObj, (error, response) => {
                            modelUserObj.closeConnection();
                            cb(error, response);
                        });
                    });
                })(req, res);
            });
        });
    },

    /**
     * Login by pin code
     *
     * @param soajs
     * @param input
     * @param cb
     */
    "loginByPin": function (soajs, input, cb) {
        initBLModel(soajs, function (error) {
            if (error)
                return cb(error);
            if (!input || !input.pin)
                return cb({"code": 403, "msg": driverConfig.errors[403]});
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
                        if (groups && Array.isArray(groups) && groups.length !== 0)
                            record.groupsConfig = groups;
                        returnUser(record);
                    });
                }
                else {
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
            if (error)
                return cb(error);
            let modelUserObj = new SSOT.user(soajs);
            let data = {};
            let pattern = soajsValidator.SchemaPatterns.email;
            if (!input || !input.username)
                return cb({"code": 403, "msg": driverConfig.errors[403]});
            if (pattern.test(input.username))
                data.email = input.username;
            else
                data.username = input.username;
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
                if (soajs.config)
                    myConfig = soajs.config;
                BL.common.comparePasswd(soajs.servicesConfig.urac, input.password, record.password, myConfig, (err, response) => {
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
                            if (groups && Array.isArray(groups) && groups.length !== 0)
                                record.groupsConfig = groups;
                            returnUser(record);
                        });
                    }
                    else {
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
            }
            else if (input.id) {
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
            }
            else {
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
                            if (groups && Array.isArray(groups) && groups.length !== 0)
                                record.groupsConfig = groups;
                            returnUser(record);
                        });
                    }
                    else {
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
            return cb({"code": 712, "msg": driverConfig.errors[712]});
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
                return cb({"code": 710, "msg": driverConfig.errors[710]});
            }

            if (!response || response.statusCode !== 200) {
                soajs.log.error("OpenAM token invalid!");
                return cb({"code": 711, "msg": driverConfig.errors[711]});
            }

            try {
                userRecord = JSON.parse(body);
            } catch (err) {
                soajs.log.error("OpenAM response invalid!");
                return cb({"code": 713, "msg": driverConfig.errors[713]});
            }

            soajs.log.debug('Authenticated!');

            initBLModel(soajs, function (error) {
                if (error) {
                    return cb(error);
                }
                let modelUserObj = new SSOT.user(soajs);
                BL.user.save(soajs, {
                    "user": {
                        userRecord: userRecord,
                        attributesMap: openamAttributesMap
                    }, "mode": "openam"
                }, modelUserObj, (error, record) => {
                    modelUserObj.closeConnection();
                    return cb(error, record);
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
            return cb({"code": 706, "msg": driverConfig.errors[706]});
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
                    return cb({"code": 700, "msg": driverConfig.errors[700]});
                }
                if (err.lde_message) {
                    if (err.lde_message.includes('Incorrect DN given')) { // invalid admin username
                        soajs.log.error("Incorrect DN given!");
                        return cb({"code": 701, "msg": driverConfig.errors[701]});
                    }

                    if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(adminUser)) { // invalid admin credentials (wrong admin password)
                        soajs.log.error("Invalid Admin Credentials");
                        return cb({"code": 702, "msg": driverConfig.errors[702]});
                    }

                    if (err.lde_message.includes('INVALID_CREDENTIALS') && err.lde_message.includes(filter)) { // invalid user credentials (wrong user password)
                        soajs.log.error("Invalid User Credentials");
                        let obj = {"code": 703, "msg": driverConfig.errors[703]};
                        return cb(obj);
                    }
                }

                return cb({"code": 704, "msg": driverConfig.errors[704]});
            }

            if (auth) {
                soajs.log.debug('Authenticated!');

                ad.find(filter, function (err, user) {
                    // since the user is authenticated, no error can be generated in this find call
                    // since we are searching using the filter => we will have one result
                    initBLModel(soajs, function (error) {
                        if (error) {
                            return cb(error);
                        }

                        let modelUserObj = new SSOT.user(soajs);
                        BL.user.save(soajs, {
                            "user": user.other[0],
                            "mode": "ldap"
                        }, modelUserObj, (error, record) => {
                            modelUserObj.closeConnection();
                            return cb(error, record);
                        });
                    });

                });

            }
            else {
                soajs.log.error("Authentication failed.");
                return cb({"code": 705, "msg": driverConfig.errors[705]});
            }
        });
    }
};

module.exports = driver;