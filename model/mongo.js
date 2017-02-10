"use strict";
var core = require("soajs");
var Mongo = core.mongo;

module.exports = {
	/**
	 * Initialize the mongo connection
	 * @param {SOAJS Object} soajs
	 */
	"initConnection": function (soajs) {
		if (soajs.inputmaskData.isOwner) {
			soajs.mongoDb = new Mongo(soajs.meta.tenantDB(soajs.registry.tenantMetaDB, 'urac', soajs.inputmaskData.tCode));
		}
		else {
			var tcode = soajs.tenant.code;
			if (soajs.tenant.roaming && soajs.tenant.roaming.code) {
				tcode = soajs.tenant.roaming.code;
			}
			var tenantMetaDB = soajs.registry.tenantMetaDB;
			if (soajs.tenant.roaming && soajs.tenant.roaming.tenantMetaDB) {
				tenantMetaDB = soajs.tenant.roaming.tenantMetaDB;
			}
			
			var config = soajs.meta.tenantDB(tenantMetaDB, 'urac', tcode);
			soajs.mongoDb = new Mongo(config);
		}
	},

	/**
	 * Close the mongo connection
	 * @param {SOAJS Object} soajs
	 */
	"closeConnection": function (soajs) {
		soajs.mongoDb.closeDb();
	},

	/**
	 * Validates the mongo object ID
	 * @param {Request Object} req
	 * @param {Callback Function} cb
	 */
	"validateId": function (soajs, id) {
		var id1;
		try {
			id1 = soajs.mongoDb.ObjectId(id);
			return id1;
		}
		catch (e) {
			soajs.log.error(e);
			throw e;
		}
	},
	
	/**
	 * Find multiple entries based on a condition
	 * @param {SOAJS Object} soajs
	 * @param {Object} combo
	 * @param {Callback Function} cb
	 */
	"findEntries": function (soajs, combo, cb) {
		soajs.mongoDb.find(combo.collection, combo.condition || {}, combo.fields || null, combo.options || null, cb);
	},

	/**
	 * Find one entry based on a condition
	 * @param {SOAJS Object} soajs
	 * @param {Object} combo
	 * @param {Callback Function} cb
	 */
	"findEntry": function (soajs, combo, cb) {
		soajs.mongoDb.findOne(combo.collection, combo.condition || {}, combo.fields || null, combo.options || null, cb);
	},

	/**
	 * Save an entry in the database
	 * @param {SOAJS Object} soajs
	 * @param {Object} combo
	 * @param {Callback Function} cb
	 */
	"saveEntry": function (soajs, combo, cb) {
		soajs.mongoDb.save(combo.collection, combo.record, cb);
	},

	/**
	 * Insert a new entry in the database
	 * @param {SOAJS Object} soajs
	 * @param {Object} combo
	 * @param {Callback Function} cb
	 */
	"insertEntry": function (soajs, combo, cb) {
		soajs.mongoDb.insert(combo.collection, combo.record, cb);
	},

	/**
	 * Update an entry in the database
	 * @param {SOAJS Object} soajs
	 * @param {Object} combo
	 * @param {Callback Function} cb
	 */
	"updateEntry": function (soajs, combo, cb) {
		//combo.extraOptions = {'upsert': true}
		soajs.mongoDb.update(combo.collection, combo.condition, combo.updatedFields, combo.extraOptions || {}, cb);
	}
	
};