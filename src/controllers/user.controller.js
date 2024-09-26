import User from "../models/user.js";
import { errorHandler } from "../utils/errorHandler.js";
import bcryptjs from "bcryptjs";
import axios from "axios";
import {
  chunkArray,
  getCurrentTime,
} from "../utils/helper.js";
import FyersUserDetail from "../models/brokers/fyers/fyersUserDetail.model.js";
import { validateOrder } from "../utils/validateOrder.js";
import { sendCoreEngineEmail } from "../services/emailService.js";
import AITradingBot from "../models/aiTradingBot.model.js";
import { endHour, endMin, startHour, startMin } from "../utils/endStartTime.js";

const API_BASE_URL='https://api.stockgenius.ai';
// const API_BASE_URL='http://localhost:8080';

export const updateUser = async (req, res, next) => {
  if (!req.user) {
    return next(errorHandler(401, "Authentication required"));
  }
  console.log(req.user, req.params.id);
  if (req.user.userId !== req.params.id)
    return next(errorHandler(401, "You can only update your own account!"));
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.userId !== req.params.id)
    return next(errorHandler(401, "You can only delete your own account!"));
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("access_token");
    res.status(200).json("User has been deleted!");
  } catch (error) {
    next(error);
  }
};

//for intraday market
// export const activateAutoTradeBotINTRADAY = async (req, res) => {
//   const { userId } = req.params;
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

//     const fyersUserDetails = await FyersUserDetail.findOne({ userId });
//     if (!fyersUserDetails || !fyersUserDetails.accessToken) {
//       return res.status(404).json({
//         message: "Fyers user details not found or access token missing",
//       });
//     }

//     user.autoTradeBot = "active";
//     await user.save();

//     const autoTradeLoop = async () => {

//       // Fetch the latest user data to ensure we have the most recent status
//       const updatedUser = await User.findById(userId);

//       // Check the autoTradeBot status and stop if it's not 'active'
//       if (
//         updatedUser.autoTradeBot === "stopped" ||
//         updatedUser.autoTradeBot === "inactive"
//       ) {
//         console.log(
//           "Auto-trade loop stopped due to status:",
//           updatedUser.autoTradeBot
//         );
//         updatedUser.autoTradeBot = "inactive";
//         await updatedUser.save();
//         clearInterval(updatedUser.loopIntervalId);
//         updatedUser.loopIntervalId = null;
//         await updatedUser.save();
//         console.log("Interval cleared and user status updated to inactive");
//         return;
//       }

//       const currentTime = getCurrentTime();
//       if (currentTime < "09:15" || currentTime > "17:30") {
//         user.autoTradeBot = "inactive";
//         await user.save();
//         clearInterval(user.loopIntervalId);
//         console.log(
//           "Auto trading can only be activated between 9:15 AM and 5:30 PM"
//         );
//         return;
//       }

//       const accessToken = fyersUserDetails.accessToken;

//       try {
//         user.autoTradeBot = "running";
//         await user.save();

//         // Call positionAndSave API before hitting the Python server
//         const positionAndSaveUrl = `https://api.stockgenius.ai/api/v1/fyers/fetchPositionsAndSave/${userId}`;
//         const positionAndSaveResponse = await axios.post(positionAndSaveUrl, {
//           accessToken,
//         });

//         if (
//           !positionAndSaveResponse ||
//           positionAndSaveResponse.status !== 200
//         ) {
//           throw new Error("Failed to fetch and save positions");
//         }

//         console.log(
//           "Position and save successful:",
//           positionAndSaveResponse.data
//         );

//         // Call funds API
//         const fundsUrl = `https://api.stockgenius.ai/api/v1/fyers/fetchFundsAndSave/${userId}`;
//         const fundsResponse = await axios.post(fundsUrl, { accessToken });

//         if (!fundsResponse || fundsResponse.status !== 200) {
//           throw new Error("Failed to fetch funds data");
//         }

//         console.log("Funds fetched successfully:", fundsResponse.data);

//         // Call the Python server
//         const pythonServerUrl =
//           "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated";
//         try {
//           const response = await axios.post(pythonServerUrl, {
//             userId,
//             marginProfit,
//             marginLoss,
//             accessToken,
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
//                   productType: "INTRADAY",
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
//                 productType: "INTRADAY",
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

//             // Validate orders before sending
//             const validatedOrders = combinedData
//               .map((order, index) => {
//                 const { isValid, errors } = validateOrder(order);
//                 if (!isValid) {
//                   console.log(
//                     `Order validation failed at index ${index}:`,
//                     errors
//                   );
//                   return null; // Exclude invalid orders
//                 }
//                 return order;
//               })
//               .filter((order) => order !== null); // Remove null entries

//             console.log("Validated Orders:", validatedOrders);
//             console.log("Total validated orders:", validatedOrders.length);

//             const chunkSize = 10;
//             const orderChunks = chunkArray(validatedOrders, chunkSize);

//             for (const chunk of orderChunks) {
//               console.log("Placing orders:", chunk);

//               try {
//                 const placeOrderResponse = await axios.post(
//                   `https://api.stockgenius.ai/api/v1/fyers/placeMultipleOrders/${userId}`,
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
//                 throw error; // Re-throw to be caught by outer try-catch
//               }
//             }

//             user.autoTradeBot = "active";
//             await user.save();

//             console.log(
//               "Orders placed successfully, auto trade bot set to active"
//             );
//           } else {
//             console.error("Unexpected response format:", response.data);
//           }
//         } catch (pythonError) {
//           console.error("Error calling Python server:", pythonError);
//           user.autoTradeBot = "inactive";
//           await user.save();
//           clearInterval(user.loopIntervalId);

//           // Send email notification
//           await sendCoreEngineEmail();
//         }
//       } catch (error) {
//         console.error("Error in auto trade loop:", error);
//         user.autoTradeBot = "inactive";
//         await user.save();
//         clearInterval(user.loopIntervalId);

//         // Handle errors and send email
//         await sendCoreEngineEmail();
//       }
//     };

//     console.log("user : " , user.autoTradeBot);

//     // Start the loop with an interval of 15 seconds
//     if(user.autoTradeBot === "active" || "running"){
//       user.loopIntervalId = setInterval(autoTradeLoop, 15 * 1000);
//     }

//     // Run the loop once immediately
//     await autoTradeLoop();

//     return res.status(200).json({ message: "Auto trade bot activated" });
//   } catch (error) {
//     console.error("Error activating auto trade bot:", error);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };

const TIME_CONDITION_START = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}` || "09:15";

const TIME_CONDITION_END = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}` || "15:30";


// In-memory storage for loopIntervalId
// const activeIntervals = {};

// activeIntervals.js
const activeIntervals = {
  intraday: {},
  cnc: {},
};

export const activateAutoTradeBotINTRADAY = async (req, res) => {
  const { userId, botId } = req.params;
  const { marginProfitPercentage, marginLossPercentage } = req.body;

  const marginProfit = parseFloat(marginProfitPercentage);
  const marginLoss = parseFloat(marginLossPercentage);

  if (!userId || isNaN(marginProfit) || isNaN(marginLoss)) {
    return res
      .status(400)
      .json({ message: "Missing or invalid required parameters" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate if the bot exists
    const existingBot = await AITradingBot.findOne({ _id: botId, userId });
    if (!existingBot) {
      return res.status(404).json({ message: "AI trading bot not found" });
    }

    const fyersUserDetails = await FyersUserDetail.findOne({ userId });
    if (!fyersUserDetails || !fyersUserDetails.accessToken) {
      return res.status(404).json({
        message: "Fyers user details not found or access token missing",
      });
    }

    // Check time condition before starting the loop
    const currentTime = getCurrentTime();
    if (
      currentTime < TIME_CONDITION_START ||
      currentTime > TIME_CONDITION_END
    ) {
      return res.status(400).json({
        message:
          "Auto trading can only be activated between 9:15 AM and 3:30 PM",
      });
    }

    // Set the bot status to 'active'
    user.autoTradeBotINTRADAY = "active";
    await user.save();

    const autoTradeLoop = async () => {
      try {
        const updatedUser = await User.findById(userId);

        // Stop the loop if the bot status is not 'active'
        if (updatedUser.autoTradeBotINTRADAY === "stopped") {
          console.log(
            "Auto-trade loop stopped due to status:",
            updatedUser.autoTradeBotINTRADAY
          );
          if (activeIntervals.intraday[userId]) {
            console.log(
              "Clearing interval ID:",
              activeIntervals.intraday[userId]
            );
            clearInterval(activeIntervals.intraday[userId]);
            delete activeIntervals.intraday[userId];
          }
          console.log("Interval cleared and user status updated to inactive");
          return;
        }

        // Check time condition
        const currentTime = getCurrentTime();
        if (
          currentTime < TIME_CONDITION_START ||
          currentTime > TIME_CONDITION_END
        ) {
          user.autoTradeBotINTRADAY = "inactive";
          await user.save();
          if (activeIntervals.intraday[userId]) {
            console.log(
              "Clearing interval ID due to time condition:",
              activeIntervals.intraday[userId]
            );
            clearInterval(activeIntervals.intraday[userId]);
            delete activeIntervals.intraday[userId];
          }
          console.log(
            "Auto trading can only be activated between 9:15 AM and 3:30 PM"
          );
          return;
        }

        user.autoTradeBotINTRADAY = "running";
        await user.save();

        

        const accessToken = fyersUserDetails.accessToken;

        // Fetch positions and save
        const positionAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchPositionsAndSave/${userId}`;
        const positionAndSaveResponse = await axios.post(positionAndSaveUrl, {
          accessToken,
        });

        if (positionAndSaveResponse.status !== 200) {
          throw new Error("Failed to fetch and save positions");
        }

        console.log(
          "Position and save successful:",
          positionAndSaveResponse.data
        );

        // Fetch funds
        const fundsUrl = `${API_BASE_URL}/api/v1/fyers/fetchFundsAndSave/${userId}`;
        const fundsResponse = await axios.post(fundsUrl, { accessToken });

        if (fundsResponse.status !== 200) {
          throw new Error("Failed to fetch funds data");
        }

        console.log("Funds fetched successfully:", fundsResponse.data);

        // Call the Python server
        const pythonServerUrl =
          "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated_INTRADAY";
        const response = await axios.post(pythonServerUrl, {
          userId,
          marginProfit,
          marginLoss,
          accessToken,
        });

        if (response.data && Array.isArray(response.data)) {
          const decisions = response.data[0].decision;
          const reinvestmentData = response.data[1].reinvestment;

          console.log("decisions:", decisions);
          console.log("reinvestmentData:", reinvestmentData);

          const combinedData = [
            ...decisions
              .filter((decision) => decision.Decision !== "Hold")
              .map((decision) => ({
                symbol: decision.Symbol,
                qty: decision.Quantity,
                type: 2,
                side: decision.Decision === "Sell" ? -1 : 1,
                productType: "INTRADAY",
                limitPrice: 0,
                stopPrice: 0,
                disclosedQty: 0,
                validity: "DAY",
                offlineOrder: false,
                stopLoss: 0,
                takeProfit: 0,
                orderTag: "autotrade",
              })),
            ...reinvestmentData.map((reinvestment) => ({
              symbol: reinvestment.Symbol,
              qty: reinvestment.Quantity,
              type: 2,
              side: 1,
              productType: "INTRADAY",
              limitPrice: 0,
              stopPrice: 0,
              disclosedQty: 0,
              validity: "DAY",
              offlineOrder: false,
              stopLoss: 0,
              takeProfit: 0,
              orderTag: "autotrade",
            })),
          ];

          // Validate orders
          const validatedOrders = combinedData
            .map((order, index) => {
              const { isValid, errors } = validateOrder(order);
              if (!isValid) {
                console.log(
                  `Order validation failed at index ${index}:`,
                  errors
                );
                return null;
              }
              return order;
            })
            .filter((order) => order !== null);

          console.log("Validated Orders:", validatedOrders);
          console.log("Total validated orders:", validatedOrders.length);

          const chunkSize = 10;
          const orderChunks = chunkArray(validatedOrders, chunkSize);

          for (const chunk of orderChunks) {
            console.log("Placing orders:", chunk);

            try {
              const placeOrderResponse = await axios.post(
                `${API_BASE_URL}/api/v1/fyers/placeMultipleOrders/${userId}`,
                { accessToken, orders: chunk }
              );
              const { successfulOrders = [], unsuccessfulOrders = [] } =
                placeOrderResponse.data;
              if (successfulOrders.length > 0) {
                console.log("Successful orders:", successfulOrders);
              }
              if (unsuccessfulOrders.length > 0) {
                console.log("Failed orders:", unsuccessfulOrders);
              }
            } catch (error) {
              console.error("Error placing orders:", error);
              throw error;
            }
          }

          user.autoTradeBotINTRADAY = "active";
          await user.save();

          console.log(
            "Orders placed successfully, auto trade bot set to active"
          );

          // Fetch orders and save
          const ordersAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchOrdersAndSave/${userId}`;
          const ordersAndSaveResponse = await axios.post(ordersAndSaveUrl, {
            accessToken,
          });

          if (ordersAndSaveResponse.status !== 200) {
            throw new Error("Failed to fetch and save positions");
          }
          console.log(
            "Orders and save successful:",
            ordersAndSaveResponse.data
          );

          // Fetch trades and save
          const tradesAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchTradesAndSave/${userId}`;
          const tradesAndSaveResponse = await axios.post(tradesAndSaveUrl, {
            accessToken,
          });

          if (tradesAndSaveResponse.status !== 200) {
            throw new Error("Failed to fetch and save positions");
          }
          console.log(
            "Orders and save successful:",
            tradesAndSaveResponse.data
          );
        } else {
          console.error("Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("Error in auto trade loop:", error);
        user.autoTradeBotINTRADAY = "inactive";
        await user.save();
        if (activeIntervals.intraday[userId]) {
          console.log(
            "Clearing interval ID due to error:",
            activeIntervals.intraday[userId]
          );
          clearInterval(activeIntervals.intraday[userId]);
          delete activeIntervals.intraday[userId];
        }

        //
        await sendCoreEngineEmail();
      }
    };

    // Check if a loop is already running
    if (activeIntervals.intraday[userId]) {
      console.log(
        "Clearing existing interval ID:",
        activeIntervals.intraday[userId]
      );
      clearInterval(activeIntervals.intraday[userId]);
    }

    activeIntervals.intraday[userId] = setInterval(autoTradeLoop, 15 * 1000);
    console.log("Auto-trade loop started with interval of 15 seconds");

    await autoTradeLoop();

    return res
      .status(200)
      .json({ message: "Auto trade bot activated for Intraday" });
  } catch (error) {
    console.error("Error activating auto trade bot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// for cnc market
export const activateAutoTradeBotCNC = async (req, res) => {
  const { userId, botId } = req.params;
  const { marginProfitPercentage, marginLossPercentage } = req.body;

  const marginProfit = parseFloat(marginProfitPercentage);
  const marginLoss = parseFloat(marginLossPercentage);

  if (!userId || isNaN(marginProfit) || isNaN(marginLoss)) {
    return res
      .status(400)
      .json({ message: "Missing or invalid required parameters" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate if the bot exists
    const existingBot = await AITradingBot.findOne({ _id: botId, userId });
    if (!existingBot) {
      return res.status(404).json({ message: "AI trading bot not found" });
    }

    const fyersUserDetails = await FyersUserDetail.findOne({ userId });
    if (!fyersUserDetails || !fyersUserDetails.accessToken) {
      return res.status(404).json({
        message: "Fyers user details not found or access token missing",
      });
    }

    // Check time condition before starting the loop
    const currentTime = getCurrentTime();
    if (
      currentTime < TIME_CONDITION_START ||
      currentTime > TIME_CONDITION_END
    ) {
      return res.status(400).json({
        message:
          "Auto trading can only be activated between 9:15 AM and 3:30 PM",
      });
    }

    // Set the bot status to 'active'
    user.autoTradeBotCNC = "active";
    await user.save();

    const autoTradeLoop = async () => {
      try {
        const updatedUser = await User.findById(userId);

        // Stop the loop if the bot status is not 'active'
        if (updatedUser.autoTradeBotCNC === "stopped") {
          console.log(
            "Auto-trade loop stopped due to status:",
            updatedUser.autoTradeBotCNC
          );
          if (activeIntervals.cnc[userId]) {
            console.log("Clearing interval ID:", activeIntervals.cnc[userId]);
            clearInterval(activeIntervals.cnc[userId]);
            delete activeIntervals.cnc[userId];
          }
          console.log("Interval cleared and user status updated to inactive");
          return;
        }

        // Check time condition
        const currentTime = getCurrentTime();
        if (
          currentTime < TIME_CONDITION_START ||
          currentTime > TIME_CONDITION_END
        ) {
          user.autoTradeBotCNC = "inactive";
          await user.save();
          if (activeIntervals.cnc[userId]) {
            console.log(
              "Clearing interval ID due to time condition:",
              activeIntervals.cnc[userId]
            );
            clearInterval(activeIntervals.cnc[userId]);
            delete activeIntervals.cnc[userId];
          }
          console.log(
            "Auto trading can only be activated between 9:15 AM and 3:30 PM"
          );
          return;
        }

        user.autoTradeBotCNC = "running";
        await user.save();

        const accessToken = fyersUserDetails.accessToken;

        // Fetch latest positions and save
        const positionAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchPositionsAndSave/${userId}`;
        const positionAndSaveResponse = await axios.post(positionAndSaveUrl, {
          accessToken,
        });

        if (positionAndSaveResponse.status !== 200) {
          throw new Error("Failed to fetch and save positions");
        }

        console.log(
          "Position and save successful:",
          positionAndSaveResponse.data
        );
        // Fetch latest holdings and save
        const holdingAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchHoldingsAndSave/${userId}`;
        const holdingAndSaveResponse = await axios.post(holdingAndSaveUrl, {
          accessToken,
        });

        if (holdingAndSaveResponse.status !== 200) {
          throw new Error("Failed to fetch and save holdings");
        }

        console.log(
          "Holding and save successful:",
          holdingAndSaveResponse.data
        );

        // Fetch funds
        const fundsUrl = `${API_BASE_URL}/api/v1/fyers/fetchFundsAndSave/${userId}`;
        const fundsResponse = await axios.post(fundsUrl, { accessToken });

        if (fundsResponse.status !== 200) {
          throw new Error("Failed to fetch funds data");
        }

        console.log("Funds fetched successfully:", fundsResponse.data);

        // Call the Python server
        const pythonServerUrl =
          "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated_CNC";
        const response = await axios.post(pythonServerUrl, {
          userId,
          marginProfit,
          marginLoss,
          accessToken,
        });

        if (response.data && Array.isArray(response.data)) {
          const decisions = response.data[0].decision;
          const reinvestmentData = response.data[1].reinvestment;

          console.log("decisions:", decisions);
          console.log("reinvestmentData:", reinvestmentData);

          const combinedData = [
            ...decisions
              .filter((decision) => decision.Decision !== "Hold")
              .map((decision) => ({
                symbol: decision.Symbol,
                qty: decision.Quantity,
                type: 2,
                side: decision.Decision === "Sell" ? -1 : 1,
                productType: "CNC",
                limitPrice: 0,
                stopPrice: 0,
                disclosedQty: 0,
                validity: "DAY",
                offlineOrder: false,
                stopLoss: 0,
                takeProfit: 0,
                orderTag: "autotrade",
              })),
            ...reinvestmentData.map((reinvestment) => ({
              symbol: reinvestment.Symbol,
              qty: reinvestment.Quantity,
              type: 2,
              side: 1,
              productType: "CNC",
              limitPrice: 0,
              stopPrice: 0,
              disclosedQty: 0,
              validity: "DAY",
              offlineOrder: false,
              stopLoss: 0,
              takeProfit: 0,
              orderTag: "autotrade",
            })),
          ];

          // Validate orders
          const validatedOrders = combinedData
            .map((order, index) => {
              const { isValid, errors } = validateOrder(order);
              if (!isValid) {
                console.log(
                  `Order validation failed at index ${index}:`,
                  errors
                );
                return null;
              }
              return order;
            })
            .filter((order) => order !== null);

          console.log("Validated Orders:", validatedOrders);
          console.log("Total validated orders:", validatedOrders.length);

          const chunkSize = 10;
          const orderChunks = chunkArray(validatedOrders, chunkSize);

          for (const chunk of orderChunks) {
            console.log("Placing orders:", chunk);

            try {
              const placeOrderResponse = await axios.post(
                `${API_BASE_URL}/api/v1/fyers/placeMultipleOrders/${userId}`,
                { accessToken, orders: chunk }
              );
              const { successfulOrders = [], unsuccessfulOrders = [] } =
                placeOrderResponse.data;
              if (successfulOrders.length > 0) {
                console.log("Successful orders:", successfulOrders);
              }
              if (unsuccessfulOrders.length > 0) {
                console.log("Failed orders:", unsuccessfulOrders);
              }
            } catch (error) {
              console.error("Error placing orders:", error);
              throw error;
            }
          }

          user.autoTradeBotCNC = "active";
          await user.save();

          console.log(
            "Orders placed successfully, auto trade bot set to active"
          );

          // Fetch orders and save
          const ordersAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchOrdersAndSave/${userId}`;
          const ordersAndSaveResponse = await axios.post(ordersAndSaveUrl, {
            accessToken,
          });

          if (ordersAndSaveResponse.status !== 200) {
            throw new Error("Failed to fetch and save positions");
          }
          console.log(
            "Orders and save successful:",
            ordersAndSaveResponse.data
          );

          // Fetch trades and save
          const tradesAndSaveUrl = `${API_BASE_URL}/api/v1/fyers/fetchTradesAndSave/${userId}`;
          const tradesAndSaveResponse = await axios.post(tradesAndSaveUrl, {
            accessToken,
          });

          if (tradesAndSaveResponse.status !== 200) {
            throw new Error("Failed to fetch and save positions");
          }
          console.log(
            "Orders and save successful:",
            tradesAndSaveResponse.data
          );
        } else {
          console.error("Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("Error in auto trade loop:", error);
        user.autoTradeBotCNC = "inactive";
        await user.save();
        if (activeIntervals.cnc[userId]) {
          console.log(
            "Clearing interval ID due to error:",
            activeIntervals.cnc[userId]
          );
          clearInterval(activeIntervals.cnc[userId]);
          delete activeIntervals.cnc[userId];
        }
        await sendCoreEngineEmail();
      }
    };

    // Check if a loop is already running
    if (activeIntervals.cnc[userId]) {
      console.log(
        "Clearing existing interval ID:",
        activeIntervals.cnc[userId]
      );
      clearInterval(activeIntervals.cnc[userId]);
    }

    activeIntervals.cnc[userId] = setInterval(autoTradeLoop, 15 * 1000);
    console.log("Auto-trade loop started with interval of 15 seconds");

    await autoTradeLoop();

    return res
      .status(200)
      .json({ message: "Auto trade bot activated for CNC" });
  } catch (error) {
    console.error("Error activating auto trade bot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deactivateAutoTradeBotINTRADAY = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Stop the bot and clear the interval
    user.autoTradeBotINTRADAY = "stopped";
    await user.save();

    // Clear interval for intraday mode
    if (activeIntervals.intraday[userId]) {
      console.log(
        "Clearing interval ID for intraday:",
        activeIntervals.intraday[userId]
      );
      clearInterval(activeIntervals.intraday[userId]);
      delete activeIntervals.intraday[userId];
    }

    return res
      .status(200)
      .json({ message: "Intraday auto trade bot deactivated" });
  } catch (error) {
    console.error("Error deactivating Intraday bot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deactivateAutoTradeBotCNC = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Stop the bot and clear the interval
    user.autoTradeBotCNC = "stopped";
    await user.save();

    // Clear interval for CNC mode
    if (activeIntervals.cnc[userId]) {
      console.log("Clearing interval ID for CNC:", activeIntervals.cnc[userId]);
      clearInterval(activeIntervals.cnc[userId]);
      delete activeIntervals.cnc[userId];
    }

    return res.status(200).json({ message: "CNC auto trade bot deactivated" });
  } catch (error) {
    console.error("Error deactivating CNC bot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

//new logic

// export const activateAutoTradeBotINTRADAY = async (req, res) => {
//   const { userId } = req.params;
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

//     const fyersUserDetails = await FyersUserDetail.findOne({ userId });
//     if (!fyersUserDetails || !fyersUserDetails.accessToken) {
//       return res.status(404).json({
//         message: "Fyers user details not found or access token missing",
//       });
//     }

//     // Set the bot status to 'active'
//     user.autoTradeBotINTRADAY = "active";
//     await user.save();

//     const autoTradeLoop = async () => {
//       try {
//         while (true) {
//           // Fetch the updated user status in each iteration
//           const updatedUser = await User.findById(userId);

//           // Stop the loop if the bot status is not 'active'
//           if (updatedUser.autoTradeBotINTRADAY !== "active") {
//             console.log(
//               "Auto-trade loop stopped due to status:",
//               updatedUser.autoTradeBotINTRADAY
//             );
//             return; // Stop the loop
//           }

//           // Check time condition
//           const currentTime = getCurrentTime();
//           if (
//             currentTime < TIME_CONDITION_START ||
//             currentTime > TIME_CONDITION_END
//           ) {
//             updatedUser.autoTradeBotINTRADAY = "inactive";
//             await updatedUser.save();
//             console.log(
//               "Auto trading can only be activated between 9:15 AM and 3:30 PM"
//             );
//             return; // Stop the loop
//           }

//           updatedUser.autoTradeBotINTRADAY = "running";
//           await updatedUser.save();

//           const accessToken = fyersUserDetails.accessToken;

//           // Fetch positions and save
//           const positionAndSaveUrl = `https://api.stockgenius.ai/api/v1/fyers/fetchPositionsAndSave/${userId}`;
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

//           // Fetch funds
//           const fundsUrl = `https://api.stockgenius.ai/api/v1/fyers/fetchFundsAndSave/${userId}`;
//           const fundsResponse = await axios.post(fundsUrl, { accessToken });

//           if (fundsResponse.status !== 200) {
//             throw new Error("Failed to fetch funds data");
//           }

//           console.log("Funds fetched successfully:", fundsResponse.data);

//           // Call the Python server
//           const pythonServerUrl =
//             "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated_INTRADAY";
//           const response = await axios.post(pythonServerUrl, {
//             userId,
//             marginProfit,
//             marginLoss,
//             accessToken,
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
//                   productType: "INTRADAY",
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
//                 productType: "INTRADAY",
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
//                 // const placeOrderResponse = await axios.post(
//                 //   `https://api.stockgenius.ai/api/v1/fyers/placeMultipleOrders/${userId}`,
//                 //   { accessToken, orders: chunk }
//                 // );
//                 // const { successfulOrders = [], unsuccessfulOrders = [] } =
//                 //   placeOrderResponse.data;
//                 // if (successfulOrders.length > 0) {
//                 //   console.log("Successful orders:", successfulOrders);
//                 // }
//                 // if (unsuccessfulOrders.length > 0) {
//                 //   console.log("Failed orders:", unsuccessfulOrders);
//                 // }
//               } catch (error) {
//                 console.error("Error placing orders:", error);
//                 throw error;
//               }
//             }

//             updatedUser.autoTradeBotINTRADAY = "active";
//             await updatedUser.save();

//             console.log(
//               "Orders placed successfully, auto trade bot set to active"
//             );
//           } else {
//             console.error("Unexpected response format:", response.data);
//           }

//           // Wait before the next iteration
//         }
//       } catch (error) {
//         console.error("Error in auto trade loop:", error);
//         const user = await User.findById(userId);
//         if (user) {
//           user.autoTradeBotINTRADAY = "inactive";
//           await user.save();
//         }
//         await sendCoreEngineEmail();
//       }
//     };

//     await autoTradeLoop(); // Start the loop

//     return res.status(200).json({ message: "Auto trade bot activated for Intraday" });
//   } catch (error) {
//     console.error("Error activating auto trade bot:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// export const deactivateAutoTradeBotINTRADAY = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Stop the bot and update the status in the database
//     user.autoTradeBotINTRADAY = "stopped";
//     await user.save();

//     return res.status(200).json({ message: "Intraday auto trade bot deactivated" });
//   } catch (error) {
//     console.error("Error deactivating Intraday bot:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// Fetch all users with autoTradeBot set to true
export const fetchAllUsersWithAutoTradeBot = async (req, res) => {
  try {
    const users = await User.find({ autoTradeBot: "active" }).populate(
      "fyersUserDetails"
    );
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
