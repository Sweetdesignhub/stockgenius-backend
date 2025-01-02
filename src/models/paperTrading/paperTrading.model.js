import mongoose, { Schema } from "mongoose";
import FundsSchema from "./fundsPT.model.js";
import OrdersSchema from "./ordersPT.model.js";
import PositionsSchema from "./positionsPT.model.js";
import HoldingsSchema from "./holdingsPT.model.js";
import TradesSchema from "./tradesPT.model.js";

const paperTradingSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    funds: FundsSchema,
    orders: {
      type: [OrdersSchema],  // Ensuring orders is an array
      default: [],
    },
    positions: {
      type: PositionsSchema,  
    },
    holdings: HoldingsSchema,
    trades: {
      type: [TradesSchema],  // Ensuring trades is an array
      default: [],
    },
    riskProfile: {
      type: String,
      enum: ["conservative", "moderate", "aggressive"],
      default: "moderate",
    },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

const PaperTradeData = mongoose.model("PaperTradeData", paperTradingSchema);
export default PaperTradeData;
