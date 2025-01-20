import { Router } from "express";
import { activateAutoTradeBotCNC, deactivateAutoTradeBotCNC } from "../../controllers/autoTradeBot/activateBot.controller.js";

const router = Router();

//activate bot
router.post(
  "/activate/users/:userId/bots/:botId",
  // verifyUser,
  activateAutoTradeBotCNC
);

//deactivate
router.post(
  "/deactivate/users/:userId/bots/:botId",
  // verifyUser,
  deactivateAutoTradeBotCNC
);

export default router;
