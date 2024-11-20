const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "qaz",
  database: "travel_app_db",
  host: "localhost",
  port: "5432",
});

module.exports = pool;