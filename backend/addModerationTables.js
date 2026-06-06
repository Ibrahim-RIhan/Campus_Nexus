const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Refund (
                id VARCHAR(36) PRIMARY KEY,
                rentalId VARCHAR(36) NOT NULL,
                renterId VARCHAR(36) NOT NULL,
                reason TEXT NOT NULL,
                status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Report (
                id VARCHAR(36) PRIMARY KEY,
                reporterId VARCHAR(36) NOT NULL,
                reportedItemId VARCHAR(36),
                reportedUserId VARCHAR(36),
                reason TEXT NOT NULL,
                status ENUM('PENDING', 'REVIEWED') DEFAULT 'PENDING',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Refund and Report tables created");
    } catch(err) { console.log(err); }
    await connection.end();
}
createTables();
