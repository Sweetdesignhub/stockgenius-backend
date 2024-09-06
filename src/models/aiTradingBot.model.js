import mongoose from "mongoose";

const AITradingBotSchema = new mongoose.Schema({
  broker: {
    type: String,
    default: "Fyers",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  productType: {
    type: String,
    enum: ['INTRADAY', 'CNC'],
    required: true
  },
  profitPercentage: {
    type: Number,
    required: true,
    min: [0, "Profit percentage cannot be negative"],
  },
  riskPercentage: {
    type: Number,
    required: true,
    min: [0, "Risk percentage cannot be negative"],
  },
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
    type: Number,
    default: 0,
  },
  totalBalance: {
    type: Number,
    default: 5000,
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
    enum: ["Active", "Inactive", "Running", "Stopped"],
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
  lastIntradayRun: {
    type: Date,
    default: null,
  },
  lastCNCRun: {
    type: Date,
    default: null,
  },
  
  // autoTradeBotINTRADAY: {
  //   type: String,
  //   enum: ["active", "running", "inactive", "stopped"],
  //   default: "inactive",
  // },
  
  // autoTradeBotCNC: {
  //   type: String,
  //   enum: ["active", "running", "inactive", "stopped"],
  //   default: "inactive",
  // },  
  // createdAt: {
  //   type: Date,
  //   default: Date.now,
  // },
  // updatedAt: {
  //   type: Date,
  //   default: Date.now,
  // },
 
}, { timestamps: true });

// Add a method to check if the bot can be run today
AITradingBotSchema.methods.canRunToday = function (botType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastRun = botType === "INTRADAY" ? this.lastIntradayRun : this.lastCNCRun;

  return !lastRun || lastRun < today;
};

const AITradingBot = mongoose.model("AITradingBot", AITradingBotSchema);

export default AITradingBot;
