import { Router } from "express";
import { fetchStockPriceController } from "../controllers/stocks.controller.js";


const router = Router();

router.get("/price/:stockSymbol", fetchStockPriceController);

export default router;
