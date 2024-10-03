import { Schema } from 'mongoose';

// Define the holdings schema
const holdingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tradingsymbol: {
      type: String,
      required: true,
    },
    exchange: {
      type: String,
      required: true,
    },
    instrument_token: {
      type: Number,
      required: true,
    },
    isin: {
      type: String,
      required: true,
    },
    product: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
    },
    used_quantity: {
      type: Number,
      default: 0,
    },
    t1_quantity: {
      type: Number,
      default: 0,
    },
    realised_quantity: {
      type: Number,
      required: true,
    },
    authorised_quantity: {
      type: Number,
      default: 0,
    },
    authorised_date: {
      type: Date,
      default: null,
    },
    opening_quantity: {
      type: Number,
      default: 0,
    },
    collateral_quantity: {
      type: Number,
      default: 0,
    },
    collateral_type: {
      type: String,
      default: '',
    },
    discrepancy: {
      type: Boolean,
      default: false,
    },
    average_price: {
      type: Number,
      required: true,
    },
    last_price: {
      type: Number,
      required: true,
    },
    close_price: {
      type: Number,
      required: true,
    },
    pnl: {
      type: Number,
      required: true,
    },
    day_change: {
      type: Number,
      required: true,
    },
    day_change_percentage: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

export default holdingsSchema;
