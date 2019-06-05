let provDb = db.getSiblingDB('TES1_urac');
load('./TES1_groups/groups.js');
provDb.groups.drop();
provDb.groups.insert(records);