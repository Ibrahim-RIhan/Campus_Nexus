const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        await connection.query('ALTER TABLE Rental ADD COLUMN qrSecret VARCHAR(255)');
        await connection.query('ALTER TABLE Rental ADD COLUMN returnQrSecret VARCHAR(255)');
        console.log("Rental table altered");
    } catch(err) { console.log(err); }
    await connection.end();
}
alterTable();
