import mongoose from 'mongoose';
import FundSchema from './fund.model.js';
import HoldingSchema from './holding.model.js';
import OrderSchema from './order.model.js';
import PositionSchema from './position.model.js';
import TradeSchema from './trade.model.js';

const { Schema } = mongoose;

const FyersUserDetailSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  profile: {
    broker:{type:String, default:"Fyers"},
    fy_id: { type: String },
    name: { type: String },
    image: { type: String, default: null },
    display_name: { type: String, default: null },
    pin_change_date: { type: Date },
    email_id: { type: String },
    pwd_change_date: { type: Date, default: null },
    PAN: { type: String },
    mobile_number: { type: String },
    totp: { type: Boolean, default: false },
    pwd_to_expire: { type: Number, default: 0 }
  },
  // Fyers API credentials and details
  authCodeURL: { type: String },
  authDate: { type: Date }, 
  accessToken: { type: String },
  accessTokenUpdatedAt: { type: Date }, 
  refreshToken: { type: String },
  holdings: HoldingSchema,
  funds: FundSchema,
  orders: OrderSchema,
  positions: PositionSchema,
  trades: TradeSchema
}, { timestamps: true });

// Pre-save hook to update the accessToken timestamp when the accessToken is modified
FyersUserDetailSchema.pre('save', function(next) {
  if (this.isModified('accessToken')) {
    this.accessTokenUpdatedAt = new Date();  // Update timestamp for accessToken
  }
  next();
});

// Add indexes to improve query performance
FyersUserDetailSchema.index({ 'profile.fy_id': 1 });
FyersUserDetailSchema.index({ 'profile.email_id': 1 });
FyersUserDetailSchema.index({ 'profile.mobile_number': 1 });

const FyersUserDetail = mongoose.model('FyersUserDetail', FyersUserDetailSchema);

export default FyersUserDetail;

// import mongoose from 'mongoose';
// import FundSchema from './fund.model.js';
// import HoldingSchema from './holding.model.js';
// import OrderSchema from './order.model.js';
// import PositionSchema from './position.model.js';
// import TradeSchema from './trade.model.js';

// const { Schema } = mongoose;

// const FyersUserDetailSchema = new Schema({
//   userId: { 
//     type: Schema.Types.ObjectId, 
//     ref: 'User',
//     required: true,
//     index: true
//   },
//   profile: {
//     broker:{type:String,default:"Fyers"},
//     fy_id: { type: String,  },
//     name: { type: String },
//     image: { type: String, default: null },
//     display_name: { type: String, default: null },
//     pin_change_date: { type: Date },
//     email_id: { type: String, },
//     pwd_change_date: { type: Date, default: null },
//     PAN: { type: String },
//     mobile_number: { type: String, },
//     totp: { type: Boolean, default: false },
//     pwd_to_expire: { type: Number, default: 0 }
//   },
//   // Fyers API credentials and details
//   authCodeURL: { type: String },
//   authDate: { type: Date },
//   accessToken: { type: String },
//   refreshToken: { type: String },
//   holdings: HoldingSchema,
//   funds: FundSchema,
//   orders: OrderSchema,
//   positions: PositionSchema,
//   trades: TradeSchema
// }, { timestamps: true });

// // Add indexes to improve query performance
// FyersUserDetailSchema.index({ 'profile.fy_id': 1 });
// FyersUserDetailSchema.index({ 'profile.email_id': 1 });
// FyersUserDetailSchema.index({ 'profile.mobile_number': 1 });

// const FyersUserDetail = mongoose.model('FyersUserDetail', FyersUserDetailSchema);

// export default FyersUserDetail;

