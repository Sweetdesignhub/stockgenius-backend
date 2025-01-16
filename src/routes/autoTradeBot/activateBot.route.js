import { Router } from "express";
import { activateAutoTradeBotCNC } from "../../controllers/autoTradeBot/activateBot.controller.js";

const router = Router();

//activate bot
router.post(
  "/autoTradeBotCNC/users/:userId/bots/:botId",
  // verifyUser,
  activateAutoTradeBotCNC
);

export default router;
