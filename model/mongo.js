"use strict";
var core = require("soajs");
var Mongo = core.mongo;

module.exports = {
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
	
	"closeConnection": function (soajs) {
		soajs.mongoDb.closeDb();
	},
	
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
	
	"findEntries": function (soajs, combo, cb) {
		soajs.mongoDb.find(combo.collection, combo.condition || {}, combo.fields || null, combo.options || null, cb);
	},
	
	"findEntry": function (soajs, combo, cb) {
		soajs.mongoDb.findOne(combo.collection, combo.condition || {}, combo.fields || null, combo.options || null, cb);
	},
	
	"saveEntry": function (soajs, combo, cb) {
		soajs.mongoDb.save(combo.collection, combo.record, cb);
	},
	
	"insertEntry": function (soajs, combo, cb) {
		soajs.mongoDb.insert(combo.collection, combo.record, cb);
	},
	
	"updateEntry": function (soajs, combo, cb) {
		//combo.extraOptions = {'upsert': true}
		soajs.mongoDb.update(combo.collection, combo.condition, combo.updatedFields, combo.extraOptions || {}, cb);
	}
	
};