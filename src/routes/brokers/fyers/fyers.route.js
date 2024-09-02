import express from 'express';
import {
  generateAuthCodeUrl,
  generateAccessToken,
  fetchProfileAndSave,
  fetchFundsAndSave,
  fetchHoldingsAndSave,
  fetchPositionsAndSave,
  fetchTradesAndSave,
  placeOrder,
  placeMultipleOrders,
  fetchOrdersAndSave,
  exitPosition,
} from '../../../controllers/brokers/fyers/fyers.controller.js';
import { verifyUser } from '../../../middlewares/verifyUser.js';

const router = express.Router();

//api routes to fetch data from fyers and save in our db

router.get('/generateAuthCodeUrl/:userId', verifyUser, generateAuthCodeUrl);
router.post('/generateAccessToken/:userId', verifyUser, generateAccessToken);
router.post('/fetchProfileAndSave/:userId', verifyUser, fetchProfileAndSave);
router.post('/fetchFundsAndSave/:userId', fetchFundsAndSave);
router.post('/fetchHoldingsAndSave/:userId', fetchHoldingsAndSave);
router.post('/fetchPositionsAndSave/:userId', fetchPositionsAndSave);
router.post('/fetchTradesAndSave/:userId', verifyUser, fetchTradesAndSave);
router.post('/fetchOrdersAndSave/:userId', verifyUser, fetchOrdersAndSave);
router.post('/placeOrder/:userId', verifyUser, placeOrder);
router.post('/placeMultipleOrders/:userId', placeMultipleOrders);
router.post('/exit-position/:userId',verifyUser, exitPosition);

// api routes to fetch from our db and display in ui or send to our core engine

import {
  fetchAllFyersUserDetails,
  fetchFundsByUser,
  fetchHoldingsByUser,
  fetchOrdersByUser,
  fetchTradesByUser,
  fetchPositionsByUser,
} from '../../../controllers/brokers/fyers/FetchFyersDataFromDB.controller.js';
import { validateAutoTradeBot } from '../../../middlewares/validateAutoTradeBot.js';

router.get(
  '/fetchAllFyersUserDetails/:userId',
  validateAutoTradeBot,
  fetchAllFyersUserDetails
);
router.get('/fundsByUserId/:userId', fetchFundsByUser);
router.get('/holdingsByUserId/:userId', fetchHoldingsByUser);
router.get('/ordersByUserId/:userId', fetchOrdersByUser);
router.get('/tradesByUserId/:userId', fetchTradesByUser);
router.get('/positionsByUserId/:userId', fetchPositionsByUser);

export default router;
