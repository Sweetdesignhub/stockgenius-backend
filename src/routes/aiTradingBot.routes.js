import express from "express";
import {
  createBot,
  getBotsByUserId,
  getBotById,
  updateBot,
  deleteBot,
  toggleBotStatusINTRADAY,
  toggleBotStatusCNC,
  updateWorkingTime,
  getAllBots,
  checkBotAccess,
} from "../controllers/aiTradingBot.controller.js";
import { verifyUser } from "../middlewares/verifyUser.js";

const router = express.Router();

// Apply verifyUser middleware to all routes
// router.use(verifyUser);

// Get all bots of all users (admin only)
router.get("/all", getAllBots);

// Create a new AI trading bot
router.post("/createBot", createBot);

// Get all AI trading bots for a user
router.get("/getBotsByUserId", getBotsByUserId);

// Get a specific AI trading bot
router.get("/:id/getBotById", checkBotAccess, getBotById);

// Update an AI trading bot
router.put("/:id/updateBot", checkBotAccess, updateBot);

// Delete an AI trading bot
router.delete("/:id/deleteBot", checkBotAccess, deleteBot);

// Toggle bot status for INTRADAY
router.patch("/:id/toggle-intraday", checkBotAccess, toggleBotStatusINTRADAY);

// Toggle bot status for CNC
router.patch("/:id/toggle-cnc", checkBotAccess, toggleBotStatusCNC);

// Update bot's working time
router.patch("/:id/working-time", checkBotAccess, updateWorkingTime);

export default router;
