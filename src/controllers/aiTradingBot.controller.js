import AITradingBot from "../models/aiTradingBot.model.js";
import User from "../models/user.js";
import FyersUserDetail from "../models/brokers/fyers/fyersUserDetail.model.js";
import moment from "moment";

// Middleware to check if the user has access to the bot
const checkBotAccess = async (req, res, next) => {
  try {
    const bot = await AITradingBot.findById(req.params.id);
    if (!bot) {
      return res.status(404).json({ message: "Bot not found" });
    }
    if (bot.userId.toString() !== req.user.userId) {
      return res.status(403).json({
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

// // Create a new AI trading bot
// export const createBot = async (req, res) => {
//   const { userId } = req.params;
//   const {
//     tradeRatio,
//     totalBalance,
//     scheduled,
//     limits,
//     profitPercentage,
//     riskPercentage,
//     productType,
//   } = req.body;

//   // Validate product type
//   if (!["INTRADAY", "CNC"].includes(productType)) {
//     return res
//       .status(400)
//       .json({ message: "Invalid product type. Must be 'INTRADAY' or 'CNC'." });
//   }

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const fyersUserDetails = await FyersUserDetail.findOne({ userId });
//     if (!fyersUserDetails || !fyersUserDetails.accessToken) {
//       return res.status(404).json({
//         message: "Fyers user details not found or access token missing",
//       });
//     }

//     // Check if a bot of the same productType already exists for today
//     const today = moment().startOf("day"); // Get the start of today
//     const existingBot = await AITradingBot.findOne({
//       userId,
//       productType,
//       createdAt: { $gte: today.toDate() }, // Check if the bot was created today
//     });

//     if (existingBot) {
//       return res.status(400).json({
//         message: `You have already created a ${productType} bot today. You can only create one ${productType} bot per day.`,
//       });
//     }

//     // Create bot object based on product type
//     const botData = {
//       tradeRatio,
//       totalBalance,
//       scheduled,
//       limits,
//       profitPercentage,
//       riskPercentage,
//       productType,
//       userId,
//     };

//     const newBot = new AITradingBot(botData);

//     const savedBot = await newBot.save();
//     res.status(201).json(savedBot);
//   } catch (error) {
//     console.error("Error in createBot:", error);
//     if (error.name === "ValidationError") {
//       const validationErrors = Object.values(error.errors).map(
//         (err) => err.message
//       );
//       res
//         .status(400)
//         .json({ message: "Validation failed", errors: validationErrors });
//     } else {
//       res
//         .status(500)
//         .json({ message: "Internal server error", error: error.message });
//     }
//   }
// };

// Create a new AI trading bot
export const createBot = async (req , res) => {
  const { userId } = req.params;
  const {
    name,
    image,
    profitPercentage,
    riskPercentage,
    market,
    timestamp,
    extraImage,
    tradeRatio,
    profitGained,
    workingTime,
    totalBalance,
    scheduled,
    numberOfTrades,
    percentageGain,
    status,
    reInvestment,
    limits,
    productType,
  } = req.body;

  // Validate required fields
  const requiredFields = ['name', 'profitPercentage', 'riskPercentage', 'productType'];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ message: `Missing required field: ${field}` });
    }
  }

  // Validate product type
  if (!["INTRADAY", "CNC"].includes(productType)) {
    return res.status(400).json({ message: "Invalid product type. Must be 'INTRADAY' or 'CNC'." });
  }

  try {
    // Validate User
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate FyersUserDetail
    const fyersUserDetails = await FyersUserDetail.findOne({ userId });
    if (!fyersUserDetails || !fyersUserDetails.accessToken) {
      return res.status(404).json({ message: "Fyers user details not found or access token missing" });
    }

    // Check if a bot of the same productType already exists for today
    const today = moment().startOf('day').toDate();
    const existingBot = await AITradingBot.findOne({
      userId,
      productType,
      createdAt: { $gte: today }
    });

    if (existingBot) {
      return res.status(400).json({
        message: `A ${productType} bot has already been created today. You can only create one ${productType} bot per day.`
      });
    }

    // Create bot object with all fields from the schema
    const botData = {
      name,
      image,
      profitPercentage,
      riskPercentage,
      market,
      timestamp: timestamp || new Date(),
      extraImage,  
      dynamicData: [{
        tradeRatio,
        profitGained,
        workingTime,
        totalBalance,
        scheduled,
        numberOfTrades,
        percentageGain,
        status: status || "Inactive",
        reInvestment,
        limits
      }],
      productType,
      userId,
      broker: "Fyers"
    };

    // Create and save the bot
    const newBot = new AITradingBot(botData);
    const savedBot = await newBot.save();

    res.status(201).json(savedBot);
  } catch (error) {
    console.error("Error creating bot:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation failed", errors: validationErrors });
    }

    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


// Get all AI trading bots for a user
export const getBotsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    // Fetch bots associated with the user ID
    const bots = await AITradingBot.find({ userId: req.user.userId });

    if (!bots || bots.length === 0) {
      return res.status(200).json({
        message: "No bots found for this user.",
        bots: [],
      });
    }

    // Return bots if found
    res.status(200).json({
      message: "Bots fetched successfully.",
      bots,
    });
  } catch (error) {
    console.error("Error fetching bots:", error);
    res.status(500).json({
      message: "An error occurred while fetching bots.",
      error: error.message,
    });
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
