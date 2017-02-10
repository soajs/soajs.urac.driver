"use strict";

var lib = {
	/**
	 * Map LDAP user returned to SOAJS profile correspondingly
	 *
	 * @param {User Object} user
	 * @param {Callback(error object, profile object) Function} cb
	 */
	"mapProfile": function (record, cb) {
		
		var profile = {
			id: record.dn,
			firstName: record.cn || "",
			lastName: record.sn || "",
			email: record.mail,
			password: '',
			username: record.dn,
			groups: []
		};
		
		return cb(null, profile);
	}
};

module.exports = lib;