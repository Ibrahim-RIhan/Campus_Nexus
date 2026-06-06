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
        await connection.query('ALTER TABLE Item ADD COLUMN latitude DECIMAL(10, 8) DEFAULT 40.7128');
        await connection.query('ALTER TABLE Item ADD COLUMN longitude DECIMAL(11, 8) DEFAULT -74.0060');
        console.log("Item table altered for maps");
    } catch(err) { console.log(err); }
    await connection.end();
}
alterTable();
