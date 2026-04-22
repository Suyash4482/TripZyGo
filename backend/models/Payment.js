/* ====================================================
   TripZyGo – Payment Model
   Fake payment – always returns success.
   Fields: user, bookingId (temp ref), amount,
           method, transactionId, status
   ==================================================== */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        hotelName: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        method: {
            type: String,
            enum: ['card', 'upi', 'netbanking', 'wallet'],
            default: 'card'
        },
        transactionId: {
            type: String,
            unique: true
        },
        status: {
            type: String,
            enum: ['success', 'failed', 'pending'],
            default: 'success'
        }
    },
    { timestamps: true }
);

/* Auto-generate fake transaction ID before saving */
paymentSchema.pre('save', function (next) {
    if (!this.transactionId) {
        this.transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 10000);
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);
