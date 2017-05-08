'use strict';

var lib = {
  /**
   * Map OpenAM user attributes returned to SOAJS profile correspondingly
   *
   * @param {Object} data
   * @param {Callback(error object, profile object) Function} cb
   */
  'mapProfile': function (data, cb) {

    var profile = {
      password: '',
      groups: []
    };

    data.attributesMap.forEach(function (param) {

      var attributes = data.userRecord.attributes;

      if (Array.isArray(attributes)) {
        attributes.filter(function (attr) {
          return attr.name === param.field;
        }).forEach(function (attr) {
          profile[ param.mapTo ] = attr.values[ 0 ];
        });
      }

      if (profile[ param.mapTo ] == null) {
        profile[ param.mapTo ] = '';
      }
    });

    return cb(null, profile);
  }
};

module.exports = lib;