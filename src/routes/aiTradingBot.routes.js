import express from "express";
import {
  createBot,
  getBotsByUserId,
  updateBot,
  deleteBot,
  getAllBots,
  getBotById,
} from "../controllers/aiTradingBot.controller.js";
import { verifyUser } from "../middlewares/verifyUser.js";
import { checkBotAccess } from "../middlewares/validateBot.js";

const router = express.Router();

// Apply verifyUser middleware to all routes
router.use(verifyUser);

// Get all bots of all users (admin only)
router.get("/all", getAllBots);

// Create a new AI trading bot
router.post("/createBot/:userId", verifyUser, createBot);

// Get all AI trading bots for a user
router.get("/getBotsByUserId/:userId", getBotsByUserId);

// Get  AI trading bots BY ID
router.get("/users/:userId/bots/:botId", checkBotAccess, getBotById);

// Update an AI trading bot
router.put("/users/:userId/bots/:botId", checkBotAccess, updateBot);

// Delete an AI trading bot
router.delete("/users/:userId/bots/:botId", checkBotAccess, deleteBot);


export default router;
