/* ====================================================
   TripZyGo – Review Model
   Fields: user, hotelName, cityId, rating, comment
   ==================================================== */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
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
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Minimum rating is 1'],
            max: [5, 'Maximum rating is 5']
        },
        comment: {
            type: String,
            required: [true, 'Comment is required'],
            trim: true,
            minlength: [10, 'Comment must be at least 10 characters'],
            maxlength: [500, 'Comment cannot exceed 500 characters']
        }
    },
    { timestamps: true }
);

/* One review per user per hotel */
reviewSchema.index({ user: 1, hotelName: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
