import { Router } from "express";
import {
  updateUser,
  deleteUser,
  fetchAllUsersWithAutoTradeBot,
  activateAutoTradeBotINTRADAY,
  activateAutoTradeBotCNC,
  deactivateAutoTradeBotINTRADAY,
  deactivateAutoTradeBotCNC,
} from "../controllers/user.controller.js";
import { verifyUser } from "../middlewares/verifyUser.js";

const router = Router();

router.post("/update/:id", verifyUser, updateUser);
router.delete("/delete/:id", verifyUser, deleteUser);

// Route to activate auto trade bot for a user
router.post(
  "/:userId/auto-trade-bot-INTRADAY/activate/bots/:botId",
  verifyUser,
  activateAutoTradeBotINTRADAY
);
router.post(
  "/:userId/auto-trade-bot-CNC/activate/bots/:botId",
  verifyUser,
  activateAutoTradeBotCNC
);

// Route to deactivate auto trade bot for a user
router.patch(
  "/:userId/auto-trade-bot-INTRADAY/deactivate/bots/:botId",
  verifyUser,
  deactivateAutoTradeBotINTRADAY
);
// Route to deactivate auto trade bot for a user
router.patch(
  "/:userId/auto-trade-bot-CNC/deactivate/bots/:botId",
  verifyUser,
  deactivateAutoTradeBotCNC
);

// get all user with auto trade activated
router.get("/autotradebot-users", fetchAllUsersWithAutoTradeBot);

export default router;
