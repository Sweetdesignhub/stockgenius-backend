import  { Schema } from "mongoose";

const FundsSchema = new Schema(
  {
    totalFunds: { type: Number, default: 100000, required: true }, // Total account balance
    availableFunds: { type: Number, default: 100000, required: true }, // Liquid cash for trading
    availableMargin: { type: Number, default: 0, required: true }, // Funds available for margin trading
    usedMargin: { type: Number, default: 0 }, // Margin used in current positions
    openingBalance: { type: Number, default: 100000 }, // Starting balance of the account
    reservedFunds: { type: Number, default: 0 }, // Funds reserved for pending orders
    realizedPnL: { type: Number, default: 0 }, // Total realized profit/loss
  },
  { timestamps: true }
);

export default FundsSchema;
