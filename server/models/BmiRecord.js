// server/models/BmiRecord.js
const mongoose = require('mongoose');

const bmiSchema = mongoose.Schema(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        weight: { type: Number, required: true }, // in kg (can be decimal)
        height: { type: Number, required: true }, // in cm
        bmiValue: { type: Number, required: true },
        category: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('BmiRecord', bmiSchema);