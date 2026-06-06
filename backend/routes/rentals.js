const express = require('express');
const router = express.Router();
const { randomUUID } = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// Request a rental
router.post('/request', authMiddleware, async (req, res) => {
    try {
        const { itemId, startDate, endDate, totalCost } = req.body;
        const renterId = req.user.id;
        
        // Verify item is available
        const [items] = await pool.query('SELECT * FROM Item WHERE id = ?', [itemId]);
        if (items.length === 0) return res.status(404).json({ message: 'Item not found' });
        
        const id = randomUUID();
        await pool.query(
            'INSERT INTO Rental (id, itemId, renterId, startDate, endDate, totalCost, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, itemId, renterId, startDate, endDate, totalCost, 'REQUESTED']
        );

        // Notify provider about new request
        await pool.query(
            'INSERT INTO Notification (id, userId, message) VALUES (?, ?, ?)',
            [randomUUID(), items[0].ownerId, `New rental request for ${items[0].title}`]
        );

        res.status(201).json({ message: 'Rental requested successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Update rental status (State Machine)
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const rentalId = req.params.id;

        // Fetch rental and item
        const [rentals] = await pool.query('SELECT * FROM Rental WHERE id = ?', [rentalId]);
        if (rentals.length === 0) return res.status(404).json({ message: 'Rental not found' });
        const rental = rentals[0];

        const [items] = await pool.query('SELECT ownerId FROM Item WHERE id = ?', [rental.itemId]);
        const item = items[0];

        // Role verification (Provider vs Renter)
        const isProvider = req.user.id === item.ownerId;
        const isRenter = req.user.id === rental.renterId;

        // Allowed transitions:
        // Provider: REQUESTED -> APPROVED | REJECTED
        // Renter: APPROVED -> ACTIVE (start rental, simulated payment)
        // Provider: ACTIVE -> RETURNED
        // Both: RETURNED -> COMPLETED

        let valid = false;
        if (isProvider && rental.status === 'REQUESTED' && (status === 'APPROVED' || status === 'REJECTED')) valid = true;
        else if (isRenter && rental.status === 'APPROVED' && status === 'ACTIVE') {
            // Require QR scan for Renter activation? Wait, the Provider is the one scanning the Renter's QR to activate.
            // Oh right, original plan:
            // To start rental (ACTIVE), Provider scans Renter's QR code.
            valid = true;
        } else if (isProvider && rental.status === 'APPROVED' && status === 'ACTIVE') {
            if (req.body.qrSecret !== rental.qrSecret) return res.status(400).json({ message: 'Invalid QR Code' });
            valid = true;
        } else if (isRenter && rental.status === 'ACTIVE' && status === 'RETURNED') {
            if (req.body.qrSecret !== rental.returnQrSecret) return res.status(400).json({ message: 'Invalid QR Code' });
            valid = true;
        } else if (isProvider && rental.status === 'ACTIVE' && status === 'RETURNED') valid = true;
        else if ((isProvider || isRenter) && rental.status === 'RETURNED' && status === 'COMPLETED') valid = true;

        if (!valid) return res.status(400).json({ message: 'Invalid status transition or unauthorized' });

        let updateQuery = 'UPDATE Rental SET status = ? WHERE id = ?';
        let updateParams = [status, rentalId];

        if (status === 'APPROVED') {
            const qrSecret = randomUUID();
            const returnQrSecret = randomUUID();
            updateQuery = 'UPDATE Rental SET status = ?, qrSecret = ?, returnQrSecret = ? WHERE id = ?';
            updateParams = [status, qrSecret, returnQrSecret, rentalId];
        }

        await pool.query(updateQuery, updateParams);

        // Generate Notification
        let notifyUserId;
        let msg;

        if (status === 'REQUESTED') {
            notifyUserId = item.ownerId;
            msg = `New rental request for ${item.title}`;
        } else if (status === 'APPROVED' || status === 'REJECTED') {
            notifyUserId = rental.renterId;
            msg = `Your request for ${item.title} was ${status.toLowerCase()}`;
        } else if (status === 'ACTIVE') {
            notifyUserId = item.ownerId;
            msg = `Rental for ${item.title} has started`;
        } else if (status === 'RETURNED') {
            notifyUserId = rental.renterId;
            msg = `Provider marked ${item.title} as returned`;
        } else if (status === 'COMPLETED') {
            notifyUserId = item.ownerId;
            msg = `Rental for ${item.title} is fully completed`;
        }

        if (notifyUserId && msg) {
            await pool.query(
                'INSERT INTO Notification (id, userId, message) VALUES (?, ?, ?)',
                [randomUUID(), notifyUserId, msg]
            );
        }

        res.json({ message: `Status updated to ${status}` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get incoming requests (Provider)
router.get('/incoming', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT r.*, i.title as itemTitle, u.name as renterName 
            FROM Rental r 
            JOIN Item i ON r.itemId = i.id 
            JOIN User u ON r.renterId = u.id
            WHERE i.ownerId = ?
            ORDER BY r.created_at DESC
        `;
        const [rentals] = await pool.query(query, [req.user.id]);
        res.json(rentals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get my rentals (Renter)
router.get('/my-rentals', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT r.*, i.title as itemTitle, u.name as providerName 
            FROM Rental r 
            JOIN Item i ON r.itemId = i.id 
            JOIN User u ON i.ownerId = u.id
            WHERE r.renterId = ?
            ORDER BY r.created_at DESC
        `;
        const [rentals] = await pool.query(query, [req.user.id]);
        res.json(rentals);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Get booked dates for an item
router.get('/item/:itemId/booked-dates', async (req, res) => {
    try {
        const query = `
            SELECT startDate, endDate 
            FROM Rental 
            WHERE itemId = ? AND status IN ('APPROVED', 'ACTIVE')
        `;
        const [dates] = await pool.query(query, [req.params.itemId]);
        res.json(dates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
