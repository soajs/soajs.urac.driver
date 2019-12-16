'use strict';

module.exports = {
    "model": 'mongo',
    "hashIterations": 12,
    "seedLength": 32,
    "errors": {

        400: "Model error",
        402: "Problem with the provided password",
        403: "Unable to log in the user. User not found",
        404: "Problem with the provided user ID",
        601: "Model not found"
    }
};