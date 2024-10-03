// routes/brokers/zerodha/zerodha.route.js
import express from "express";
import {
  fetchZerodhaFundsAndSave,
  fetchZerodhaHoldingsAndSave,
  fetchZerodhaOrdersAndSave,
  fetchZerodhaPositionsAndSave,
  fetchZerodhaProfile,
  fetchZerodhaTradesAndSave,
  generateZerodhaAccessToken,
  generateZerodhaAuthCodeUrl,
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
router.post("/fetchProfileAndSave/:userId", verifyUser, fetchZerodhaProfile);
router.post("/fetchPositionsAndSave/:userId", verifyUser, fetchZerodhaPositionsAndSave);
router.post("/fetchHoldingsAndSave/:userId", verifyUser, fetchZerodhaHoldingsAndSave);
router.post("/fetchOrdersAndSave/:userId", verifyUser, fetchZerodhaOrdersAndSave);
router.post("/fetchTradesAndSave/:userId", verifyUser, fetchZerodhaTradesAndSave);
router.post("/fetchFundsAndSave/:userId", verifyUser, fetchZerodhaFundsAndSave);

export default router;
