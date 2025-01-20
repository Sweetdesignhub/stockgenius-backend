import { Router } from "express";
import { getPaperTradingData } from "../../controllers/paperTrading/paperTrade.controller.js";
import { getFunds } from "../../controllers/paperTrading/fundsPT.controller.js";
import {
  getAllOrders,
  modifyOrder,
  placeMultipleOrders,
  placeOrder,
} from "../../controllers/paperTrading/ordersPT.controller.js";
import {
  getHoldings,
  sellHoldings,
} from "../../controllers/paperTrading/holdingsPT.controller.js";
import {
  exitPosition,
  getPositions,
} from "../../controllers/paperTrading/positionsPT.controller.js";
import { getTrades } from "../../controllers/paperTrading/tradesPT.controller.js";

const router = Router();

// Route to get all paper trading data for a user
router.get("/data/:userId", getPaperTradingData);

// Place a new order
router.post("/orders/place/:userId", placeOrder);

// Place a multiple order
router.post("/orders/placeMultipleOrders/:userId", placeMultipleOrders);


// Modify an existing order (only if status is PENDING)
router.put("/orders/modify/:userId/:orderId", modifyOrder);
// Get all orders for a specific user
router.get("/orders/:userId", getAllOrders);

// Route to get holdings for a user
router.get("/holdings/:userId", getHoldings);
// Route to sell holdings for a user
router.post("/holdings/sell", sellHoldings);

// Route to fetch positions for a user
router.get("/positions/:userId", getPositions);
// Route to exit a position for a user
router.post("/positions/exit", exitPosition);

// Route to fetch trades for a user
router.get("/trades/:userId", getTrades);

// Get funds for a specific user
router.get("/funds/:userId", getFunds);

export default router;
