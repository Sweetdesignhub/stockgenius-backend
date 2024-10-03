import mongoose from 'mongoose';
import orderSchema from './orders.model.js'; // Import the order schema
import positionSchema from './positions.model.js';
import holdingsSchema from './holdings.model.js';
import tradeSchema from './trades.model.js';
import fundsSchema from './funds.model.js';

// Define the ZerodhaUserDetail schema
const ZerodhaUserDetailSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    profile: {
      broker: { type: String, default: "Zerodha" },
      userId: { type: String, required: true },
      userType: { type: String },
      email: { type: String },
      userName: { type: String },
      userShortName: { type: String },
      exchanges: [{ type: String }],
      products: [{ type: String }],
      orderTypes: [{ type: String }],
      avatarUrl: { type: String },
      dematConsent: { type: String }
    },
    zerodhaId: { type: String },
    accessToken: { type: String },
    authDate: { type: Date, default: Date.now },
    holdings: [holdingsSchema],
    orders: [orderSchema], 
    positions: [positionSchema],
    trades:[tradeSchema],
    funds: fundsSchema,
  },
  { timestamps: true }
);

// Pre-save hook to update the accessToken timestamp when the accessToken is modified
ZerodhaUserDetailSchema.pre('save', function(next) {
  if (this.isModified('accessToken')) {
    this.accessTokenUpdatedAt = new Date();  
  }
  next();
});

// Add indexes to improve query performance
ZerodhaUserDetailSchema.index({ 'profile.userId': 1 });
ZerodhaUserDetailSchema.index({ 'profile.email': 1 });
ZerodhaUserDetailSchema.index({ 'profile.userName': 1 });

const ZerodhaUserDetail = mongoose.model('ZerodhaUserDetail', ZerodhaUserDetailSchema);

export default ZerodhaUserDetail;
