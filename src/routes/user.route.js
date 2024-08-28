import { Router } from 'express';
import {
  updateUser,
  deleteUser,
  activateAutoTradeBot,
  deactivateAutoTradeBot,
  fetchAllUsersWithAutoTradeBot,
} from '../controllers/user.controller.js';
import { verifyUser } from '../middlewares/verifyUser.js';

const router = Router();

router.post('/update/:id', verifyUser, updateUser);
router.delete('/delete/:id', verifyUser, deleteUser);

// Route to activate auto trade bot for a user
router.post('/auto-trade-bot/activate/:userId', activateAutoTradeBot);

// Route to deactivate auto trade bot for a user
router.patch(
  '/auto-trade-bot/deactivate/:userId',
  verifyUser,
  deactivateAutoTradeBot
);

// get all user with auto trade activated
router.get('/autotradebot-users', fetchAllUsersWithAutoTradeBot);

export default router;
