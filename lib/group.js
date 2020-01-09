'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const driverConfig = require('./../config.js');

let bl = {

    /**
     * FInd groups
     *
     * @param soajs
     * @param inputmaskData
     * @param model
     * @param cb
     */
    "find": (soajs, inputmaskData, modelObj, cb) => {
        let data = {};
        data.groups = inputmaskData.groups;
        modelObj.getGroups(data, (err, records) => {
            if (err) {
                soajs.log.error(err);
                return cb({"code": 400, "msg": driverConfig.errors[400] + " - " + err.message});
            }
            return cb(null, records);
        });
    }

};


module.exports = bl;