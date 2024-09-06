import AITradingBot from "../models/aiTradingBot.model.js";
import User from "../models/user.js";
import FyersUserDetail from "../models/brokers/fyers/fyersUserDetail.model.js";

// Middleware to check if the user has access to the bot
const checkBotAccess = async (req, res, next) => {
  try {
    const bot = await AITradingBot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({ message: "Bot not found" });
    }
    if (bot.userId.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({
          message:
            "Access denied. You do not have permission to access this bot.",
        });
    }
    req.bot = bot;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bots of all users (admin only)
export const getAllBots = async (req, res) => {
  try {
    // Check if the user is an admin
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }
    const bots = await AITradingBot.find().populate("userId", "username email");
    res.json(bots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new AI trading bot
export const createBot = async (req, res) => {
    const { userId } = req.params;
 console.log(userId)
    const {
        tradeRatio,
        totalBalance,
        scheduled,
        limits,
        profitPercentage,
        riskPercentage,
        productType,
 
      } = req.body;
          // Validate product type
    if (!['INTRADAY', 'CNC'].includes(productType)) {
        return res.status(400).json({ message: "Invalid product type. Must be 'INTRADAY' or 'CNC'." });
      }

  try {

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fyersUserDetails = await FyersUserDetail.findOne({ userId });
    if (!fyersUserDetails || !fyersUserDetails.accessToken) {
      return res.status(404).json({
        message: "Fyers user details not found or access token missing",
      });
    }

    // Create bot object based on product type
    const botData = {
      tradeRatio,
      totalBalance,
      scheduled,
      limits,
      profitPercentage,
      riskPercentage,
      productType,
      userId,
    };

    // if (productType === 'INTRADAY') {
    //   botData.status = status || 'inactive';
    // } else if (productType === 'CNC') {
    //   botData.status = autoTradeBotCNC || 'inactive';
    // }

    const newBot = new AITradingBot(botData);

    const savedBot = await newBot.save();
    res.status(201).json(savedBot);
  } catch (error) {
    console.error("Error in createBot:", error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      res.status(400).json({ message: "Validation failed", errors: validationErrors });
    } else {
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  }
};


// Get all AI trading bots for a user
export const getBotsByUserId = async (req, res) => {
  try {
    const bots = await AITradingBot.find({ userId: req.user.userId });
    res.json(bots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific AI trading bot
export const getBotById = async (req, res) => {
  // The checkBotAccess middleware will handle access control
  res.json(req.bot);
};

// Update an AI trading bot
export const updateBot = async (req, res) => {
  try {
    const {
      tradeRatio,
      profitGained,
      workingTime,
      totalBalance,
      scheduled,
      numberOfTrades,
      percentageGain,
      reInvestment,
      limits,
      profitPercentage,
      riskPercentage,
      autoTradeBotINTRADAY,
      autoTradeBotCNC,
    } = req.body;

    const updatedBot = await AITradingBot.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      {
        tradeRatio,
        profitGained,
        workingTime,
        totalBalance,
        scheduled,
        numberOfTrades,
        percentageGain,
        reInvestment,
        limits,
        profitPercentage,
        riskPercentage,
        autoTradeBotINTRADAY,
        autoTradeBotCNC,
      },
      { new: true, runValidators: true }
    );

    if (!updatedBot) return res.status(404).json({ message: "Bot not found" });
    res.json(updatedBot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an AI trading bot
export const deleteBot = async (req, res) => {
  try {
    const result = await AITradingBot.findByIdAndDelete(req.bot._id);
    if (!result) {
      return res.status(404).json({ message: "Bot not found" });
    }
    res.json({ message: "Bot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Toggle bot status for INTRADAY
export const toggleBotStatusINTRADAY = async (req, res) => {
  try {
    const currentStatus = req.bot.autoTradeBotINTRADAY;
    let newStatus;

    switch (currentStatus) {
      case "inactive":
        newStatus = "active";
        break;
      case "active":
        newStatus = "running";
        break;
      case "running":
        newStatus = "stopped";
        break;
      case "stopped":
        newStatus = "inactive";
        break;
      default:
        newStatus = "inactive";
    }

    req.bot.autoTradeBotINTRADAY = newStatus;
    const updatedBot = await req.bot.save();
    res.json(updatedBot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Toggle bot status for CNC
export const toggleBotStatusCNC = async (req, res) => {
  try {
    const currentStatus = req.bot.autoTradeBotCNC;
    let newStatus;

    switch (currentStatus) {
      case "inactive":
        newStatus = "active";
        break;
      case "active":
        newStatus = "running";
        break;
      case "running":
        newStatus = "stopped";
        break;
      case "stopped":
        newStatus = "inactive";
        break;
      default:
        newStatus = "inactive";
    }

    req.bot.autoTradeBotCNC = newStatus;
    const updatedBot = await req.bot.save();
    res.json(updatedBot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update bot's working time
export const updateWorkingTime = async (req, res) => {
  try {
    const { workingTime } = req.body;
    req.bot.workingTime = workingTime;
    const updatedBot = await req.bot.save();
    res.json(updatedBot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export { checkBotAccess };
