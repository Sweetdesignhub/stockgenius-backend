import User from "../models/user.js";
import moment from "moment";
import Bot from "../../models/autoTradeBot/bot.model.js";
import FyersUserDetail from "../../models/brokers/fyers/fyersUserDetail.model.js";
import mongoose from "mongoose";

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
  const {
    name,
    image,
    profitPercentage,
    riskPercentage,
    market = "NSE NIFTY 100",
    extraImage,
    tradeRatio,
    profitGained = 0,
    workingTime = "0",
    totalBalance = 0,
    scheduled,
    numberOfTrades = 0,
    percentageGain = 0,
    status = "Inactive",
    reInvestment = 0,
    limits = 0,
    productType,
    broker = "PaperTrading", // Default broker
  } = req.body;

  try {
    // Validate required fields
    const requiredFields = [
      "name",
      "profitPercentage",
      "riskPercentage",
      "productType",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields,
      });
    }

    // Validate product type
    const validProductTypes = ["INTRADAY", "CNC"];
    if (!validProductTypes.includes(productType)) {
      return res.status(400).json({
        message: `Invalid product type. Must be one of: ${validProductTypes.join(
          ", "
        )}`,
      });
    }

    // Validate broker
    const validBrokers = ["Fyers", "Zerodha", "PaperTrading"];
    if (!validBrokers.includes(broker)) {
      return res.status(400).json({
        message: `Invalid broker. Must be one of: ${validBrokers.join(", ")}`,
      });
    }

    // Validate user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check broker-specific details
    if (broker !== "PaperTrading") {
      let brokerDetailModel;
      if (broker === "Fyers") {
        brokerDetailModel = FyersUserDetail;
      } else if (broker === "Zerodha") {
        //   brokerDetailModel = ZerodhaUserDetail;
      }

      const brokerDetails = await brokerDetailModel.findOne({ userId });
      if (!brokerDetails || !brokerDetails.accessToken) {
        return res.status(404).json({
          message: `${broker} user details not found or access token missing`,
        });
      }
    }

    // Check if a bot with the same name or product type exists for today
    const today = moment().startOf("day").toDate();
    const existingBot = await AITradingBot.findOne({
      userId,
      $or: [
        { name, createdAt: { $gte: today } },
        { productType, createdAt: { $gte: today } },
      ],
    });

    if (existingBot) {
      const errorField = existingBot.name === name ? "name" : "productType";
      return res.status(400).json({
        message: `A bot with the same ${errorField} already exists for today.`,
      });
    }

    // Construct dynamicData object
    const dynamicData = {
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
    };

    // Create new bot
    const botData = {
      name,
      image,
      profitPercentage,
      riskPercentage,
      market,
      extraImage,
      dynamicData: [dynamicData],
      productType,
      userId,
      broker,
    };

    const newBot = new Bot(botData);
    const savedBot = await newBot.save();

    res.status(201).json(savedBot);
  } catch (error) {
    console.error("Error creating bot:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all AI trading bots for a user
export const getBotsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    // Validate userId
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    // Fetch bots associated with the user ID
    const bots = await Bot.find({ userId }).lean();

    // Respond with appropriate message
    if (bots.length === 0) {
      return res.status(404).json({
        message: "No bots found for this user.",
        bots: [],
      });
    }

    // Return bots if found
    return res.status(200).json({
      message: "Bots fetched successfully.",
      bots,
    });
  } catch (error) {
    console.error("Error fetching bots:", error);

    // Handle unexpected errors
    return res.status(500).json({
      message: "An internal error occurred while fetching bots.",
      error: error.message,
    });
  }
};

export const getBotById = async (req, res) => {
  const { botId, userId } = req.params;

  try {
    // Validate botId
    if (!mongoose.Types.ObjectId.isValid(botId)) {
      return res.status(400).json({ message: "Invalid Bot ID." });
    }

    // Fetch the bot by ID
    const bot = await Bot.findById(botId).lean();

    if (!bot) {
      return res.status(404).json({ message: "Bot not found." });
    }

    // Check if the bot belongs to the user
    if (bot.userId.toString() !== userId) {
      return res.status(403).json({
        message:
          "Access denied. You do not have permission to access this bot.",
      });
    }

    // Return the bot details
    return res.status(200).json({
      message: "Bot fetched successfully.",
      bot,
    });
  } catch (error) {
    console.error("Error fetching bot by ID:", error);

    // Handle unexpected errors
    return res.status(500).json({
      message: "An internal error occurred while fetching the bot.",
      error: error.message,
    });
  }
};

// Update an existing AI trading bot
export const updateBot = async (req, res) => {
  const { userId, botId } = req.params;
  const {
    name,
    image,
    profitPercentage,
    riskPercentage,
    market,
    extraImage,
    tradeRatio,
    profitGained,
    workingTime,
    todaysBotTime,
    currentWeekTime,
    totalBalance,
    scheduled,
    numberOfTrades,
    percentageGain,
    status,
    reInvestment,
    limits,
    productType,
    broker, // Include the broker in the request body
  } = req.body;

  try {
    // Ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If broker is Fyers, validate FyersUserDetail
    if (broker === "Fyers") {
      const fyersUserDetails = await FyersUserDetail.findOne({ userId });
      if (!fyersUserDetails || !fyersUserDetails.accessToken) {
        return res.status(404).json({
          message: "Fyers user details not found or access token missing",
        });
      }
    }

    // Validate if the bot exists
    const existingBot = await Bot.findOne({ _id: botId, userId }).lean();
    if (!existingBot) {
      return res.status(404).json({ message: "AI trading bot not found" });
    }

    // Validate productType update if the product type is changing
    if (productType && productType !== existingBot.productType) {
      const today = moment().startOf("day").toDate();
      const sameDayBot = await Bot.findOne({
        userId,
        productType,
        createdAt: { $gte: today },
      }).lean();

      if (sameDayBot) {
        return res.status(400).json({
          message: `A ${productType} bot has already been created today. You can only create one ${productType} bot per day.`,
        });
      }
    }

    // Prepare fields for update
    const updateFields = {
      ...(name && { name }),
      ...(image && { image }),
      ...(profitPercentage && { profitPercentage }),
      ...(riskPercentage && { riskPercentage }),
      ...(market && { market }),
      ...(extraImage && { extraImage }),
      ...(productType && { productType }),
      ...(broker && { broker }), // Update broker if provided
      dynamicData: [
        {
          tradeRatio: tradeRatio ?? existingBot.dynamicData[0].tradeRatio,
          profitGained: profitGained ?? existingBot.dynamicData[0].profitGained,
          workingTime: workingTime ?? existingBot.dynamicData[0].workingTime,
          todaysBotTime:
            todaysBotTime ?? existingBot.dynamicData[0].todaysBotTime,
          currentWeekTime:
            currentWeekTime ?? existingBot.dynamicData[0].currentWeekTime,
          totalBalance: totalBalance ?? existingBot.dynamicData[0].totalBalance,
          scheduled: scheduled ?? existingBot.dynamicData[0].scheduled,
          numberOfTrades:
            numberOfTrades ?? existingBot.dynamicData[0].numberOfTrades,
          percentageGain:
            percentageGain ?? existingBot.dynamicData[0].percentageGain,
          status: status ?? existingBot.dynamicData[0].status,
          reInvestment: reInvestment ?? existingBot.dynamicData[0].reInvestment,
          limits: limits ?? existingBot.dynamicData[0].limits,
        },
      ],
    };

    // Update the bot in the database
    const updatedBot = await Bot.findByIdAndUpdate(botId, updateFields, {
      new: true,
    });

    if (!updatedBot) {
      return res.status(404).json({ message: "Failed to update bot" });
    }

    res.status(200).json(updatedBot);
  } catch (error) {
    console.error("Error updating bot:", error);

    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res
        .status(400)
        .json({ message: "Validation failed", errors: validationErrors });
    }

    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete an AI trading bot
export const deleteBot = async (req, res) => {
  try {
    const botId = req.params.botId;

    if (!req.bot) {
      return res.status(404).json({ message: "Bot not found" });
    }

    // Delete the bot
    await Bot.findByIdAndDelete(botId);

    // Send a success response
    res.status(200).json({ message: "Bot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
