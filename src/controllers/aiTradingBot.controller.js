import User from "../models/user.js";
import FyersUserDetail from "../models/brokers/fyers/fyersUserDetail.model.js";
import moment from "moment";
import AITradingBot from "../models/aiTradingBot.model.js";

console.log("AITradingBot:", AITradingBot);

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
    market,
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
  const requiredFields = [
    "name",
    "profitPercentage",
    "riskPercentage",
    "productType",
  ];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res
        .status(400)
        .json({ message: `Missing required field: ${field}` });
    }
  }

  // Validate product type
  if (!["INTRADAY", "CNC"].includes(productType)) {
    return res
      .status(400)
      .json({ message: "Invalid product type. Must be 'INTRADAY' or 'CNC'." });
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
      return res
        .status(404)
        .json({
          message: "Fyers user details not found or access token missing",
        });
    }

    // Check if a bot of the same productType already exists for today
    const today = moment().startOf("day").toDate();
    const existingBot = await AITradingBot.findOne({
      userId,
      productType,
      createdAt: { $gte: today },
    });

    if (existingBot) {
      return res.status(400).json({
        message: `A ${productType} bot has already been created today. You can only create one ${productType} bot per day.`,
      });
    }

    // Create bot object with all fields from the schema
    const botData = {
      name,
      image,
      profitPercentage,
      riskPercentage,
      market,
      extraImage,
      dynamicData: [
        {
          tradeRatio,
          profitGained,
          workingTime,
          totalBalance,
          scheduled,
          numberOfTrades,
          percentageGain,
          status: status || "Inactive",
          reInvestment,
          limits,
        },
      ],
      productType,
      userId,
      broker: "Fyers",
    };

    // Create and save the bot
    const newBot = new AITradingBot(botData);
    const savedBot = await newBot.save();

    res.status(201).json(savedBot);
  } catch (error) {
    console.error("Error creating bot:", error);

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

export const getBotById = async (req, res) => {
  try {
    const botId = req.params.botId;
    const bot = await AITradingBot.findById(botId);

    if (!bot) {
      return res.status(404).json({ message: "Bot not found" });
    }

    // Check if the bot belongs to the user (if using middleware)
    if (req.bot.userId.toString() !== req.params.userId) {
      return res.status(403).json({
        message:
          "Access denied. You do not have permission to access this bot.",
      });
    }

    // Send the bot details
    res.status(200).json(bot);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    totalBalance,
    scheduled,
    numberOfTrades,
    percentageGain,
    status,
    reInvestment,
    limits,
    productType,
  } = req.body;

  try {
    // Ensure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate FyersUserDetail
    const fyersUserDetails = await FyersUserDetail.findOne({ userId });
    if (!fyersUserDetails || !fyersUserDetails.accessToken) {
      return res
        .status(404)
        .json({
          message: "Fyers user details not found or access token missing",
        });
    }

    // Validate if the bot exists
    const existingBot = await AITradingBot.findOne({ _id: botId, userId });
    if (!existingBot) {
      return res.status(404).json({ message: "AI trading bot not found" });
    }

    // Validate productType update
    if (productType && productType !== existingBot.productType) {
      const today = moment().startOf("day").toDate();
      const sameDayBot = await AITradingBot.findOne({
        userId,
        productType,
        createdAt: { $gte: today },
      });

      if (sameDayBot) {
        return res.status(400).json({
          message: `A ${productType} bot has already been created today. You can only create one ${productType} bot per day.`,
        });
      }
    }

    // Build the update object
    const updateFields = {
      ...(name && { name }),
      ...(image && { image }),
      ...(profitPercentage && { profitPercentage }),
      ...(riskPercentage && { riskPercentage }),
      ...(market && { market }),
      ...(extraImage && { extraImage }),
      ...(productType && { productType }),
    };

    // Update dynamic data if provided
    if (
      tradeRatio ||
      profitGained ||
      workingTime ||
      totalBalance ||
      scheduled ||
      numberOfTrades ||
      percentageGain ||
      status ||
      reInvestment ||
      limits
    ) {
      updateFields.dynamicData = {
        tradeRatio: tradeRatio ?? existingBot.dynamicData[0].tradeRatio,
        profitGained: profitGained ?? existingBot.dynamicData[0].profitGained,
        workingTime: workingTime ?? existingBot.dynamicData[0].workingTime,
        totalBalance: totalBalance ?? existingBot.dynamicData[0].totalBalance,
        scheduled: scheduled ?? existingBot.dynamicData[0].scheduled,
        numberOfTrades:
          numberOfTrades ?? existingBot.dynamicData[0].numberOfTrades,
        percentageGain:
          percentageGain ?? existingBot.dynamicData[0].percentageGain,
        status: status ?? existingBot.dynamicData[0].status,
        reInvestment: reInvestment ?? existingBot.dynamicData[0].reInvestment,
        limits: limits ?? existingBot.dynamicData[0].limits,
      };
    }

    console.log("Update fields:", updateFields);

    // Update the bot in the database
    const updatedBot = await AITradingBot.findByIdAndUpdate(
      botId,
      updateFields,
      { new: true }
    );

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
    await AITradingBot.findByIdAndDelete(botId);

    // Send a success response
    res.status(200).json({ message: "Bot deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
