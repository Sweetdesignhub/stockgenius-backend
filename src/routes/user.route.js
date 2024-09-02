import { Router } from 'express';
import {
  updateUser,
  deleteUser,
  fetchAllUsersWithAutoTradeBot,
  activateAutoTradeBotINTRADAY,
  activateAutoTradeBotCNC,
  deactivateAutoTradeBotINTRADAY,
  deactivateAutoTradeBotCNC,
} from '../controllers/user.controller.js';
import { verifyUser } from '../middlewares/verifyUser.js';

const router = Router();

router.post('/update/:id', verifyUser, updateUser);
router.delete('/delete/:id', verifyUser, deleteUser);

// Route to activate auto trade bot for a user
router.post('/auto-trade-bot-INTRADAY/activate/:userId', activateAutoTradeBotINTRADAY);
router.post('/auto-trade-bot-CNC/activate/:userId', activateAutoTradeBotCNC);

// Route to deactivate auto trade bot for a user
router.patch(
  '/auto-trade-bot-INTRADAY/deactivate/:userId',
  deactivateAutoTradeBotINTRADAY
);
// Route to deactivate auto trade bot for a user
router.patch(
  '/auto-trade-bot-CNC/deactivate/:userId',
  deactivateAutoTradeBotCNC
);

// get all user with auto trade activated
router.get('/autotradebot-users', fetchAllUsersWithAutoTradeBot);

export default router;
