const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Cart (
                id VARCHAR(36) PRIMARY KEY,
                userId VARCHAR(36) NOT NULL,
                itemId VARCHAR(36) NOT NULL,
                startDate DATE NOT NULL,
                endDate DATE NOT NULL,
                totalCost DECIMAL(10,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Cart table created");
    } catch(err) { console.log(err); }
    await connection.end();
}
createTable();
