const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); 
const User = require('../models/User');

// --- Helper function to generate JWT ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', 
    });
};

// @route POST /api/users/signup - Register a new user
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please enter all fields.' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists.' });
        }
        const user = await User.create({ email, password }); 
        if (user) {
            res.status(201).json({
                message: 'Registration successful!',
                token: generateToken(user._id),
                email: user.email, 
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during signup.', error: error.message });
    }
});

// @route POST /api/users/login - Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) { 
            res.json({
                message: 'Login successful!',
                token: generateToken(user._id),
                email: user.email, 
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

// @route POST /api/users/forgotpassword - Handle Forgot Password (MOCK)
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    console.log(`[MOCK EMAIL SENT]: Password reset requested for ${email}`);
    res.status(200).json({ message: 'Reset link successfully requested.' });
});

module.exports = router;