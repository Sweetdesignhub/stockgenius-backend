import mongoose, { Schema } from "mongoose";

// Schema for individual trade details
const TradesSchema = new Schema(
  {
    stockSymbol: { type: String, required: true }, // Ticker symbol of the stock
    tradeDateTime: { type: Date, default: Date.now }, // Timestamp of the trade
    tradeNumber: { type: String, required: true }, // Unique trade identifier
    side: { type: String, enum: ["BUY", "SELL"], required: true }, // Trade direction
    quantity: { type: Number, required: true }, // Number of shares traded
    price: { type: Number, required: true }, // Execution price per share
    tradeValue: { type: Number, required: true }, // Total trade value (price * quantity)
    orderType: {
      type: String,
      enum: ["MARKET", "LIMIT", "STOP_LOSS", "STOP_LIMIT"],
      required: true,
    }, // Order type used for trade
    productType: {
      type: String,
      enum: ["INTRADAY", "CNC"],
      default: "INTRADAY",
    }, // Type of product
    fees: { type: Number, default: 0 }, // Any simulated fees for the trade
    tags: { type: [String] }, // Optional tags for categorizing or tracking
  },
  { timestamps: true }
);

export default TradesSchema;
