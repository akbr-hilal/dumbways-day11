const { Pool } = require("pg");

const dbPool = new Pool({
    database: "db_myproject",
    port: "5432",
    user: "postgres",
    password: "kopi",
});

module.exports = dbPool;
