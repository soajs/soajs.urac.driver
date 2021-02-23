'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

module.exports = {
	"model": 'mongo',
	"hashIterations": 12,
	"seedLength": 32,
	"errors": {
		
		400: "Model error",
		402: "Unable to log in. Credential error or mismatch",
		403: "Unable to log in. Credential error or mismatch",
		404: "Unable to log in. Credential error or mismatch",
		405: "Unable to log in the user. User has not activated this account",
		406: "Unable to log in the user. User is inactive",
		601: "Model not found"
	}
};