const express = require('express');
const router = express.Router();
const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleWares/authMiddleware');




// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        if (!email || !password || !name || !phone) {
            return res.status(400).json({ message: "invalid credentials" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password: hashedPassword,
            name,
            phone
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1W' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser,
            token
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


// Sign in

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "invalid credentials" });
        }

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1W' }
        );

        return res.status(200).json({
            message: "Sign in successful",
            user,
            token,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});



// Get user by ID (ME)

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


    // Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

// Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});


module.exports = router;