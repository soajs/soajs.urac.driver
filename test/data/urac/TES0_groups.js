let provDb = db.getSiblingDB('TES0_urac');
load('./TES0_groups/groups.js');
provDb.groups.drop();
provDb.groups.insert(records);