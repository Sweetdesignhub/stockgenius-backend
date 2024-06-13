import { Router } from "express";
import {
  generateFyersToken,
  googleSignin,
  signin,
  signout,
  signup,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { placeTrade } from "../controllers/trade.controller.js";

const router = Router();

router.post("/sign-up", signup);
router.post("/sign-in", signin);
router.post("/google-signin", googleSignin);
router.post("/sign-out", signout);

router.post('/generate-fyers-token', verifyToken, generateFyersToken);
router.post('/place-trade', verifyToken, placeTrade);

export default router;
