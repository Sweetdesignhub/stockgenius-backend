import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
// import routes
import userRoutes from "./routes/user.route.js";
// import authRoutes from './routes/auth.route.js';
import fyersRoutes from "./routes/brokers/fyers/fyers.route.js";
import authRoutes from "./routes/auth.js";
import {
  startReportScheduler,
  scheduleEmailTopGainer,
  scheduleEmailTopLosers,
} from "./utils/orderReportGenerator.js";
import aiTradingBotRoutes from "./routes/aiTradingBot.route.js";
import ipoDataRoutes from "./routes/ipos/ipoData.route.js";
import ipoSuggestionCardRoutes from "./routes/ipos/ipoSuggestionCard.route.js";
import startBotScheduler from "./services/botScheduler.js";

import paperTradesRoutes from "./routes/paperTrading/paperTrade.route.js";
import processPendingOrders from "./services/paperTrading/processPendingOrders.js";

import stockRealTimePrice from './routes/stock.route.js'
import movePositionsToHoldings from "./services/paperTrading/movePositionsToHoldings.js";

dotenv.config();

const app = express();
const url = process.env.BASE_URL + "/api/v1/fyers/fetchOrders";
app.use(helmet());
// app.use(cors());
app.use(morgan("dev"));

const allowedOrigins = [
  "https://www.stockgenius.ai",
  "http://localhost:5173",
  "https://stockgenius.ai",
  "http://127.0.0.1:5173",
  "https://main.d25eiqtm1m2vp1.amplifyapp.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-XSRF-TOKEN",
      "X-Requested-With",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Log requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes declaration
// app.use('/api', apiLimiter);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/fyers", fyersRoutes);

//aitradingbot
app.use("/api/v1/ai-trading-bots", aiTradingBotRoutes);

//ipo
app.use("/api/v1/IPOs", ipoDataRoutes);
app.use("/api/v1/IPOs", ipoSuggestionCardRoutes);

//paperTrading
app.use("/api/v1/paper-trading", paperTradesRoutes);

//fetch real time prize
app.use("/api/v1/stocks", stockRealTimePrice);

app.use(errorHandler);

//8am report
scheduleEmailTopGainer();
scheduleEmailTopLosers();

startReportScheduler(); //evening report
// Start the scheduler for activate and deactivate bot
startBotScheduler();

//paperTrading
// processPendingOrders();

movePositionsToHoldings()


export { app };
