import User from "../models/user.model.js";
import { errorHandler } from "../utils/errorHandler.js";
import bcryptjs from "bcryptjs";
import axios from "axios";
import {
  checkFunds,
  checkHoldings,
  chunkArray,
  getCurrentTime,
} from "../utils/helper.js";
import FyersUserDetail from "../models/brokers/fyers/fyersUserDetail.model.js";
import { validateOrder } from "../utils/validateOrder.js";

export const updateUser = async (req, res, next) => {
  if (!req.user) {
    return next(errorHandler(401, "Authentication required"));
  }
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, "You can only update your own account!"));
  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          username: req.body.username,
          email: req.body.email,
          password: req.body.password,
          avatar: req.body.avatar,
        },
      },
      { new: true }
    );

    const { password, ...rest } = updatedUser._doc;

    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id)
    return next(errorHandler(401, "You can only delete your own account!"));
  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("access_token");
    res.status(200).json("User has been deleted!");
  } catch (error) {
    next(error);
  }
};

//for cnc market
// export const activateAutoTradeBot = async (req, res) => {
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
//       if (user.autoTradeBot === "stopped") {
//         console.log("Auto-trade loop stopped");
//         user.autoTradeBot = "inactive";
//         await user.save();
//         clearInterval(user.loopIntervalId); // Stop the interval
//         user.loopIntervalId = null; // Clear the interval ID
//         await user.save();
//         return;
//       }

//       const currentTime = getCurrentTime();
//       if (currentTime < "09:30" || currentTime > "23:30") {
//         user.autoTradeBot = "inactive";
//         await user.save();
//         clearInterval(user.loopIntervalId);
//         console.log(
//           "Auto trading can only be activated between 9:30 AM and 4:30 PM"
//         );
//         return;
//       }

//       try {
//         const [fundsResponse, holdingsResponse] = await Promise.all([
//           axios.get(
//             `https://api.stockgenius.ai/api/v1/fyers/fundsByUserId/${userId}`
//           ),
//           axios.get(
//             `https://api.stockgenius.ai/api/v1/fyers/holdingsByUserId/${userId}`
//           ),
//         ]);

//         const funds = fundsResponse.data;
//         const holdings = holdingsResponse.data;

//         const isFundsValid = checkFunds(funds);
//         const areHoldingsValid = checkHoldings(holdings);

//         if (!isFundsValid || !areHoldingsValid) {
//           user.autoTradeBot = "inactive";
//           await user.save();
//           clearInterval(user.loopIntervalId);
//           console.log("Insufficient funds or no holdings");
//           return;
//         }

//         user.autoTradeBot = "running";
//         await user.save();

//         const pythonServerUrl =
//           "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated";
//         const response = await axios.post(pythonServerUrl, {
//           userId,
//           marginProfit,
//           marginLoss,
//         });

//         if (response.data && Array.isArray(response.data)) {
//           const decisions = response.data[0].decision;
//           const reinvestmentData = response.data[1].reinvestment;

//           console.log(decisions);
//           console.log(reinvestmentData);

//           const combinedData = [
//             ...decisions.map((decision) => ({
//               symbol: decision.Symbol,
//               qty: decision.Quantity,
//               type: 2,
//               side: decision.Decision === "Sell" ? -1 : 1,
//               productType: "CNC",
//               limitPrice: 0,
//               stopPrice: 0,
//               disclosedQty: 0,
//               validity: "DAY",
//               offlineOrder: false,
//               stopLoss: 0,
//               takeProfit: 0,
//               orderTag: "autotrade",
//             })),
//             ...reinvestmentData.map((reinvestment) => ({
//               symbol: reinvestment.Symbol,
//               qty: reinvestment.Quantity,
//               type: 2,
//               side: 1,
//               productType: "CNC",
//               limitPrice: 0,
//               stopPrice: 0,
//               disclosedQty: 0,
//               validity: "DAY",
//               offlineOrder: false,
//               stopLoss: 0,
//               takeProfit: 0,
//               orderTag: "autotrade",
//             })),
//           ];

//           // Validate orders before sending
//           const validatedOrders = combinedData
//             .map((order, index) => {
//               const { isValid, errors } = validateOrder(order);
//               if (!isValid) {
//                 console.log(
//                   `Order validation failed at index ${index}:`,
//                   errors
//                 );
//                 return null; // Exclude invalid orders
//               }
//               return order;
//             })
//             .filter((order) => order !== null); // Remove null entries

//           console.log("Validated Orders:", validatedOrders);
//           console.log("Total validated orders:", validatedOrders.length);

//           const chunkSize = 10;
//           const orderChunks = chunkArray(combinedData, chunkSize);

//           for (const chunk of orderChunks) {
//             console.log("Placing orders:", chunk);

//             const accessToken = fyersUserDetails.accessToken;

//             // try {
//             //   const placeOrderResponse = await axios.post(
//             //     `https://api.stockgenius.ai/api/v1/fyers/placeMultipleOrders/${userId}`,
//             //     { accessToken, orders: chunk }
//             //   );

//             //   const { successfulOrders = [], unsuccessfulOrders = [] } =
//             //     placeOrderResponse.data;

//             //   if (successfulOrders.length > 0) {
//             //     console.log("Successful orders:", successfulOrders);
//             //   }

//             //   if (unsuccessfulOrders.length > 0) {
//             //     console.log("Failed orders:", unsuccessfulOrders);
//             //   }
//             // } catch (error) {
//             //   console.error("Error placing orders:", error);
//             //   throw error; // Re-throw to be caught by outer try-catch
//             // }
//           }

//           user.autoTradeBot = "active";
//           await user.save();

//           console.log(
//             "Orders placed successfully, auto trade bot set to active"
//           );
//         } else {
//           console.error("Unexpected response format:", response.data);
//         }
//       } catch (error) {
//         console.error("Error in auto trade loop:", error);
//         user.autoTradeBot = "inactive";
//         await user.save();
//         clearInterval(user.loopIntervalId);
//       }
//     };

//     // Start the loop with an interval of 10 sec
//     user.loopIntervalId = setInterval(autoTradeLoop, 10 * 1000);

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

//for intraday market
export const activateAutoTradeBot = async (req, res) => {
  const { userId } = req.params;
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

    const fyersUserDetails = await FyersUserDetail.findOne({ userId });
    if (!fyersUserDetails || !fyersUserDetails.accessToken) {
      return res.status(404).json({
        message: "Fyers user details not found or access token missing",
      });
    }

    user.autoTradeBot = "active";
    await user.save();

    const autoTradeLoop = async () => {
      if (user.autoTradeBot === "stopped") {
        console.log("Auto-trade loop stopped");
        user.autoTradeBot = "inactive";
        await user.save();
        clearInterval(user.loopIntervalId); // Stop the interval
        user.loopIntervalId = null; // Clear the interval ID
        await user.save();
        return;
      }

      const currentTime = getCurrentTime();
      if (currentTime < "09:30" || currentTime > "16:30") {
        user.autoTradeBot = "inactive";
        await user.save();
        clearInterval(user.loopIntervalId);
        console.log(
          "Auto trading can only be activated between 9:30 AM and 4:30 PM"
        );
        return;
      }

      try {
        const fundsResponse = await axios.get(
          `https://api.stockgenius.ai/api/v1/fyers/fundsByUserId/${userId}`
        );

        const funds = fundsResponse.data;

        const isFundsValid = checkFunds(funds);

        if (!isFundsValid) {
          user.autoTradeBot = "inactive";
          await user.save();
          clearInterval(user.loopIntervalId);
          console.log("Insufficient funds or no holdings");
          return;
        }

        user.autoTradeBot = "running";
        await user.save();

        const pythonServerUrl =
          "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated";
        const response = await axios.post(pythonServerUrl, {
          userId,
          marginProfit,
          marginLoss,
        });

        if (response.data && Array.isArray(response.data)) {
          const decisions = response.data[0].decision;
          const reinvestmentData = response.data[1].reinvestment;

          console.log("decisions : ", decisions);
          console.log(reinvestmentData);

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

          // Validate orders before sending
          const validatedOrders = combinedData
            .map((order, index) => {
              const { isValid, errors } = validateOrder(order);
              if (!isValid) {
                console.log(
                  `Order validation failed at index ${index}:`,
                  errors
                );
                return null; // Exclude invalid orders
              }
              return order;
            })
            .filter((order) => order !== null); // Remove null entries

          console.log("Validated Orders:", validatedOrders);
          console.log("Total validated orders:", validatedOrders.length);

          const chunkSize = 10;
          const orderChunks = chunkArray(combinedData, chunkSize);

          for (const chunk of orderChunks) {
            console.log("Placing orders:", chunk);

            const accessToken = fyersUserDetails.accessToken;

            try {
              const placeOrderResponse = await axios.post(
                `https://api.stockgenius.ai/api/v1/fyers/placeMultipleOrders/${userId}`,
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
              throw error; // Re-throw to be caught by outer try-catch
            }
          }

          user.autoTradeBot = "active";
          await user.save();

          console.log(
            "Orders placed successfully, auto trade bot set to active"
          );
        } else {
          console.error("Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("Error in auto trade loop:", error);
        user.autoTradeBot = "inactive";
        await user.save();
        clearInterval(user.loopIntervalId);
      }
    };

    // Start the loop with an interval of 10 sec
    user.loopIntervalId = setInterval(autoTradeLoop, 10 * 1000);

    // Run the loop once immediately
    await autoTradeLoop();

    return res.status(200).json({ message: "Auto trade bot activated" });
  } catch (error) {
    console.error("Error activating auto trade bot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const deactivateAutoTradeBot = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if auto-trade is already stopped
    if (user.autoTradeBot === "stopped") {
      return res
        .status(400)
        .json({ message: "Auto-trade loop is already stopped" });
    }

    // Stop the auto-trade loop
    user.autoTradeBot = "stopped";
    await user.save();

    if (user.loopIntervalId) {
      clearInterval(user.loopIntervalId); // Clear the interval
      user.loopIntervalId = null; // Clear the interval ID
      await user.save();
    }

    res.status(200).json({ message: "Auto-trade loop stopped successfully" });
  } catch (error) {
    console.error("Error stopping auto-trade loop:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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
