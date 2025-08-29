const pool = require("./pool");

async function getAllUsernames() {
  const { rows } = await pool.query("SELECT * FROM usernames");
  return rows;
}

async function insertUsername(username) {
  await pool.query("INSERT INTO usernames (username) VALUES ($1)", [username]);
}

async function getRecord(mode){
  let name;
  if (mode === 'endless' || mode === 'five' || mode === 'ten' || mode === 'twenty' || mode === 'fifteen') name = mode;

  const queryText = `SELECT * FROM ${name} ORDER BY level DESC, time ASC LIMIT 5`;
  const { rows } = await pool.query(queryText);
  return rows;
}

async function addTime(mode, username, level, time){
  const queryText = `INSERT INTO ${mode} (username, level, time) VALUES ($1, $2, $3)`;
  await pool.query(queryText,  [username, level, time]);
}

module.exports = {
  getAllUsernames,
  insertUsername,
  getRecord, 
  addTime
};
