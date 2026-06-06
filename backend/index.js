const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
