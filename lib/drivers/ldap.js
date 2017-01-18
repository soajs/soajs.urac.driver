"use strict";

var lib = {
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