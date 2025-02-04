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

import autoTradeBotRoutes from "./routes/autoTradeBot/bot.route.js";

import paperTradesRoutes from "./routes/paperTrading/paperTrade.route.js";
import activateBotRoutes from './routes/autoTradeBot/activateBot.route.js'
import processPendingOrders from "./services/paperTrading/processPendingOrders.js";

import './services/paperTrading/activateDeactivateBot.js'

import stockRealTimePrice from './routes/stock.route.js'
import movePositionsToHoldings from "./services/paperTrading/movePositionsToHoldings.js";
// import startBotSchedulerPT from "./services/paperTrading/paperTradingBotScheduler.js";
import User from "./models/user.js";
import Bot from "./models/autoTradeBot/bot.model.js";

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
    methods: ["GET", "POST", "PUT", "DELETE","PATCH", "OPTIONS"],
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

//aitradingbot CRUD old
app.use("/api/v1/ai-trading-bots", aiTradingBotRoutes);

//ipo
app.use("/api/v1/IPOs", ipoDataRoutes);
app.use("/api/v1/IPOs", ipoSuggestionCardRoutes);

//autotradebot
app.use("/api/v1/autotrade-bots", autoTradeBotRoutes);

//paperTrading CRUD BOT latest
app.use("/api/v1/paper-trading", paperTradesRoutes);

//activateBots
app.use("/api/v1/autoTradeBot", activateBotRoutes);

//fetch real time prize
app.use("/api/v1/stocks", stockRealTimePrice);

app.use(errorHandler);

//8am report
scheduleEmailTopGainer();
scheduleEmailTopLosers();

startReportScheduler(); //evening report
// Start the scheduler for activate and deactivate bot
startBotScheduler();

// Start the scheduler for activate and deactivate bot for papertrading
// startBotSchedulerPT();

//paperTrading
// processPendingOrders();

// movePositionsToHoldings()

//script to create papertrade default bot

const createDefaultBotsForExistingUsers = async () => {
  try {
    const users = await User.find(); // Fetch all users

    for (const user of users) {
      // Check if the user already has a default bot
      const existingBot = await Bot.findOne({ userId: user._id, isDefault: true });

      if (!existingBot) {
        try {
          // Create a default bot if none exists
          await Bot.create({
            userId: user._id,
            name: 'Default PaperTradeBot', // Corrected field
            profitPercentage: '5', // Profit Percentage as a string
            riskPercentage: '2', // Risk Percentage as a string
            productType: 'CNC',
            isDefault: true,
            isActive: false,
            broker: 'PaperTrading',
            dynamicData: [
              {
                tradeRatio: 50,
                profitGained: 0,
                workingTime: "0",
                todaysBotTime: "0",
                currentWeekTime: "0",
                totalBalance: 0,
                status: 'Inactive',
                limits: 0,
              },
            ],
          });

          console.log(`Default bot created for user: ${user._id}`);
        } catch (botError) {
          console.error(`Error creating bot for user ${user._id}:`, botError.message);
        }
      } else {
        console.log(`Default bot already exists for user: ${user._id}`);
      }
    }
  } catch (error) {
    console.error('Error fetching users or creating bots:', error.message);
  }
};

// // Run the script
// createDefaultBotsForExistingUsers();

export { app };
