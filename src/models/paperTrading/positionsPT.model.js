import mongoose from "mongoose";

const { Schema } = mongoose;

// Schema for individual position details
const netPositionSchema = new Schema({
  stockSymbol: { type: String, required: true }, // Stock or instrument symbol
  exchange: { type: String, default: "NSE", required: true }, // Exchange (e.g., NSE)
  quantity: { type: Number, required: true }, // Total quantity of the position
  avgPrice: { type: Number, required: true }, // Average price of the position
  ltp: { type: Number, required: true }, // Last traded price
  side: { type: String, enum: ["BUY", "SELL"], required: true }, // Position direction
  realizedPnL: { type: Number, default: 0 }, // Realized profit/loss
  unrealizedPnL: { type: Number, default: 0 }, // Unrealized profit/loss
  buyQty: { type: Number, default: 0 }, // Total quantity bought
  buyAvgPrice: { type: Number, default: 0 }, // Average buy price
  sellQty: { type: Number, default: 0 }, // Total quantity sold
  sellAvgPrice: { type: Number, default: 0 }, // Average sell price
  productType: { type: String, enum: ["INTRADAY", "CNC"], default: "INTRADAY" }, // Trading type
});

// Schema for overall position summary
const positionSummarySchema = new Schema({
  totalCount: { type: Number, default: 0 }, // Total number of positions
  openCount: { type: Number, default: 0 }, // Number of open positions
  realizedPnL: { type: Number, default: 0 }, // Total realized profit/loss
  unrealizedPnL: { type: Number, default: 0 }, // Total unrealized profit/loss
  totalPnL: { type: Number, default: 0 }, // Combined profit/loss
});

// Schema for positions data
const PositionsSchema = new Schema(
  {
    netPositions: [netPositionSchema], // Array of individual net positions
    summary: positionSummarySchema, // Overall position summary
  },
  { timestamps: true }
);

export default PositionsSchema;
