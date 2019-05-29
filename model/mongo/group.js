"use strict";
const colName = "groups";
const core = require("soajs.core.modules");
const Mongo = core.mongo;

let indexing = {};

function Group(soajs, mongoCore) {
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
            __self.mongoCore.createIndex(colName, {"code": 1, "tenant.id": 1}, {unique: true}, () =>{
            });
            soajs.log.debug("Indexes @ " + colName + " for " + tId + " Updated!");
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
Group.prototype.validateId = function (data, cb) {
    let __self = this;
    try {
        let _id = __self.mongoCore.ObjectId(data.id);
        return cb(null, _id);
    } catch (err) {
        return cb(err);
    }
};

/**
 * To get group(s)
 *
 * @param data
 *  should have:
 *      optional (tId)
 *
 * @param cb
 */
Group.prototype.getGroups = function (data, cb) {
    let __self = this;
    if (!data || !data.groups || data.groups.length < 1) {
        let error = new Error("an array of groups is required.");
        return cb(error, null);
    }
    let condition = {
        "code": {
            "$in": data.groups
        }
    };
    if (data.tId) {
        condition["tenant.id"] = data.tId;
    }
    __self.mongoCore.find(colName, condition, null, null, (err, records) => {
        return cb(err, records);
    });
};

/**
 * To close all opened mongoDB connection
 *
 */
Group.prototype.closeConnection = function () {
    let __self = this;

    __self.mongoCore.closeDb();
};

module.exports = Group;