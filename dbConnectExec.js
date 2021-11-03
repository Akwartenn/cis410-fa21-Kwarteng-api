const sql = require("mssql");
const akwartenConfig = require("./config.js"); 


const config = {
  user: akwartenConfig.DB.user,
  password: akwartenConfig.DB.password,
  server: akwartenConfig.DB.server, // You can use 'localhost\\instance' to connect to named instance
  database: akwartenConfig.DB.database,
};
async function executeQuery(aQuery) {
  let connection = await sql.connect(config);
  let result = await connection.query(aQuery);

   return result.recordset

}

// executeQuery(`select * 
// FROM Room

// left join Hotel
// on Hotel.HotelPK = Room.HotelFK`);

module.exports = {executeQuery: executeQuery}


