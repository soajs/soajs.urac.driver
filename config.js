'use strict';

module.exports = {
    "model": 'mongo',
    "hashIterations": 1024,
    "seedLength": 32,
    "errors": {

        400: "Model error",
        402: "Problem with the provided password",
        403: "Unable to log in the user. User not found",
        404: "Problem with the provided user ID",
        410: "Unable to find passport driver",
        411: "Passport mapProfile error",
        412: "Passport profile is empty",
        420: "Missing serviceConfig for passportLogin",
        601: "Model not found",

        700: "Unable to log in. Ldap connection refused!",
        701: "Unable to log in. Invalid ldap admin user.",
        702: "Unable to log in. Invalid ldap admin credentials.",
        703: "Unable to log in. Invalid ldap user credentials.",
        704: "Unable to log in. Ldap user not found.",
        705: "Unable to log in. Authentication failed.",
        706: "Unable to log in. Missing serviceConfig for ldapServer",

        720: "Unable to authenticated with passport",

        710: "Unable to log in. OpenAM connection error.",
        711: "Unable to log in. OpenAM token invalid.",
        712: "Unable to log in. Missing serviceConfig for openam",
        713: "Unable to log in. General error while parsing response"
    }
};