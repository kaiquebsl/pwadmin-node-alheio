const mysql = require('mysql2');

const db = mysql.createPool({//alterar pra .env, quando tiver empenho
    host: "localhost",
    user: "root",
    password: "senha",
    database: "pw",
    charset: 'utf8mb4',
})

db.getConnection( (err, connection)=> { if (err) throw (err)
    console.log ("DB connected sucessful: " + connection.threadId)})

module.exports = db;