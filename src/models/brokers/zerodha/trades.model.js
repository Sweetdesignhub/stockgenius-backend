import mongoose from 'mongoose';

// Define the Trade schema
const tradeSchema = new mongoose.Schema({
  trade_id: {
    type: String,
    required: true,
  },
  order_id: {
    type: String,
    required: true,
  },
  exchange: {
    type: String,
    required: true,
  },
  tradingsymbol: {
    type: String,
    required: true,
  },
  instrument_token: {
    type: Number,
    required: true,
  },
  product: {
    type: String,
    required: true,
  },
  average_price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  exchange_order_id: {
    type: String,
    required: true,
  },
  transaction_type: {
    type: String,
    enum: ['BUY', 'SELL'], // Assuming trades can be either BUY or SELL
    required: true,
  },
  fill_timestamp: {
    type: Date,
    required: true,
  },
  order_timestamp: {
    type: String, // Keeping it as String to store the time only
    required: true,
  },
  exchange_timestamp: {
    type: Date,
    required: true,
  },
});

export default tradeSchema;
