import { Router } from "express";
import {
  createBot,
  deleteBot,
  getAllBots,
  getBotById,
  getBotsByUserId,
  updateBot,
} from "../../controllers/autoTradeBot/bot.controller.js";
import { verifyUser } from "../../middlewares/verifyUser.js";
import { activateAutoTradeBotCNC } from "../../controllers/autoTradeBot/activateBot.controller.js";

const router = Router();

// Get all bots (admin only)
router.get("/bots", getAllBots);

// Create a new AI trading bot
router.post("/createBot/:userId", verifyUser, createBot);

// Get all AI trading bots for a user
router.get("/bots/user/:userId", getBotsByUserId);

// Get bot by ID for a user
router.get("/bots/:botId/user/:userId", getBotById);

// Update an existing AI trading bot
router.put("/users/:userId/bots/:botId", updateBot);

// Delete an AI trading bot
router.delete("/bots/:botId", deleteBot);


//activate bot
router.post(
  "/:userId/autoTradeBotCNC/activate/bots/:botId",
  // verifyUser,
  activateAutoTradeBotCNC
);

export default router;
