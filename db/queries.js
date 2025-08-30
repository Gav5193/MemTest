const pool = require("./pool");

async function getAllUsernames() {
  const { rows } = await pool.query("SELECT * FROM usernames");
  return rows;
}

async function insertUsername(username) {
  await pool.query("INSERT INTO usernames (username) VALUES ($1)", [username]);
}

async function getRecord(mode, fade, click){
  let name;

  if ( mode === 'five' || mode === 'ten' || mode === 'twenty' || mode === 'fifteen' || mode === 'twentyfive'){
    name = mode;
    if (!fade){
      name += 'nofade'
    }
  }
  else{
    name = mode;
    if (!click){
      name += 'lateclick';
    }
  }

  const queryText = `SELECT * FROM ${name} ORDER BY level DESC, time ASC LIMIT 5`;
  const { rows } = await pool.query(queryText);
  return rows;
}

async function addTime(mode, fade, click, username, level, time){

  let name;

  if ( mode === 'five' || mode === 'ten' || mode === 'twenty' || mode === 'fifteen' || mode === 'twentyfive'){
    name = mode;
    if (!fade){
      name += 'nofade'
    }
  }
  else{
    name = mode;
    if (!click){
      name += 'lateclick';
    }
  }
  const queryText = `INSERT INTO ${name} (username, level, time) VALUES ($1, $2, $3)`;
  await pool.query(queryText,  [username, level, time]);
}

module.exports = {
  getAllUsernames,
  insertUsername,
  getRecord, 
  addTime
};
