'use strict';

let lib = {
    /**
     * Map OpenAM user attributes returned to SOAJS profile correspondingly
     *
     */
    'mapProfile': function (data, cb) {

        let profile = {
            password: '',
            groups: []
        };

        data.attributesMap.forEach(function (param) {

            let attributes = data.userRecord.attributes;

            if (Array.isArray(attributes)) {
                attributes.filter(function (attr) {
                    return attr.name === param.field;
                }).forEach(function (attr) {
                    profile[param.mapTo] = attr.values[0];
                });
            }

            if (profile[param.mapTo] == null) {
                profile[param.mapTo] = '';
            }
        });

        return cb(null, profile);
    }
};

module.exports = lib;