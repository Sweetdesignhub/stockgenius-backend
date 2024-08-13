import User from "../models/user.model.js";
import { errorHandler } from "../utils/errorHandler.js";
import bcryptjs from "bcryptjs";
import axios from "axios";
import { checkFunds, checkHoldings, getCurrentTime } from "../utils/helper.js";
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
      console.log("stoped", user.autoTradeBot);
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
      console.log(currentTime);

      if (currentTime >= "09:30" && currentTime <= "16:30") {
        console.log("Within trading hours");
      } else {
        console.log("Outside trading hours");
      }

      try {
        const currentTime = getCurrentTime();
        if (currentTime < "09:30" || currentTime > "16:30") {
          user.autoTradeBot = "inactive";
          await user.save();
          clearInterval(loopInterval);
          console.log(
            "Auto trading can only be activated between 9:30 AM and 4:30 PM"
          );
          return;
        }

        const [fundsResponse, holdingsResponse] = await Promise.all([
          axios.get(
            `https://api.stockgenius.ai/api/v1/fyers/fundsByUserId/${userId}`
          ),
          axios.get(
            `https://api.stockgenius.ai/api/v1/fyers/holdingsByUserId/${userId}`
          ),
        ]);

        const funds = fundsResponse.data;
        // console.log(funds);

        const holdings = holdingsResponse.data;

        const isFundsValid = checkFunds(funds);
        const areHoldingsValid = checkHoldings(holdings);

        if (!isFundsValid || !areHoldingsValid) {
          user.autoTradeBot = "inactive";
          await user.save();
          clearInterval(loopInterval);
          console.log("Insufficient funds or no holdings");
          return;
        }

        user.autoTradeBot = "running";
        await user.save();

        // const pythonServerUrl = "http://localhost:8000/autoTradingActivated";
        const pythonServerUrl =
          "https://stock-core-engine-1.onrender.com/autoTradingActivated";
        const response = await axios.post(pythonServerUrl, {
          userId,
          marginProfit,
          marginLoss,
        });

        const decisions = response.data;

        const decisionsArray = Array.isArray(decisions)
          ? decisions
          : Object.values(decisions);

        console.log("Decisions Array:", decisionsArray);

        if (!Array.isArray(decisionsArray)) {
          user.autoTradeBot = "inactive";
          await user.save();
          clearInterval(loopInterval);
          console.log("Invalid response from auto trading server", decisions);
          return;
        }

        const orders = decisionsArray
          .filter((decision) => decision.Decision !== "Hold")
          // .slice(0, 2) // testing
          .slice(0, 10)
          .map((decision, index) => ({
            symbol: decision.Symbol,
            qty: 1,
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
          }));

        console.log("Generated Orders:", orders);

        orders.forEach((order, index) => {
          const { isValid, errors } = validateOrder(order);
          if (!isValid) {
            console.log(`Order validation failed at index ${index}:`, errors);
          }
        });

        const accessToken = fyersUserDetails.accessToken;

        const placeOrderResponse = await axios.post(
          `https://api.stockgenius.ai/api/v1/fyers/placeMultipleOrders/${userId}`,
          { accessToken, orders }
        );

        const { successfulOrders = [], unsuccessfulOrders = [] } =
          placeOrderResponse.data;

        if (successfulOrders.length > 0) {
          console.log("Successful orders:", successfulOrders);
        }

        if (unsuccessfulOrders.length > 0) {
          console.log("Failed orders:", unsuccessfulOrders);
        }

        user.autoTradeBot = "active";
        await user.save();

        console.log("Orders placed successfully, auto trade bot set to active");
        console.log("Success : ", successfulOrders);
        console.log("rejected : ", unsuccessfulOrders);
      } catch (error) {
        console.error("Error in auto trade loop:", error);
        user.autoTradeBot = "inactive";
        await user.save();
        clearInterval(loopInterval);
      }
    };

    // Start the loop with an interval of 10 sec
    const loopInterval = setInterval(autoTradeLoop, 10 * 1000);

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

// Controller function to deactivate auto trade bot
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
