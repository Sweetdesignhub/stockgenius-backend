// routes/brokers/zerodha/zerodha.route.js
import express from "express";
import {
  fetchZerodhaProfileAndSave,
  fetchZerodhaHoldingsAndSave,
  fetchZerodhaOrdersAndSave,
  fetchZerodhaPositionsAndSave,
  fetchZerodhaTradesAndSave,
  generateZerodhaAccessToken,
  generateZerodhaAuthCodeUrl,
  fetchZerodhaFundsAndSave,
  placeZerodhaOrder,
} from "../../../controllers/brokers/zerodha/zerodha.controller.js";
import { verifyUser } from "../../../middlewares/verifyUser.js";


const router = express.Router();

// API routes to fetch data from Zerodha and save in our DB

router.get(
  "/generateAuthCodeUrl/:userId",
  verifyUser,
  generateZerodhaAuthCodeUrl
);
router.post(
  "/generateAccessToken/:userId",
  verifyUser,
  generateZerodhaAccessToken
);
router.post("/fetchProfileAndSave/:userId", verifyUser, fetchZerodhaProfileAndSave);
router.post("/fetchPositionsAndSave/:userId", verifyUser, fetchZerodhaPositionsAndSave);
router.post("/fetchHoldingsAndSave/:userId", verifyUser, fetchZerodhaHoldingsAndSave);
router.post("/fetchOrdersAndSave/:userId", verifyUser, fetchZerodhaOrdersAndSave);
router.post("/fetchTradesAndSave/:userId", verifyUser, fetchZerodhaTradesAndSave);
router.post("/fetchFundsAndSave/:userId", verifyUser, fetchZerodhaFundsAndSave);
router.post('/placeOrder/:userId', verifyUser, placeZerodhaOrder);

// api routes to fetch from our db and display in ui or send to our core engine

import { fetchAllZerodhaUserDetails, fetchFundsByUser, fetchHoldingsByUser, fetchOrdersByUser, fetchPositionsByUser, fetchTradesByUser } from "../../../controllers/brokers/zerodha/FetchZerodhaDataFromDB.controller.js";

router.get(
  '/fetchAllZerodhaUserDetails/:userId', verifyUser,fetchAllZerodhaUserDetails);
router.get('/fundsByUserId/:userId', fetchFundsByUser);
router.get('/holdingsByUserId/:userId', fetchHoldingsByUser);
router.get('/ordersByUserId/:userId', fetchOrdersByUser);
router.get('/tradesByUserId/:userId', fetchTradesByUser);
router.get('/positionsByUserId/:userId', fetchPositionsByUser);

export default router;
