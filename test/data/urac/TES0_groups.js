let provDb = db.getSiblingDB('TES0_groups');
load('./TES0_groups/groups.js');
provDb.groups.drop();
provDb.groups.insert(records);