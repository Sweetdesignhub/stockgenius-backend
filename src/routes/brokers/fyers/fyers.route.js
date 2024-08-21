import express from "express";
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
} from "../../../controllers/brokers/fyers/fyers.controller.js";
import { verifyToken } from "../../../middlewares/verifyUser.js";

const router = express.Router();

//api routes to fetch data from fyers and save in our db

router.get("/generateAuthCodeUrl/:userId", verifyToken, generateAuthCodeUrl);
router.post("/generateAccessToken/:userId", verifyToken, generateAccessToken);
router.post("/fetchProfileAndSave/:userId", verifyToken, fetchProfileAndSave);
router.post("/fetchFundsAndSave/:userId", fetchFundsAndSave);
router.post("/fetchHoldingsAndSave/:userId", verifyToken, fetchHoldingsAndSave);
router.post(
  "/fetchPositionsAndSave/:userId",
  fetchPositionsAndSave
);
router.post("/fetchTradesAndSave/:userId", verifyToken, fetchTradesAndSave);
router.post("/fetchOrdersAndSave/:userId", verifyToken, fetchOrdersAndSave);
router.post("/placeOrder/:userId", verifyToken, placeOrder);
router.post("/placeMultipleOrders/:userId", placeMultipleOrders);

// api routes to fetch from our db and display in ui or send to our core engine

import {
  fetchAllFyersUserDetails,
  fetchFundsByUser,
  fetchHoldingsByUser,
  fetchOrdersByUser,
  fetchTradesByUser,
  fetchPositionsByUser,
} from "../../../controllers/brokers/fyers/FetchFyersDataFromDB.controller.js";
import { validateAutoTradeBot } from "../../../middlewares/validateAutoTradeBot.js";


router.get(
  "/fetchAllFyersUserDetails/:userId",
  validateAutoTradeBot,
  fetchAllFyersUserDetails
);
router.get("/fundsByUserId/:userId", fetchFundsByUser);
router.get("/holdingsByUserId/:userId", fetchHoldingsByUser);
router.get("/ordersByUserId/:userId", fetchOrdersByUser);
router.get("/tradesByUserId/:userId", fetchTradesByUser);
router.get("/positionsByUserId/:userId", fetchPositionsByUser);

export default router;
