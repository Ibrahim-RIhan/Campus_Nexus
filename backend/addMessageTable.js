const mysql = require('mysql2/promise');
require('dotenv').config();

async function addTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    await connection.query(`
        CREATE TABLE IF NOT EXISTS Message (
            id VARCHAR(36) PRIMARY KEY,
            senderId VARCHAR(36) NOT NULL,
            receiverId VARCHAR(36) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE,
            FOREIGN KEY (receiverId) REFERENCES User(id) ON DELETE CASCADE
        );
    `);
    
    console.log("Message table created!");
    await connection.end();
}
addTable();
