import  { Schema } from "mongoose";

// Schema for individual holding details
const HoldingDetailSchema = new Schema({
  stockSymbol: {
    type: String,
    required: true,
  }, // Symbol of the stock (e.g., TCS, INFY)
  quantity: {
    type: Number,
    required: true,
  }, // Total quantity of the stock
  averagePrice: {
    type: Number,
    required: true,
  }, // Average purchase price per share
  lastTradedPrice: {
    type: Number,
    required: true,
  }, // Current market price
  investedValue: {
    type: Number,
    required: true,
  }, // Total investment for this holding (quantity * averagePrice)
  marketValue: {
    type: Number,
    required: true,
  }, // Current market value (quantity * lastTradedPrice)
  unrealizedPnL: {
    type: Number,
    required: true,
  }, // Unrealized profit/loss (marketValue - investedValue)
  exchange: {
    type: String,
    required: true,
    enum: ["NSE", "BSE"],
  }, // Exchange where the stock is traded
});

// Schema for overall holdings summary
const HoldingsSummarySchema = new Schema({
  totalInvested: {
    type: Number,
    required: true,
    default: 0,
  }, // Total investment across all holdings
  totalMarketValue: {
    type: Number,
    required: true,
    default: 0,
  }, // Total market value across all holdings
  totalPnL: {
    type: Number,
    required: true,
    default: 0,
  }, // Total profit/loss (unrealized)
  totalPnLPercentage: {
    type: Number,
    required: true,
    default: 0,
  }, // Overall profit/loss percentage
  totalHoldingsCount: {
    type: Number,
    required: true,
    default: 0,
  }, // Total number of unique holdings
});

// Main schema for holdings
const HoldingsSchema = new Schema(
  {
    holdingsSummarySchema: {
      type: HoldingsSummarySchema,
      required: true,
      default: {},
    },
    holdings: {
      type: [HoldingDetailSchema],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

export default HoldingsSchema;
