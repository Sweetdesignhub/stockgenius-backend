import cron from "node-cron";
import axios from "axios";
import Bot from "../../models/autoTradeBot/bot.model.js";
import { isWithinTradingHours } from "../../utils/helper.js";

const API_URL = "https://api.stockgenius.ai"; 
// const API_URL = "http://localhost:8080"; // Common base API URL

// Function to activate a specific bot
const activateBot = async (bot) => {
  const { userId, _id: botId, profitPercentage, riskPercentage } = bot;
  const activateUrl = `${API_URL}/api/v1/autoTradeBot/activate/users/${userId}/bots/${botId}`;
  const payload = { marginProfitPercentage: profitPercentage, marginLossPercentage: riskPercentage };

  try {
    const response = await axios.post(activateUrl, payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log(`Re-activated bot (${botId}):`, response.data.message);
  } catch (error) {
    console.error(`Failed to re-activate bot (${botId}):`, error.message);
  }
};

// Function to check and re-activate bots every 30 minutes during trading hours
const checkAndReactivateBots = async () => {
  try {
    // Use the reusable function to check trading hours
    if (!isWithinTradingHours()) {
      console.log("Outside trading hours. Skipping bot check.");
      return;
    }

    const activeBots = await Bot.find({ isActive: true }).lean();

    if (activeBots.length === 0) {
      console.log("No active bots found for reactivation check.");
      return;
    }

    for (const bot of activeBots) {
      const { dynamicData } = bot;

      if (
        dynamicData &&
        dynamicData[0] &&
        (dynamicData[0].status === "Stopped")
      ) {
        console.log(`Bot (${bot._id}) is ${dynamicData[0].status}. Attempting to re-activate...`);
        await activateBot(bot);
      }
    }
  } catch (error) {
    console.error("Error checking and re-activating bots:", error.message);
  }
};

// Function to activate bots at 9:15 AM
const activateBots = async () => {
  try {
    const activeBots = await Bot.find({ isActive: true }).lean();

    if (activeBots.length === 0) {
      console.log("No active bots found to activate.");
      return;
    }

    for (const bot of activeBots) {
      await activateBot(bot);
    }
  } catch (error) {
    console.error("Error fetching active bots for activation:", error.message);
  }
};

// Function to deactivate bots at 3:30 PM
const deactivateBots = async () => {
  try {
    const activeBots = await Bot.find({ isActive: true }).lean();

    if (activeBots.length === 0) {
      console.log("No active bots found to deactivate.");
      return;
    }

    for (const bot of activeBots) {
      const { userId, _id: botId } = bot;

      const deactivateUrl = `${API_URL}/api/v1/autoTradeBot/deactivate/users/${userId}/bots/${botId}`;

      try {
        const response = await axios.post(deactivateUrl);
        console.log(`Deactivated bot (${botId}):`, response.data.message);
      } catch (error) {
        console.error(`Failed to deactivate bot (${botId}):`, error.message);
      }
    }
  } catch (error) {
    console.error("Error fetching active bots for deactivation:", error.message);
  }
};

// Schedule the jobs
// Schedule activation at 9:15 AM
cron.schedule("15 9 * * *", activateBots);

// Schedule deactivation at 3:30 PM
cron.schedule("30 15 * * *", deactivateBots);

// Schedule reactivation check every 30 minutes during trading hours
cron.schedule("*/30 * * * *", checkAndReactivateBots);

console.log("Cron jobs for bot activation, deactivation, and reactivation check scheduled.");
