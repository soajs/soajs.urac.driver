'use strict';

var lib = {
  /**
   * Map YP SSO user returned to SOAJS profile correspondingly
   *
   * @param {Object} user
   * @param {Callback(error object, profile object) Function} cb
   */
  'mapProfile': function (record, cb) {

    var profile = {
      password: '',
      groups: []
    };

    [
      { field: 'sAMAccountName', mapTo: 'id' },
      { field: 'sAMAccountName', mapTo: 'username' },
      { field: 'mail', mapTo: 'email' },
      { field: 'givenname', mapTo: 'firstName' },
      { field: 'sn', mapTo: 'lastName' } ].forEach(function (param) {

      var attributes = record.attributes;

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