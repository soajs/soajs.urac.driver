'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const async = require("async");

let g1 = {
	code: "tata",
	name: "tata",
	tenant: {
		id: "5c0e74ba9acc3c5a84a51259",
		code: "DBTN"
	},
	config: {
		allowedEnvironments: {},
		allowedPackages: {
			DSBRD: [
				"DSBRD_GUEST",
				"DSBRD_OWNER",
				"DSBRD_INTG"
			]
		}
	}
};
let g2 = {
	code: "tata2",
	name: "tata2",
	tenant: {
		id: "5c0e74ba9acc3c5a84a51259",
		code: "DBTN"
	},
	config: {
		allowedEnvironments: {},
		allowedPackages: {
			DSBRD: [
				"DSBRD_GUEST",
				"DSBRD_DEVOP",
				"DSBRD_INTG"
			]
		}
	}
};
let g3 = {
	code: "tata2",
	name: "tata2",
	tenant: {
		id: "5c0e74ba9acc3c5a84a51259",
		code: "DBTN"
	},
	config: {
		allowedEnvironments: {},
		allowedPackages: {
			DSBRD: [
				"DSBRD_GUEST",
				"DSBRD_DEVOP",
				"DSBRD_TONY"
			]
		}
	}
};

let record = {
	"groupsConfig": [
		g1, g2, g3
	]
};
let allowedPackages = {};

async.each(record.groupsConfig, (g, callback) => {
	if (g.config && g.config.allowedPackages) {
		async.eachOf(g.config.allowedPackages, (arrayOfPackages, product, cb) => {
			if (!allowedPackages[product]) {
				allowedPackages[product] = arrayOfPackages;
			} else {
				allowedPackages[product] = [...new Set([...allowedPackages[product], ...arrayOfPackages])];
			}
			return cb();
		});
	}
	return callback();
}, () => {
	console.log(allowedPackages);
});