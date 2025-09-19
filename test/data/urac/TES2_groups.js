let provDb = db.getSiblingDB('TES2_urac');
load('./TES2_groups/groups.js');
provDb.groups.drop();
provDb.groups.insertMany(records);