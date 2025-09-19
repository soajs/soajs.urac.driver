#!/bin/bash

pushd ./urac
mongosh ./TES0_groups.js
mongosh ./TES1_groups.js
mongosh ./TES2_groups.js

mongosh ./TES0_users.js
popd