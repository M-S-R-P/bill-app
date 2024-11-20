const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    password: "qaz",
    host: "localhost",
    port: "5432",
    database: "travel_app_db",
});

module.exports = pool;
