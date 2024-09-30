import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Dynamic Data Schema
const dynamicDataSchema = new Schema({
  tradeRatio: {
    type: Number,
    default: 50,
    required: true,
    min: [0, "Trade ratio must be at least 0%"],
    max: [100, "Trade ratio cannot exceed 100%"],
    validate: {
      validator: Number.isInteger,
      message: "{VALUE} is not an integer value",
    },
  },
  profitGained: {
    type: Number,
    required: true,
    default: 0,
  },
  workingTime: {
    type: String,
    default: '0',
  },
  todaysBotTime: {
    type: String,
    default: '0',
  },
  currentWeekTime: {
    type: String,
    default: '0',
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  totalBalance: {
    type: Number,
    default: 0,
    required: true,
  },
  scheduled: {
    type: Date,
  },
  numberOfTrades: {
    type: Number,
    default: 0,
  },
  percentageGain: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Schedule", "Inactive", "Running", "Stopped"],
    default: "Inactive",
  },
  reInvestment: {
    type: Number,
    default: 0,
  },
  limits: {
    type: Number,
    default: 0,
    required: true
  },
});

// Main Bot Schema
const botSchema = new Schema({
  name: { type: String, required: true },
  image: { type: String, default: "https://cdn.builder.io/api/v1/image/assets%2F462dcf177d254e0682506e32d9145693%2Fec1600c1a6ac4434aaa71d89b447fec8" },
  profitPercentage: { type: String, required: true },
  riskPercentage: { type: String, required: true },
  market: { type: String, default: "NSE NIFTY 100" },
  extraImage: { type: String, default: "https://cdn.builder.io/api/v1/image/assets%2F462dcf177d254e0682506e32d9145693%2Fab3b7e83271a4c3eb160f4e52b6158b4" },
  productType: {
    type: String,
    enum: ['INTRADAY', 'CNC'],
    required: true,
  },
  dynamicData: { type: [dynamicDataSchema], required: true }, // Array of dynamic data objects

  // Additional fields
  broker: {
    type: String,
    default: "Fyers",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, {
  timestamps: true,
});

// Export the model
const AITradingBot = model('AITradingBot', botSchema);
export default AITradingBot;
