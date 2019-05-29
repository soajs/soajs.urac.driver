#!/bin/bash

pushd ./urac
mongo ./TES0_groups.js
mongo ./TES1_groups.js
mongo ./TES2_groups.js
popd