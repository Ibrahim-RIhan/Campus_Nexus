const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if user exists
        const [users] = await pool.query('SELECT * FROM User WHERE email = ?', [email]);
        if (users.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate ID
        const id = randomUUID();
        const userRole = role || 'Renter';

        // Insert into database
        await pool.query(
            'INSERT INTO User (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [id, name, email, hashedPassword, userRole]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const [users] = await pool.query('SELECT * FROM User WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const user = users[0];

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Return JWT
        const payload = {
            id: user.id,
            role: user.role
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    token, 
                    user: { 
                        id: user.id, 
                        name: user.name, 
                        email: user.email, 
                        role: user.role 
                    } 
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get User Profile (Protected)
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, role, is_verified, created_at FROM User WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
