"use strict";
const colName = "users";
const core = require("soajs.core.modules");
const Mongo = core.mongo;

let indexing = {};

function User(soajs, mongoCore) {
    let __self = this;
    if (mongoCore) {
        __self.mongoCore = mongoCore;
    }
    if (!__self.mongoCore) {
        let tCode = soajs.tenant.code;
        let tenantMetaDB = soajs.registry.tenantMetaDB;
        let tId = soajs.tenant.id;
        if (soajs.tenant.roaming) {
            if (soajs.tenant.roaming.code) {
                tCode = soajs.tenant.roaming.code;
                tId = soajs.tenant.roaming.id;
            }
            if (soajs.tenant.roaming.tenantMetaDB) {
                tenantMetaDB = soajs.tenant.roaming.tenantMetaDB;
            }
        } else if (soajs.tenant.main && soajs.tenant.main.code) {
            tCode = soajs.tenant.main.code;
            tId = soajs.tenant.main.id;
        }
        __self.mongoCore = new Mongo(soajs.meta.tenantDB(tenantMetaDB, "urac", tCode));
        if (indexing && tId && !indexing[tId]) {
            indexing[tId] = true;
            __self.mongoCore.createIndex(colName, {"username": 1}, {unique: true}, function () {
            });
            __self.mongoCore.createIndex(colName, {"email": 1}, {unique: true}, function () {
            });
            __self.mongoCore.createIndex(colName,
                {
                    "config.allowedTenants.tenant.pin.code": 1,
                    "config.allowedTenants.tenant.id": 1
                },
                {
                    unique: true,
                    partialFilterExpression: {
                        "config.allowedTenants.tenant.pin.code": {
                            "$exists": true
                        }
                    }
                }
            );
            __self.mongoCore.createIndex(colName,
                {
                    "tenant.pin.code": 1,
                    "tenant.id": 1
                },
                {
                    unique: true,
                    partialFilterExpression: {
                        "tenant.pin.code": {
                            "$exists": true
                        }
                    }
                }
            );
            //TODO: missing index for socialId.facebook.id

            soajs.log.debug("Indexes @ " + colName + " for " + tCode + "_urac Updated!");
        }
    }
}

/**
 * To validate and convert an id to mongodb objectID
 *
 * @param data
 *  should have:
 *      required (id)
 *
 * @param cb
 */
User.prototype.validateId = function (data, cb) {
    let __self = this;
    try {
        let _id = __self.mongoCore.ObjectId(data.id);
        return cb(null, _id);
    } catch (err) {
        return cb(err);
    }
};

/**
 * To set last login
 *
 * @param data
 *  should have:
 *      required (id, name)
 *      optional (config, description)
 *
 * @param cb
 */
User.prototype.lastLogin = function (data, cb) {
    let __self = this;
    if (!data || !data.username || !data.lastLogin) {
        let error = new Error("username and lastLogin are required.");
        return cb(error, null);
    }
    let s = {
        '$set': {
            'lastLogin': data.lastLogin
        }
    };
    let condition = {'username': data.username};
    let extraOptions = {};
    __self.mongoCore.update(colName, condition, s, extraOptions, (err, record) => {
        return cb(err, record);
    });
};

/**
 * To get the record of a user logged in via social network driver
 *
 * @param data
 *  should have:
 *      required (id, mode)
 *      optional (email)
 *
 * @param cb
 */
User.prototype.getSocialNetworkUser = function (data, cb) {
    let __self = this;
    if (!data || (!data.id && !data.mode)) {
        let error = new Error("id and mode are required.");
        return cb(error, null);
    }
    let e = null;
    if (data.email) {
        e = {};
        e['email'] = data.email;
    }
    let c = {};
    c['socialId.' + data.mode + '.id'] = data.id;

    let condition = {};
    if (c && e) {
        condition = {
            $or: [c, e]
        };
    }
    else {
        condition = c;
    }
    __self.mongoCore.findOne(colName, condition, null, null, (err, record) => {
        return cb(err, record);
    });
};


/**
 * To save a record of a user logged in via social network driver
 *
 * @param data
 *  should have:
 *      required (record)
 *      if _id is in the record then it is going to be save
 *      if _id is not in the record then it is going to insert
 *
 * @param cb
 */
/*
User.prototype.saveSocialNetworkUser = function (data, cb) {
    let __self = this;
    if (!data || !data.socialId) {
        let error = new Error("user record with socialId is required.");
        return cb(error, null);
    }

    __self.mongoCore.save(colName, data, (err, record) => {
        return cb(err, record);
    });
};
*/
/**
 * To update a record of a user logged in via social network driver
 *
 * @param data
 *  should have:
 *      required (record)
 *
 * @param cb
 */

User.prototype.updateSocialNetworkUser = function (data, cb) {
    let __self = this;
    if (!data || !data.socialId || !data._id) {
        let error = new Error("user record and _id are required.");
        return cb(error, null);
    }

    let condition = {'_id': data._id};
    __self.mongoCore.update(colName, condition, data, {}, (err, record) => {
        return cb(err, record);
    });
};

/**
 * To insert a record of a user logged in via social network driver
 *
 * @param data
 *  should have:
 *      required (record)
 *
 * @param cb
 */

User.prototype.insertSocialNetworkUser = function (data, cb) {
    let __self = this;
    if (!data || !data.socialId) {
        let error = new Error("user record is required.");
        return cb(error, null);
    }

    __self.mongoCore.insert(colName, data, (err, record) => {
        return cb(err, record);
    });
};

/**
 * To get a user by username and status
 *
 * @param data
 *  should have:
 *      required (username)
 *
 * @param cb
 */
/*
User.prototype.getUserByUsername = function (data, cb) {
    let __self = this;
    if (!data || !data.username) {
        let error = new Error("username and status are required.");
        return cb(error, null);
    }
    let condition = {
        'username': data.username
    };
    __self.mongoCore.findOne(colName, condition, null, null, (err, records) => {
        return cb(err, records);
    });
};
*/
/**
 * To get a user by email and status
 *
 * @param data
 *  should have:
 *      required (email)
 *
 * @param cb
 */
User.prototype.getUserByEmail = function (data, cb) {
    let __self = this;
    if (!data || !data.email) {
        let error = new Error("email and status are required.");
        return cb(error, null);
    }
    let condition = {
        'email': data.email
    };
    __self.mongoCore.findOne(colName, condition, null, null, (err, records) => {
        return cb(err, records);
    });
};

/**
 * To get a user by username or id
 *
 * @param data
 *  should have:
 *      required (email or id)
 *
 * @param cb
 */
User.prototype.getUserByUsernameOrId = function (data, cb) {
    let __self = this;
    if (!data || (!data.id && !data.username)) {
        let error = new Error("id or username is required.");
        return cb(error, null);
    }
    let condition = {};
    if (data.id)
        condition = {'_id': data.id};
    else if (data.username)
        condition = {'username': data.username};

    __self.mongoCore.findOne(colName, condition, null, null, (err, record) => {
        return cb(err, record);
    });
};

/**
 * To get a user by pin and status
 *
 * @param data
 *  should have:
 *      required (pin, status)
 *
 * @param cb
 */

User.prototype.getUserByPin = function (data, cb) {
    let __self = this;
    if (!data || (!data.pin && !data.tId)) {
        let error = new Error("pin and tId are required.");
        return cb(error, null);
    }
    let condition = {
        $or: [
            {$and: [{'tenant.pin.code': data.pin}, {'tenant.id': data.tId}]},
            {"config.allowedTenants": {"$elemMatch": {$and: [{'tenant.pin.code': data.pin}, {'tenant.id': data.tId}]}}}
        ]
    };
    __self.mongoCore.findOne(colName, condition, null, null, (err, record) => {
        return cb(err, record);
    });
};

/**
 * To close all opened mongoDB connection
 *
 */
User.prototype.closeConnection = function () {
    let __self = this;

    __self.mongoCore.closeDb();
};

module.exports = User;