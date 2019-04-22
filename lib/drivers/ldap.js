"use strict";

let lib = {
    /**
     * Map LDAP user returned to SOAJS profile correspondingly
     *
     */
    "mapProfile": function (record, cb) {

        let profile = {
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