import ActivatedBot from "../../models/activatedBot.model.js";
import Bot from "../../models/autoTradeBot/bot.model.js";
import User from "../../models/user.js";
import {
  sendCoreEngineEmail,
  sendUserBotStoppedEmail,
} from "../../services/emailService.js";
import {
  endHour,
  endMin,
  startHour,
  startMin,
} from "../../utils/endStartTime.js";
import { getCurrentTime, isWithinTradingHours } from "../../utils/helper.js";
import { placeOrderBot } from "../paperTrading/ordersPT.controller.js";
import axios from "axios";

const TIME_CONDITION_START =
  `${startHour.toString().padStart(2, "0")}:${startMin
    .toString()
    .padStart(2, "0")}` || "09:15";

const TIME_CONDITION_END =
  `${endHour.toString().padStart(2, "0")}:${endMin
    .toString()
    .padStart(2, "0")}` || "15:30";

const activeIntervals = {
  cnc: {},
};

const axiosConfig = {
  timeout: 30000,
};

const INTERVAL_DURATION_MS = 40 * 1000; // Interval for auto-trade loop

// Helper: Validate required inputs
const validateInputs = ({ userId, marginProfit, marginLoss }) => {
  if (!userId || isNaN(marginProfit) || isNaN(marginLoss)) {
    throw new Error("Missing or invalid required parameters");
  }
};

// Helper: Validate user and bot
const validateUserAndBot = async (userId, botId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const bot = await Bot.findOne({ _id: botId, userId });
  if (!bot) throw new Error("Auto trade bot not found");

  return { user, bot };
};

// Helper: Check time validity
const isWithinTradingHours = () => {
  const currentTime = getCurrentTime();
  return currentTime >= TIME_CONDITION_START && currentTime <= TIME_CONDITION_END;
};

// Helper: Fetch decisions and reinvestment data
const fetchTradingData = async (userId, marginProfit, marginLoss) => {
  const pythonServerUrl =
    "http://13.201.115.151:8000/autoTrading/paperTrading/CNC";
  const response = await axios.post(
    pythonServerUrl,
    { userId, marginProfit, marginLoss },
    axiosConfig
  );
  return response.data;
};

// Helper: Process and place orders
const processAndPlaceOrders = async (
  userId,
  decisions,
  reinvestmentData,
  res
) => {
  const combinedData = [
    ...decisions
      .filter((decision) => decision.Decision !== "Hold")
      .map((decision) => ({
        stockSymbol: decision.Symbol,
        quantity: decision.Quantity,
        action: decision.Decision === "Sell" ? "SELL" : "BUY",
      })),
    ...reinvestmentData.map((reinvestment) => ({
      stockSymbol: reinvestment.Symbol,
      quantity: reinvestment.Quantity,
      action: "BUY", // Assuming reinvestment is always a buy
    })),
  ];

  // Place orders
  const orderPromises = combinedData.map(async (order) => {
    const { stockSymbol, quantity, action } = order;

    const orderDetails = {
      stockSymbol,
      action,
      orderType: "MARKET",
      quantity,
      limitPrice: 0,
      stopPrice: 0,
      productType: "CNC",
      exchange: "NSE",
      autoTrade: true,
    };

    return await placeOrderBot({ body: orderDetails, params: { userId } }, res);
  });

  return await Promise.all(orderPromises);
};

// Main Function
export const activateAutoTradeBotCNC = async (req, res) => {
  const { userId, botId } = req.params;
  const { marginProfitPercentage, marginLossPercentage } = req.body;

  try {
    const marginProfit = parseFloat(marginProfitPercentage);
    const marginLoss = parseFloat(marginLossPercentage);

    // Validate inputs
    validateInputs({ userId, marginProfit, marginLoss });

    // Validate user and bot
    const { user, bot } = await validateUserAndBot(userId, botId);
    console.log(bot.dynamicData[0].status);

    // Check trading hours
    if (!isWithinTradingHours()) {
      return res.status(400).json({
        message: "Auto trading can only be activated between 9:15 AM and 3:30 PM",
      });
    }

    // Set bot to active
    user.autoTradeBotPaperTradingCNC = "active";

    await user.save();

    bot.dynamicData[0].status = "Running";
    await bot.save();

    // Auto-trade loop function
    const autoTradeLoop = async () => {
      try {
        const updatedUser = await User.findById(userId);

        if (updatedUser.autoTradeBotPaperTradingCNC !== "active") {
          clearInterval(activeIntervals.cnc[userId]);
          delete activeIntervals.cnc[userId];
          return;
        }

        if (!isWithinTradingHours()) {
          user.autoTradeBotPaperTradingCNC = "inactive";
          await user.save();
          clearInterval(activeIntervals.cnc[userId]);
          delete activeIntervals.cnc[userId];
          return;
        }

        const [decisions, reinvestmentData] = await fetchTradingData(
          userId,
          marginProfit,
          marginLoss
        );

        console.log("decisions for papertrading", decisions);
        console.log("reinvestment for papertrading", reinvestmentData);

        const orderResults = await processAndPlaceOrders(
          userId,
          decisions.decision,
          reinvestmentData.reinvestment,
          res
        );

        console.log("Orders processed:", orderResults);
      } catch (error) {
        console.error("Error in auto-trade loop:", error);
        clearInterval(activeIntervals.cnc[userId]);
        delete activeIntervals.cnc[userId];
        user.autoTradeBotPaperTradingCNC = "inactive";
        await user.save();

        bot.dynamicData[0].status = "Stopped";
        await bot.save();

        await sendCoreEngineEmail(userId, user.name, error, "PaperTrading");
        await sendUserBotStoppedEmail(user.email, user.name, "paperTrading");
      }
    };

    // Start interval
    if (activeIntervals.cnc[userId]) {
      clearInterval(activeIntervals.cnc[userId]);
    }
    activeIntervals.cnc[userId] = setInterval(
      autoTradeLoop,
      INTERVAL_DURATION_MS
    );

    console.log("Auto-trade loop started for user:", userId);

    // Immediate first execution
    await autoTradeLoop();

    // Save activated bot details
    await ActivatedBot.create({
      userId,
      botId,
      name: user.name,
      email: user.email,
      botType: "CNC",
    });

    return res
      .status(200)
      .json({ message: "Auto-trade bot activated successfully" });
  } catch (error) {
    console.error("Error activating auto-trade bot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deactivateAutoTradeBotCNC = async (req, res) => {
  const { userId, botId } = req.params;

  if (!userId || !botId) {
    return res
      .status(400)
      .json({ message: "Missing required parameters: userId or botId" });
  }

  try {
    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the bot
    const bot = await Bot.findOne({ _id: botId, userId });
    if (!bot) {
      return res.status(404).json({ message: "Auto trade bot not found" });
    }

    // Debug logs
    console.log("Bot status:", bot.dynamicData[0].status);
    console.log("Active interval:", activeIntervals.cnc[userId]);

    // Allow deactivation if bot is scheduled or loop is not running
    if (bot.dynamicData[0].status === "Schedule" || activeIntervals.cnc[userId]) {
      // Stop the loop if active
      if (activeIntervals.cnc[userId]) {
        console.log("Stopping active auto-trade loop for user:", userId);
        clearInterval(activeIntervals.cnc[userId]);
        delete activeIntervals.cnc[userId];
      }

      // Update user and bot statuses
      user.autoTradeBotPaperTradingCNC = "stopped";
      await user.save();

      // Update dynamic data status
      if (bot.dynamicData.length > 0) {
        bot.dynamicData[0].status = "Stopped";
        await bot.save();
      }

      console.log("Auto-trade bot deactivated successfully for user:", userId);
      return res.status(200).json({
        message: "Auto-trade bot deactivated successfully",
      });
    }

    // Error: Bot is neither scheduled nor active
    return res.status(400).json({
      message: "Auto-trade bot is not currently active or scheduled",
    });
  } catch (error) {
    console.error("Error deactivating auto trade bot:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



// for cnc market
// export const activateAutoTradeBotCNC = async (req, res) => {
//   const { userId, botId } = req.params;
//   const { marginProfitPercentage, marginLossPercentage } = req.body;

//   const marginProfit = parseFloat(marginProfitPercentage);
//   const marginLoss = parseFloat(marginLossPercentage);

//   if (!userId || isNaN(marginProfit) || isNaN(marginLoss)) {
//     return res
//       .status(400)
//       .json({ message: "Missing or invalid required parameters" });
//   }

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Validate if the bot exists
//     const existingBot = await Bot.findOne({ _id: botId, userId });
//     if (!existingBot) {
//       return res.status(404).json({ message: "Auto trade bot not found" });
//     }

//     const broker = existingBot.broker;

//     // Broker-specific user details retrieval
//     let brokerUserDetails;
//     if (broker === "Fyers") {
//       brokerUserDetails = await FyersUserDetail.findOne({ userId });
//       if (!brokerUserDetails || !brokerUserDetails.accessToken) {
//         return res.status(404).json({
//           message: "Fyers user details not found or access token missing",
//         });
//       }
//     } else if (broker === "Zerodha") {
//       brokerUserDetails = await ZerodhaUserDetail.findOne({ userId });
//       if (!brokerUserDetails) {
//         return res
//           .status(404)
//           .json({ message: "Zerodha user details not found" });
//       }
//       // For Zerodha, access token might not be required in the same way as Fyers
//     } else if (broker === "PaperTrading") {
//       brokerUserDetails = { userId }; // No access token required for paper trading
//     } else {
//       return res.status(400).json({ message: "Unsupported broker" });
//     }

//     // Check time condition before starting the loop
//     const currentTime = getCurrentTime();
//     if (
//       currentTime < TIME_CONDITION_START ||
//       currentTime > TIME_CONDITION_END
//     ) {
//       return res.status(400).json({
//         message:
//           "Auto trading can only be activated between 9:15 AM and 3:30 PM",
//       });
//     }

//     // Set the bot status to 'active'
//     user.autoTradeBotCNC = "active";
//     await user.save();

//     const autoTradeLoop = async () => {
//       try {
//         const updatedUser = await User.findById(userId);

//         // Stop the loop if the bot status is not 'active'
//         if (updatedUser.autoTradeBotCNC === "stopped") {
//           console.log(
//             "Auto-trade loop stopped due to status:",
//             updatedUser.autoTradeBotCNC
//           );
//           if (activeIntervals.cnc[userId]) {
//             console.log("Clearing interval ID:", activeIntervals.cnc[userId]);
//             clearInterval(activeIntervals.cnc[userId]);
//             delete activeIntervals.cnc[userId];
//           }
//           console.log("Interval cleared and user status updated to inactive");
//           return;
//         }

//         // Check time condition
//         const currentTime = getCurrentTime();
//         if (
//           currentTime < TIME_CONDITION_START ||
//           currentTime > TIME_CONDITION_END
//         ) {
//           user.autoTradeBotCNC = "inactive";
//           await user.save();
//           if (activeIntervals.cnc[userId]) {
//             console.log(
//               "Clearing interval ID due to time condition:",
//               activeIntervals.cnc[userId]
//             );
//             clearInterval(activeIntervals.cnc[userId]);
//             delete activeIntervals.cnc[userId];
//           }
//           console.log(
//             "Auto trading can only be activated between 9:15 AM and 3:30 PM"
//           );
//           return;
//         }

//         user.autoTradeBotCNC = "running";
//         await user.save();

//         if (broker === "PaperTrading") {
//           // Fetch decisions and reinvestment data
//           // Call the Python server
//           const pythonServerUrl =
//             "http://13.201.115.151:8000/autoTrading/paperTrading/CNC";
//           const response = await axios.post(
//             pythonServerUrl,
//             {
//               userId,
//               marginProfit,
//               marginLoss,
//             },
//             axiosConfig
//           );
//           const decisions = response.data[0].decision;
//           const reinvestmentData = response.data[1].reinvestment;

//           console.log("Decisions", decisions);
//           console.log("reinvestment tickers", reinvestmentData);

//           // Combine decisions and reinvestment data
//           const combinedData = [
//             ...decisions
//               .filter((decision) => decision.Decision !== "Hold")
//               .map((decision) => ({
//                 stockSymbol: decision.Symbol,
//                 quantity: decision.Quantity,
//                 action: decision.Decision === "Sell" ? "SELL" : "BUY",
//               })),
//             ...reinvestmentData.map((reinvestment) => ({
//               stockSymbol: reinvestment.Symbol,
//               quantity: reinvestment.Quantity,
//               action: "BUY", // Assuming reinvestment is always a buy
//             })),
//           ];

//           // // Process each order for paper trading
//           // const orderPromises = combinedData.map(async (order) => {
//           //   const { stockSymbol, quantity, action } = order;

//           //   const orderDetails = {
//           //     stockSymbol,
//           //     action,
//           //     orderType: "MARKET",
//           //     quantity,
//           //     limitPrice: 0,
//           //     stopPrice: 0,
//           //     productType: "CNC",
//           //     exchange: "NSE",
//           //     autoTrade: true,
//           //   };

//           //   // Place the order
//           //   return await placeOrder({ body: orderDetails, params: { userId } }, res);
//           // });

//           // // Wait for all orders to be placed
//           // const orderResults = await Promise.all(orderPromises);
//           // console.log("Orders placed successfully:", orderResults);

//           // Place orders via API
//           const apiUrl =
//             `${API_BASE_URL}/api/v1/paper-trading/orders/place/66fb6e900665edf9447ca673`;
//           const orderPromises = combinedData.map(async (order) => {
//             try {
//               const response = await axios.post(apiUrl, order);
//               console.log(
//                 `Order placed successfully for ${order.stockSymbol}:`,
//                 response.data
//               );
//               return response.data;
//             } catch (error) {
//               console.error(
//                 `Failed to place order for ${order.stockSymbol}:`,
//                 error.response?.data || error.message
//               );
//               return { error: error.response?.data || error.message };
//             }
//           });

//           // Wait for all orders to complete
//           const orderResults = await Promise.all(orderPromises);
//           console.log("All paper trading orders processed:", orderResults);

//           return res
//             .status(200)
//             .json({
//               message: "Paper trading orders processed",
//               results: orderResults,
//             });
//         }
//          else if (broker === "Fyers") {
//           const accessToken =
//             broker === "Fyers" ? brokerUserDetails.accessToken : null;

//           // Fetch latest positions and save
//           const positionAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchPositionsAndSave/${userId}`;
//           const positionAndSaveResponse = await axios.post(positionAndSaveUrl, {
//             accessToken,
//           });

//           if (positionAndSaveResponse.status !== 200) {
//             throw new Error("Failed to fetch and save positions");
//           }

//           console.log(
//             "Position and save successful:",
//             positionAndSaveResponse.data
//           );
//           // Fetch latest holdings and save
//           const holdingAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchHoldingsAndSave/${userId}`;
//           const holdingAndSaveResponse = await axios.post(holdingAndSaveUrl, {
//             accessToken,
//           });

//           if (holdingAndSaveResponse.status !== 200) {
//             throw new Error("Failed to fetch and save holdings");
//           }

//           console.log(
//             "Holding and save successful:",
//             holdingAndSaveResponse.data
//           );

//           // Fetch funds
//           const fundsUrl = `${API_BASE_URL}/api/v1/fyers/fetchFundsAndSave/${userId}`;
//           const fundsResponse = await axios.post(fundsUrl, { accessToken });

//           if (fundsResponse.status !== 200) {
//             throw new Error("Failed to fetch funds data");
//           }

//           console.log("Funds fetched successfully:", fundsResponse.data);

//           // Call the Python server
//           const pythonServerUrl =
//             "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated_CNC";
//           const response = await axios.post(pythonServerUrl, {
//             userId,
//             marginProfit,
//             marginLoss,
//             accessToken,
//             broker,
//           });

//           if (response.data && Array.isArray(response.data)) {
//             const decisions = response.data[0].decision;
//             const reinvestmentData = response.data[1].reinvestment;

//             console.log("decisions:", decisions);
//             console.log("reinvestmentData:", reinvestmentData);

//             const combinedData = [
//               ...decisions
//                 .filter((decision) => decision.Decision !== "Hold")
//                 .map((decision) => ({
//                   symbol: decision.Symbol,
//                   qty: decision.Quantity,
//                   type: 2,
//                   side: decision.Decision === "Sell" ? -1 : 1,
//                   productType: "CNC",
//                   limitPrice: 0,
//                   stopPrice: 0,
//                   disclosedQty: 0,
//                   validity: "DAY",
//                   offlineOrder: false,
//                   stopLoss: 0,
//                   takeProfit: 0,
//                   orderTag: "autotrade",
//                 })),
//               ...reinvestmentData.map((reinvestment) => ({
//                 symbol: reinvestment.Symbol,
//                 qty: reinvestment.Quantity,
//                 type: 2,
//                 side: 1,
//                 productType: "CNC",
//                 limitPrice: 0,
//                 stopPrice: 0,
//                 disclosedQty: 0,
//                 validity: "DAY",
//                 offlineOrder: false,
//                 stopLoss: 0,
//                 takeProfit: 0,
//                 orderTag: "autotrade",
//               })),
//             ];

//             // Validate orders
//             const validatedOrders = combinedData
//               .map((order, index) => {
//                 const { isValid, errors } = validateOrder(order);
//                 if (!isValid) {
//                   console.log(
//                     `Order validation failed at index ${index}:`,
//                     errors
//                   );
//                   return null;
//                 }
//                 return order;
//               })
//               .filter((order) => order !== null);

//             console.log("Validated Orders:", validatedOrders);
//             console.log("Total validated orders:", validatedOrders.length);

//             const chunkSize = 10;
//             const orderChunks = chunkArray(validatedOrders, chunkSize);

//             for (const chunk of orderChunks) {
//               console.log("Placing orders:", chunk);

//               try {
//                 const placeOrderResponse = await axios.post(
//                   `${API_BASE_URL}/api/v1/fyers/placeMultipleOrders/${userId}`,
//                   { accessToken, orders: chunk }
//                 );
//                 const { successfulOrders = [], unsuccessfulOrders = [] } =
//                   placeOrderResponse.data;
//                 if (successfulOrders.length > 0) {
//                   console.log("Successful orders:", successfulOrders);
//                 }
//                 if (unsuccessfulOrders.length > 0) {
//                   console.log("Failed orders:", unsuccessfulOrders);
//                 }
//               } catch (error) {
//                 console.error("Error placing orders:", error);
//                 throw error;
//               }
//             }

//             user.autoTradeBotCNC = "active";
//             await user.save();

//             console.log(
//               "Orders placed successfully, auto trade bot set to active"
//             );

//             // Fetch orders and save
//             const ordersAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchOrdersAndSave/${userId}`;
//             const ordersAndSaveResponse = await axios.post(ordersAndSaveUrl, {
//               accessToken,
//             });

//             if (ordersAndSaveResponse.status !== 200) {
//               throw new Error("Failed to fetch and save positions");
//             }
//             console.log(
//               "Orders and save successful:",
//               ordersAndSaveResponse.data
//             );

//             // Fetch trades and save
//             const tradesAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchTradesAndSave/${userId}`;
//             const tradesAndSaveResponse = await axios.post(tradesAndSaveUrl, {
//               accessToken,
//             });

//             if (tradesAndSaveResponse.status !== 200) {
//               throw new Error("Failed to fetch and save positions");
//             }
//             console.log(
//               "Orders and save successful:",
//               tradesAndSaveResponse.data
//             );
//           } else {
//             console.error("Unexpected response format:", response.data);
//           }
//         }
//       } catch (error) {
//         console.error("Error in auto trade loop:", error);
//         user.autoTradeBotCNC = "inactive";
//         await user.save();
//         if (activeIntervals.cnc[userId]) {
//           console.log(
//             "Clearing interval ID due to error:",
//             activeIntervals.cnc[userId]
//           );
//           clearInterval(activeIntervals.cnc[userId]);
//           delete activeIntervals.cnc[userId];
//         }

//         const bot = await Bot.findOne({ _id: botId, userId });
//         // console.log(bot);

//         if (!bot) {
//           throw new Error("Bot not found");
//         }

//         if (bot.productType === "CNC") {
//           const latestDynamicData = bot.dynamicData[0];
//           if (latestDynamicData) {
//             latestDynamicData.status = "Inactive";
//             await bot.save();
//             console.log("bot status ot inactive");
//           }
//           // await sendCoreEngineEmail(userId, user.name, error, "CNC");
//           // await sendUserBotStoppedEmail(user.email, user.name, "CNC");
//         }
//       }
//     };

//     // Check if a loop is already running
//     if (activeIntervals.cnc[userId]) {
//       console.log(
//         "Clearing existing interval ID:",
//         activeIntervals.cnc[userId]
//       );
//       clearInterval(activeIntervals.cnc[userId]);
//     }

//     // Determine interval duration based on broker type
//     const intervalDuration = broker === "PaperTrading" ? 40 * 1000 : 15 * 1000;

//     // Set the interval for the auto trade loop
//     activeIntervals.cnc[userId] = setInterval(autoTradeLoop, intervalDuration);

//     // activeIntervals.cnc[userId] = setInterval(autoTradeLoop, 40 * 1000);
//     console.log("Auto-trade loop started with interval of 15 seconds");

//     await autoTradeLoop();

//     // Save activated bot data
//     await ActivatedBot.create({
//       userId: userId,
//       botId: botId,
//       name: user.name,
//       email: user.email,
//       botType: "CNC",
//     });

//     return res
//       .status(200)
//       .json({ message: "Auto trade bot activated for CNC", userId });
//   } catch (error) {
//     console.error("Error activating auto trade bot:", error);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };

// export const activateAutoTradeBotCNC = async (req, res) => {
//   const { userId, botId } = req.params;
//   const { marginProfitPercentage, marginLossPercentage } = req.body;

//   const marginProfit = parseFloat(marginProfitPercentage);
//   const marginLoss = parseFloat(marginLossPercentage);

//   if (!userId || isNaN(marginProfit) || isNaN(marginLoss)) {
//     return res
//       .status(400)
//       .json({ message: "Missing or invalid required parameters" });
//   }

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Validate if the bot exists
//     const existingBot = await Bot.findOne({ _id: botId, userId });
//     if (!existingBot) {
//       return res.status(404).json({ message: "Auto trade bot not found" });
//     }

//     // Check time condition before starting the loop
//     const currentTime = getCurrentTime();
//     if (
//       currentTime < TIME_CONDITION_START ||
//       currentTime > TIME_CONDITION_END
//     ) {
//       return res.status(400).json({
//         message:
//           "Auto trading can only be activated between 9:15 AM and 3:30 PM",
//       });
//     }

//     // Set the bot status to 'active'
//     user.autoTradeBotCNC = "active";
//     await user.save();

//     const autoTradeLoop = async () => {
//       try {
//         const updatedUser = await User.findById(userId);

//         // Stop the loop if the bot status is not 'active'
//         if (updatedUser.autoTradeBotCNC === "stopped") {
//           console.log(
//             "Auto-trade loop stopped due to status:",
//             updatedUser.autoTradeBotCNC
//           );
//           if (activeIntervals.cnc[userId]) {
//             console.log("Clearing interval ID:", activeIntervals.cnc[userId]);
//             clearInterval(activeIntervals.cnc[userId]);
//             delete activeIntervals.cnc[userId];
//           }
//           console.log("Interval cleared and user status updated to inactive");
//           return;
//         }

//         // Check time condition
//         const currentTime = getCurrentTime();
//         if (
//           currentTime < TIME_CONDITION_START ||
//           currentTime > TIME_CONDITION_END
//         ) {
//           user.autoTradeBotCNC = "inactive";
//           await user.save();
//           if (activeIntervals.cnc[userId]) {
//             console.log(
//               "Clearing interval ID due to time condition:",
//               activeIntervals.cnc[userId]
//             );
//             clearInterval(activeIntervals.cnc[userId]);
//             delete activeIntervals.cnc[userId];
//           }
//           console.log(
//             "Auto trading can only be activated between 9:15 AM and 3:30 PM"
//           );
//           return;
//         }

//         user.autoTradeBotCNC = "running";
//         await user.save();

//         // Fetch decisions and reinvestment data
//         const pythonServerUrl =
//           "http://13.201.115.151:8000/autoTrading/paperTrading/CNC";
//         const response = await axios.post(
//           pythonServerUrl,
//           {
//             userId,
//             marginProfit,
//             marginLoss,
//           },
//           axiosConfig
//         );
//         const decisions = response.data[0].decision;
//         const reinvestmentData = response.data[1].reinvestment;

//         console.log("Decisions", decisions);
//         console.log("reinvestment tickers", reinvestmentData);

//         // Combine decisions and reinvestment data
//         const combinedData = [
//           ...decisions
//             .filter((decision) => decision.Decision !== "Hold")
//             .map((decision) => ({
//               stockSymbol: decision.Symbol,
//               quantity: decision.Quantity,
//               action: decision.Decision === "Sell" ? "SELL" : "BUY",
//             })),
//           ...reinvestmentData.map((reinvestment) => ({
//             stockSymbol: reinvestment.Symbol,
//             quantity: reinvestment.Quantity,
//             action: "BUY", // Assuming reinvestment is always a buy
//           })),
//         ];

//         // Process each order for paper trading
//         const orderPromises = combinedData.map(async (order) => {
//           const { stockSymbol, quantity, action } = order;

//           const orderDetails = {
//             stockSymbol,
//             action,
//             orderType: "MARKET",
//             quantity,
//             limitPrice: 0,
//             stopPrice: 0,
//             productType: "CNC",
//             exchange: "NSE",
//             autoTrade: true,
//           };

//           // Place the order
//           return await placeOrder({ body: orderDetails, params: { userId } }, res);
//         });

//         // Wait for all orders to be placed
//         const orderResults = await Promise.all(orderPromises);
//         console.log("Orders placed successfully:", orderResults);

//         // If all the orders are processed, send response after loop ends.
//         return { message: "Paper trading orders processed", results: orderResults };
//       } catch (error) {
//         console.error("Error in auto trade loop:", error);
//         user.autoTradeBotCNC = "inactive";
//         await user.save();
//         if (activeIntervals.cnc[userId]) {
//           console.log(
//             "Clearing interval ID due to error:",
//             activeIntervals.cnc[userId]
//           );
//           clearInterval(activeIntervals.cnc[userId]);
//           delete activeIntervals.cnc[userId];
//         }

//         const bot = await Bot.findOne({ _id: botId, userId });
//         if (!bot) {
//           throw new Error("Bot not found");
//         }

//         if (bot.productType === "CNC") {
//           const latestDynamicData = bot.dynamicData[0];
//           if (latestDynamicData) {
//             latestDynamicData.status = "Inactive";
//             await bot.save();
//             console.log("bot status set to inactive");
//           }
//         }
//       }
//     };

//     // Check if a loop is already running
//     if (activeIntervals.cnc[userId]) {
//       console.log(
//         "Clearing existing interval ID:",
//         activeIntervals.cnc[userId]
//       );
//       clearInterval(activeIntervals.cnc[userId]);
//     }

//     // Set the interval for the auto trade loop
//     const intervalDuration = 40 * 1000;
//     activeIntervals.cnc[userId] = setInterval(autoTradeLoop, intervalDuration);

//     console.log("Auto-trade loop started with interval of 40 seconds");

//     // Wait for the loop to complete before responding
//     const result = await autoTradeLoop();

//     // Save activated bot data
//     await ActivatedBot.create({
//       userId: userId,
//       botId: botId,
//       name: user.name,
//       email: user.email,
//       botType: "CNC",
//     });

//     return res
//       .status(200)
//       .json(result);
//   } catch (error) {
//     console.error("Error activating auto trade bot:", error);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };
