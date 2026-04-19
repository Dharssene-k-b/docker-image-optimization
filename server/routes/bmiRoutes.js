// server/routes/bmiRoutes.js
const express = require('express');
const router = express.Router();
const BmiRecord = require('../models/BmiRecord');
const { protect } = require('../middleware/auth'); 

const calculateAndCategorize = (weight, height) => {
    const heightM = height / 100; 
    const bmi = weight / (heightM * heightM);
    const roundedBMI = parseFloat(bmi.toFixed(1)); 

    let category = '';
    if (bmi < 18.5) {
        category = 'Underweight';
    } else if (bmi >= 18.5 && bmi <= 24.9) {
        category = 'Normal Weight';
    } else if (bmi >= 25 && bmi <= 29.9) {
        category = 'Overweight';
    } else {
        category = 'Obese';
    }

    return { bmiValue: roundedBMI, category };
};

// @route GET /api/bmi - Protected: Get all BMI records for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const records = await BmiRecord.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching records', error: error.message });
    }
});

// @route POST /api/bmi - Protected: Calculate and save a new BMI record
router.post('/', protect, async (req, res) => {
    const { weight, height } = req.body; 

    if (!weight || !height || weight <= 0 || height <= 0) {
        return res.status(400).json({ message: 'Valid weight and height are required.' });
    }

    const { bmiValue, category } = calculateAndCategorize(weight, height);

    try {
        const newRecord = await BmiRecord.create({
            user: req.user._id, 
            weight, 
            height, 
            bmiValue,
            category,
        });

        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error saving BMI record', error: error.message });
    }
});

module.exports = router;