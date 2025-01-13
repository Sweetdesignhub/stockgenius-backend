import Bot from "../../models/autoTradeBot/bot.model.js";
import FyersUserDetail from "../../models/brokers/fyers/fyersUserDetail.model.js";
import User from "../../models/user.js";
import { sendCoreEngineEmail, sendUserBotStoppedEmail } from "../../services/emailService";
import { getCurrentTime } from "../../utils/helper.js";
import { placeOrder } from "../paperTrading/ordersPT.controller.js";

const activeIntervals = {
  cnc: {},
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
    const existingBot = await Bot.findOne({ _id: botId, userId });
    if (!existingBot) {
      return res.status(404).json({ message: "Auto trade bot not found" });
    }

    const broker = existingBot.broker;

    // Broker-specific user details retrieval
    let brokerUserDetails;
    if (broker === "Fyers") {
      brokerUserDetails = await FyersUserDetail.findOne({ userId });
      if (!brokerUserDetails || !brokerUserDetails.accessToken) {
        return res.status(404).json({
          message: "Fyers user details not found or access token missing",
        });
      }
    } else if (broker === "Zerodha") {
      brokerUserDetails = await ZerodhaUserDetail.findOne({ userId });
      if (!brokerUserDetails) {
        return res
          .status(404)
          .json({ message: "Zerodha user details not found" });
      }
      // For Zerodha, access token might not be required in the same way as Fyers
    } else if (broker === "PaperTrading") {
      brokerUserDetails = { userId }; // No access token required for paper trading
    } else {
      return res.status(400).json({ message: "Unsupported broker" });
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

        if (broker === "PaperTrading") {
          // Fetch decisions and reinvestment data
          // Call the Python server
          const pythonServerUrl =
            "http://ec2-13-232-40-122.ap-south-1.compute.amazonaws.com:8000/autoTradingActivated_CNC";
          const response = await axios.post(pythonServerUrl, {
            userId,
            marginProfit,
            marginLoss,
            accessToken,
            broker
          });
          const decisions = response.data[0].decision;
          const reinvestmentData = response.data[1].reinvestment;

          // Combine decisions and reinvestment data
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

          // Process each order for paper trading
          for (const order of combinedData) {
            const { stockSymbol, quantity, action } = order;

            // Use your existing placeOrder logic
            const orderDetails = {
              stockSymbol,
              action,
              orderType: "MARKET", // Assuming market orders for simplicity, adjust if needed
              quantity,
              limitPrice: 0,
              stopPrice: 0,
              productType: "CNC",
              exchange: "NSE", // Assuming NSE, adjust if necessary
            };

            // Place the order
            await placeOrder({ body: orderDetails, params: { userId } }, res);
          }

          console.log(
            "Orders placed successfully in paper trading environment"
          );
        } else if (broker === "Fyers") {
            const accessToken = broker === 'Fyers' ? brokerUserDetails.accessToken : null;

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
            broker
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

        const bot = await AITradingBot.findOne({ _id: botId, userId });
        // console.log(bot);

        if (!bot) {
          throw new Error("Bot not found");
        }

        if (bot.productType === "CNC") {
          const latestDynamicData = bot.dynamicData[0];
          if (latestDynamicData) {
            latestDynamicData.status = "Inactive";
            await bot.save();
            console.log("bot status ot inactive");
          }
          await sendCoreEngineEmail(userId, user.name, error, "CNC");
          await sendUserBotStoppedEmail(user.email, user.name, "CNC");
        }
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

    // Save activated bot data
    await ActivatedBot.create({
      userId: userId,
      botId: botId,
      name: user.name,
      email: user.email,
      botType: "CNC",
    });

    return res
      .status(200)
      .json({ message: "Auto trade bot activated for CNC", userId });
  } catch (error) {
    console.error("Error activating auto trade bot:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
