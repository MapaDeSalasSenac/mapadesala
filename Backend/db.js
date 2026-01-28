// Carregar variaveis do ambiente
require("dotenv").config();

// importar o mysql2
const mysql = require("mysql2");

// criar pool de conexoes
const pool = mysql.createPool({
    host: process.envDB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_password,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// teste de conexão
pool.getConnection((err, connection) => {
    if(err){
        console.error("Erro ao conectar no MySQL: ", err.message);
        return;
    }
    console.log("Conectado com Sucesso! :)");
    connection.release();
});

// exportar o pool
module.exports = pool