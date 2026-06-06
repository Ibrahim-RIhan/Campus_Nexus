const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    try {
        // Connect without database selected to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true
        });

        const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        
        console.log('Executing schema...');
        await connection.query(schemaSQL);
        console.log('Database and tables created successfully!');
        
        await connection.end();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initDB();
