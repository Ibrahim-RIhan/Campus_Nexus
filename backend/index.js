const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'CampusNexus API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/events', require('./routes/events'));
app.use('/api/rentals', require('./routes/rentals'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/moderation', require('./routes/moderation'));

// Socket.io integration
const pool = require('./db');
const { randomUUID } = require('crypto');

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
    });

    socket.on('send_message', async (data) => {
        const { senderId, receiverId, content } = data;
        try {
            const id = randomUUID();
            await pool.query(
                'INSERT INTO Message (id, senderId, receiverId, content) VALUES (?, ?, ?, ?)',
                [id, senderId, receiverId, content]
            );
            const msg = { id, senderId, receiverId, content, created_at: new Date() };
            // Emit to receiver
            io.to(receiverId).emit('receive_message', msg);
            // Also emit back to sender to confirm
            io.to(senderId).emit('receive_message', msg);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
