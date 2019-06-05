let provDb = db.getSiblingDB('TES0_urac');
load('./TES0_users/users.js');
provDb.users.drop();
provDb.users.insert(records);