/* ====================================================
   TripZyGo – Booking Model
   Fields: user, hotelName, cityId, checkIn, checkOut,
           guests, totalCost, paymentId, status
   ==================================================== */
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        hotelName: {
            type: String,
            required: [true, 'Hotel name is required'],
            trim: true
        },
        cityId: {
            type: String,
            required: [true, 'City is required'],
            lowercase: true
        },
        checkIn: {
            type: Date,
            required: [true, 'Check-in date is required']
        },
        checkOut: {
            type: Date,
            required: [true, 'Check-out date is required'],
            validate: {
                validator: function (v) {
                    return v > this.checkIn;
                },
                message: 'Check-out must be after check-in'
            }
        },
        guests: {
            type: Number,
            required: true,
            min: [1, 'At least 1 guest required'],
            max: [10, 'Maximum 10 guests allowed']
        },
        totalCost: {
            type: Number,
            required: true,
            min: 0
        },
        paymentId: {
            type: String,
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
