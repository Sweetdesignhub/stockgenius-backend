import mongoose, { Schema } from "mongoose";

// Define the available and utilised funds schema
const availableFundsSchema = new Schema({
  adhoc_margin: {
    type: Number,
    default: 0,
  },
  cash: {
    type: Number,
    required: true,
  },
  opening_balance: {
    type: Number,
    required: true,
  },
  live_balance: {
    type: Number,
    required: true,
  },
  collateral: {
    type: Number,
    default: 0,
  },
  intraday_payin: {
    type: Number,
    default: 0,
  },
});

const utilisedFundsSchema = new Schema({
  debits: {
    type: Number,
    default: 0,
  },
  exposure: {
    type: Number,
    default: 0,
  },
  m2m_realised: {
    type: Number,
    default: 0,
  },
  m2m_unrealised: {
    type: Number,
    default: 0,
  },
  option_premium: {
    type: Number,
    default: 0,
  },
  payout: {
    type: Number,
    default: 0,
  },
  span: {
    type: Number,
    default: 0,
  },
  holding_sales: {
    type: Number,
    default: 0,
  },
  turnover: {
    type: Number,
    default: 0,
  },
  liquid_collateral: {
    type: Number,
    default: 0,
  },
  stock_collateral: {
    type: Number,
    default: 0,
  },
  delivery: {
    type: Number,
    default: 0,
  },
});

// Define the funds schema
const fundsSchema = new Schema({
  equity: {
    enabled: {
      type: Boolean,
      default: false,
    },
    net: {
      type: Number,
      required: true,
    },
    available: availableFundsSchema,
    utilised: utilisedFundsSchema,
  },
  commodity: {
    enabled: {
      type: Boolean,
      default: false,
    },
    net: {
      type: Number,
      required: true,
    },
    available: availableFundsSchema,
    utilised: utilisedFundsSchema,
  },
}, { timestamps: true });

// Export the Funds schema
export default fundsSchema;
