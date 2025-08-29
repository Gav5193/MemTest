const { Pool } = require("pg");

// All of the following properties should be read from environment variables
// We're hardcoding them here for simplicity
module.exports = new Pool({
  host: "http://172.105.104.94/", // or wherever the db is hosted
  user: "gavin",
  database: "memtest",
  password: "Gg1096583!",
  port: 5432 // The default port
});