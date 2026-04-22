/* ====================================================
   TripZyGo – Express Backend Server (Local JSON DB)
   No MongoDB required. Data is saved in data.json.
   ==================================================== */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { protect } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'tripzygo_super_secret_2026_do_not_share';

/* ─── Local JSON DB Setup ─── */
const DB_FILE = path.join(__dirname, 'data.json');

// Initialize DB file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
        users: [],
        bookings: [],
        reviews: [],
        payments: []
    }, null, 2));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const generateId = () => Math.random().toString(36).substr(2, 9);

/* ─── Middleware ─── */
app.use(cors({ origin: '*' }));
app.use(express.json());

/* ─── Helpers ─── */
const signToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
const ok = (res, data, code = 200) => res.status(code).json({ success: true, ...data });
const err = (res, msg, code = 400) => res.status(code).json({ success: false, message: msg });

/* ================================================================
   AUTH ROUTES
   ================================================================ */

app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return err(res, 'Please provide name, email and password.');

        const db = readDB();
        if (db.users.find(u => u.email === email)) {
            return err(res, 'Email already registered. Please log in.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            _id: generateId(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        writeDB(db);

        const token = signToken(newUser._id);
        const { password: _, ...userWithoutPass } = newUser;

        ok(res, { message: 'Account created successfully!', token, user: userWithoutPass }, 201);
    } catch (e) {
        err(res, 'Signup failed.');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return err(res, 'Please provide email and password.');

        const db = readDB();
        const user = db.users.find(u => u.email === email);
        if (!user) return err(res, 'No account found with this email.', 401);

        const match = await bcrypt.compare(password, user.password);
        if (!match) return err(res, 'Incorrect password.', 401);

        const token = signToken(user._id);
        const { password: _, ...userWithoutPass } = user;

        ok(res, { message: 'Logged in successfully!', token, user: userWithoutPass });
    } catch (e) {
        err(res, 'Login failed.');
    }
});

/* ================================================================
   PAYMENT ROUTE
   ================================================================ */

app.post('/api/payment', protect, (req, res) => {
    try {
        const { hotelName, amount, method = 'card' } = req.body;
        if (!hotelName || !amount) return err(res, 'hotelName and amount are required.');

        const db = readDB();
        const payment = {
            _id: generateId(),
            user: req.user._id,
            hotelName,
            amount,
            method,
            transactionId: 'TXN' + Date.now() + Math.floor(Math.random() * 10000),
            status: 'success',
            createdAt: new Date().toISOString()
        };

        db.payments.push(payment);
        writeDB(db);

        ok(res, { message: '✅ Payment successful!', payment }, 201);
    } catch (e) {
        err(res, 'Payment failed.');
    }
});

/* ================================================================
   BOOKING ROUTES
   ================================================================ */

app.post('/api/book', protect, (req, res) => {
    try {
        const { hotelName, cityId, checkIn, checkOut, guests, totalCost, paymentId } = req.body;
        if (!hotelName || !cityId || !checkIn || !checkOut || !guests || !totalCost) {
            return err(res, 'All booking fields are required.');
        }

        const db = readDB();
        const booking = {
            _id: generateId(),
            user: req.user._id,
            hotelName,
            cityId,
            checkIn,
            checkOut,
            guests: Number(guests),
            totalCost: Number(totalCost),
            paymentId: paymentId || null,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        db.bookings.push(booking);
        writeDB(db);

        ok(res, { message: '🎉 Booking confirmed!', booking }, 201);
    } catch (e) {
        err(res, 'Booking failed.');
    }
});

app.get('/api/my-bookings', protect, (req, res) => {
    try {
        const db = readDB();
        const bookings = db.bookings
            .filter(b => b.user === req.user._id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        ok(res, { count: bookings.length, bookings });
    } catch (e) {
        err(res, 'Could not fetch bookings.', 500);
    }
});

/* ================================================================
   REVIEW ROUTES
   ================================================================ */

app.post('/api/review', protect, (req, res) => {
    try {
        const { hotelName, cityId, rating, comment } = req.body;
        if (!hotelName || !cityId || !rating || !comment) {
            return err(res, 'All review fields are required.');
        }

        const db = readDB();
        if (db.reviews.find(r => r.user === req.user._id && r.hotelName === hotelName)) {
            return err(res, 'You have already reviewed this hotel.');
        }

        const review = {
            _id: generateId(),
            user: req.user._id,
            userName: req.user.name,
            hotelName,
            cityId,
            rating: Number(rating),
            comment,
            createdAt: new Date().toISOString()
        };

        db.reviews.push(review);
        writeDB(db);

        ok(res, { message: '⭐ Review submitted!', review }, 201);
    } catch (e) {
        err(res, 'Review submission failed.');
    }
});

app.get('/api/reviews/:hotel', (req, res) => {
    try {
        const hotelName = decodeURIComponent(req.params.hotel);
        const db = readDB();
        const reviews = db.reviews
            .filter(r => r.hotelName === hotelName)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        ok(res, { count: reviews.length, reviews });
    } catch (e) {
        err(res, 'Could not fetch reviews.', 500);
    }
});

/* ================================================================
   SERVER START
   ================================================================ */
app.listen(PORT, () => {
    console.log(`🚀 TripZyGo Local JSON DB Backend running at http://localhost:${PORT}`);
    console.log(`📂 Data will be saved locally in: data.json`);
});
