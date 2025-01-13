import mongoose, { Schema } from "mongoose";

const activatedBotSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    botId: {
      type: Schema.Types.ObjectId,
      ref: "AITradingBot",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    botType: {
      type: String,
      enum: ["INTRADAY", "CNC"],
      required: true,
    },
    broker: {
      type: String,
      default: "PaperTrading",
      enum: ["PaperTrading", "Fyers", "Zerodha", "Upstox", "Others"],
    },
  },
  {
    timestamps: true,
  }
);

const ActivatedBot = mongoose.model("ActivatedBot", activatedBotSchema);

export default ActivatedBot;
