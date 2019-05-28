"use strict";


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
                return cb({"code": 400, "msg": soajs.config.errors[400] + " - " + err.message});
            }
            return cb(null, records);
        });
    }

};


module.exports = bl;