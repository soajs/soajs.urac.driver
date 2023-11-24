'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const get = (p, o) => p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, o);

const colName = "groups";
const core = require("soajs.core.modules");
const Mongo = core.mongo;

function Group(soajs, mongoCore) {
	let __self = this;
	__self.keepConnectionAlive = false;
	if (mongoCore) {
		__self.mongoCore = mongoCore;
	}
	if (soajs.tenant && soajs.tenant.id) {
		__self.tenantId = soajs.tenant.id;
	}
	if (!__self.mongoCore) {
		let tCode = soajs.tenant.code;

		let masterDB = get(["registry", "custom", "urac", "value", "masterDB"], soajs);
		if (masterDB) {
			if (!soajs.registry.coreDB[masterDB]) {
				soajs.log.error("Group: Unable to find [" + masterDB + "] db configuration under registry.");
			}
			tCode = masterDB;
			__self.mongoCore = new Mongo(soajs.registry.coreDB[masterDB]);
		} else {
			let tenantMetaDB = soajs.registry.tenantMetaDB;
			if (soajs.tenant.roaming) {
				if (soajs.tenant.roaming.id) {
					__self.tenantId = soajs.tenant.roaming.id;
				}
				if (soajs.tenant.roaming.code) {
					tCode = soajs.tenant.roaming.code;
				}
				if (soajs.tenant.roaming.tenantMetaDB) {
					tenantMetaDB = soajs.tenant.roaming.tenantMetaDB;
				}
			} else {
				let masterCode = get(["registry", "custom", "urac", "value", "masterCode"], soajs);
				if (masterCode) {
					tCode = masterCode;
					__self.keepConnectionAlive = true;
				} else {
					let dbCodes = get(["registry", "custom", "urac", "value", "dbCodes"], soajs);
					if (dbCodes) {
						for (let c in dbCodes) {
							if (dbCodes.hasOwnProperty(c)) {
								if (dbCodes[c].includes(tCode)) {
									tCode = c;
									break;
								}
							}
						}
					}
				}
			}
			__self.mongoCore = new Mongo(soajs.meta.tenantDB(tenantMetaDB, "urac", tCode));
		}

		//NOTE: indexing is under soajs.urac 
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
		"tenant.id": __self.tenantId,
		"code": {
			"$in": data.groups
		}
	};
	__self.mongoCore.find(colName, condition, null, (err, records) => {
		return cb(err, records);
	});
};

/**
 * To close all opened mongoDB connection
 *
 */
Group.prototype.closeConnection = function () {
	let __self = this;
	if (!__self.keepConnectionAlive) {
		__self.mongoCore.closeDb();
	}
};

module.exports = Group;
