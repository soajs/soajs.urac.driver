"use strict";
const Mongo = require("soajs.core.modules").mongo;

module.exports = {
    /**
     * Initialize the mongo connection
     */
    "initConnection": function (soajs) {
        if (soajs.inputmaskData && soajs.inputmaskData.isOwner) {
            soajs.mongoDb = new Mongo(soajs.meta.tenantDB(soajs.registry.tenantMetaDB, 'urac', soajs.inputmaskData.tCode));
        }
        else {
            let tcode = soajs.tenant.code;
            let tenantMetaDB = soajs.registry.tenantMetaDB;
            let sunTenant_tCode = null;
            if (soajs.tenant.roaming) {
                if (soajs.tenant.roaming.code) {
                    tcode = soajs.tenant.roaming.code;
                }
                if (soajs.tenant.roaming.tenantMetaDB) {
                    tenantMetaDB = soajs.tenant.roaming.tenantMetaDB;
                }
            }
            else if (soajs.tenant.main && soajs.tenant.main.code) {
                sunTenant_tCode = tcode;
                tcode = soajs.tenant.main.code;
            }

            let config = soajs.meta.tenantDB(tenantMetaDB, 'urac', tcode);
            soajs.mongoDb = new Mongo(config);
            if (sunTenant_tCode) {
                let sunTenant_config = soajs.meta.tenantDB(tenantMetaDB, 'urac', sunTenant_tCode);
                soajs.mongoDb_sub = new Mongo(sunTenant_config);
            }
        }
    },

    /**
     * Close the mongo connection
     */
    "closeConnection": function (soajs) {
        soajs.mongoDb.closeDb();
        if (soajs.mongoDb_sub)
            soajs.mongoDb_sub.closeDb();
    },

    /**
     * Validates the mongo object ID
     */
    "validateId": function (soajs, id) {
        let id1;
        try {
            id1 = soajs.mongoDb.ObjectId(id.toString());
            return id1;
        }
        catch (e) {
            soajs.log.error(e);
            throw e;
        }
    },

    /**
     * Find multiple entries based on a condition
     */
    "findEntries": function (soajs, combo, cb) {
        if (combo.collection === "groups" && soajs.mongoDb_sub)
            soajs.mongoDb_sub.find(combo.collection, combo.condition || {}, combo.fields || null, combo.options || null, cb);
        else
            soajs.mongoDb.find(combo.collection, combo.condition || {}, combo.fields || null, combo.options || null, cb);
    },

    /**
     * Find one entry based on a condition
     */
    "findEntry": function (soajs, combo, cb) {
        soajs.mongoDb.findOne(combo.collection, combo.condition || {}, combo.fields || null, combo.options || null, cb);
    },

    /**
     * Save an entry in the database
     */
    "saveEntry": function (soajs, combo, cb) {
        soajs.mongoDb.save(combo.collection, combo.record, cb);
    },

    /**
     * Save an entry in the database
     */
    "updateEntry": function (soajs, combo, cb) {
        soajs.mongoDb.update(combo.collection, combo.condition, combo.whattoupdate, cb);
    },

    /**
     * Insert a new entry in the database
     */
    "insertEntry": function (soajs, combo, cb) {
        soajs.mongoDb.insert(combo.collection, combo.record, cb);
    }
};