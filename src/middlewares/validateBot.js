import AITradingBot from "../models/aiTradingBot.model.js";

// Middleware to check if the user has access to the bot
export const checkBotAccess = async (req, res, next) => {
  const { botId, userId } = req.params;

  try {
    const bot = await AITradingBot.findById(botId);
    if (!bot) {
      return res.status(404).json({ message: "Bot not found" });
    }
    // Check if the bot belongs to the user
    if (bot.userId.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied. You do not have permission to access this bot.",
      });
    }
    req.bot = bot;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
