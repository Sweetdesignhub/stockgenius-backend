import { fyersModel } from "fyers-api-v3";
import fs from "fs";
import dotenv from "dotenv";
import FyersUserDetail from "../../../models/brokers/fyers/fyersUserDetail.model.js";
import { validateOrder } from "../../../utils/validateOrder.js";

dotenv.config();
const logsDir = "./logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const fyers = new fyersModel({ path: logsDir, enableLogging: true });
const APPID = process.env.FYERS_APP_ID;
const SECRET_KEY = process.env.FYERS_SECRET_KEY;
const REDIRECT_URI = process.env.FYERS_REDIRECT_URI;

fyers.setAppId(APPID);
fyers.setRedirectUrl(REDIRECT_URI);

// apis to fetch data from fyers and save in our database

// Helper function to update Fyers user details in the database
const updateFyersUserDetails = async (userId, updateData) => {
  return await FyersUserDetail.findOneAndUpdate({ userId }, updateData, {
    new: true,
    upsert: true,
  });
};

export const generateAuthCodeUrl = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(APPID);
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const authCodeURL = fyers.generateAuthCode();
    await updateFyersUserDetails(userId, { authCodeURL, authDate: new Date() });

    res.json({ authCodeURL });
  } catch (error) {
    console.error("Error generating auth code URL:", error);
    res.status(500).json({ error: error.message });
  }
};

export const generateAccessToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { uri } = req.body;
    if (!userId || !uri) {
      return res.status(400).json({ error: "User ID and URI are required" });
    }

    const urlParams = new URLSearchParams(uri);
    const authCode = urlParams.get("auth_code");
    if (!authCode) {
      return res.status(400).json({ error: "Auth code not found in URI" });
    }

    const response = await fyers.generate_access_token({
      client_id: APPID,
      secret_key: SECRET_KEY,
      auth_code: authCode,
      grant_type: "authorization_code",
    });

    if (response.s === "ok") {
      const { access_token: accessToken, refresh_token: refreshToken } =
        response;
      await updateFyersUserDetails(userId, {
        accessToken,
        refreshToken,
        authDate: new Date(),
      });

      res.json({ accessToken });
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error("Error generating access token:", error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchProfileAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;
    if (!userId || !accessToken) {
      return res
        .status(400)
        .json({ error: "User ID and Access Token are required" });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_profile();

    if (response.s === "ok") {
      const {
        fy_id: fyersId,
        name,
        email_id: email,
        mobile_number: mobile,
        display_name: displayName,
      } = response.data;

      await updateFyersUserDetails(userId, {
        profile: {
          fy_id: fyersId,
          name,
          email_id: email,
          mobile_number: mobile,
          display_name: displayName,
        },
      });

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchFundsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_funds();
    // console.log("funds:", response.fund_limit);

    if (response.s === "ok") {
      const funds = response.fund_limit;
      // console.log("Funds data to save:", funds);

      // Save funds data to the database
      await FyersUserDetail.findOneAndUpdate(
        { userId },
        { $set: { "funds.fund_limit": funds } },
        { new: true, upsert: true }
      );

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error("Error fetching funds:", error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchOrdersAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_orders();

    if (response.s === "ok") {
      const orders = response.orderBook;

      // Ensure the 'orders' field in the schema is an array
      await FyersUserDetail.findOneAndUpdate(
        { userId },
        { $set: { "orders.orderBook": orders } },
        { new: true, upsert: true }
      );

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchHoldingsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_holdings();

    // Check if the response is successful
    if (response.s === "ok") {
      const { overall, holdings } = response; // Destructure overall and holdings from the response

      // Save holdings data to the database
      await FyersUserDetail.findOneAndUpdate(
        { userId },
        {
          $set: {
            "holdings.overall": overall, // Update overall holdings data
            "holdings.holdings": holdings, // Update individual holding items
          },
        },
        { new: true, upsert: true }
      );

      res.json(response); // Send the response back to the client
    } else {
      res.status(400).json({ error: response }); //  error responses from the API
    }
  } catch (error) {
    console.error("Error fetching holdings:", error);
    res.status(500).json({ error: error.message }); // server errors
  }
};

export const fetchPositionsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_positions();
    // console.log("Positions:", response.netPositions);

    if (response.s === "ok") {
      const positions = {
        netPositions: response.netPositions,
        overall: response.overall,
      };
      // console.log("Positions data to save:", positions);

      // Save positions data to the database
      await FyersUserDetail.findOneAndUpdate(
        { userId },
        { $set: { positions: positions } },
        { new: true, upsert: true }
      );

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchTradesAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_tradebook();

    if (response.s === "ok") {
      const trades = response.tradeBook;

      await FyersUserDetail.findOneAndUpdate(
        { userId },
        { $set: { "trades.tradeBook": trades } },
        { new: true, upsert: true }
      );

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error("Error fetching trades:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controller function to place an order
export const placeOrder = async (req, res) => {
  const { userId } = req.params;
  const { accessToken, order } = req.body;

  // Validate inputs
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }
  if (!order || typeof order !== "object") {
    return res
      .status(400)
      .json({ error: "Order details are required and should be an object" });
  }

  // Validate order details
  const { isValid, errors } = validateOrder(order);
  if (!isValid) {
    console.log("Order validation failed:", errors);
    return res.status(400).json({ errors });
  }

  try {
    // Set access token and place the order
    fyers.setAccessToken(accessToken);
    // console.log("Placing order:", order);
    const response = await fyers.place_order(order);
    // console.log("Order placed response:", response);

    if (response.s === "ok") {
      return res.json(response);
    } else {
      return res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Controller function to place multiple orders
export const placeMultipleOrders = async (req, res) => {
  const { userId } = req.params;
  const { accessToken, orders } = req.body;

  // console.log(orders);

  // console.log("place order" , accessToken, orders);

  // Validate inputs
  if (!userId) return res.status(400).json({ error: "User ID is required" });
  if (!accessToken)
    return res.status(400).json({ error: "Access token is required" });
  if (!orders || !Array.isArray(orders) || orders.length === 0)
    return res
      .status(400)
      .json({ error: "Orders array is required and should not be empty" });

  try {
    // Set the access token for Fyers API
    fyers.setAccessToken(accessToken);

    // Validate each order in the array
    for (const [index, order] of orders.entries()) {
      const { isValid, errors } = validateOrder(order);
      if (!isValid) {
        console.log(`Order validation failed at index ${index}:`, errors);
        return res
          .status(400)
          .json({ error: `Invalid order at index ${index}: ${errors}` });
      }
    }

    // Place multiple orders with the Fyers API
    const response = await fyers.place_multi_order(orders);
    // console.log('placeorder response : ', response);

    // Check if the response is successful
    if (response.s === "ok") {
      const successfulOrders = [];
      const unsuccessfulOrders = [];

      response.data.forEach((orderResponse, index) => {
        if (orderResponse.statusCode === 200 && orderResponse.body.s === "ok") {
          successfulOrders.push({
            orderIndex: index,
            ...orderResponse.body,
          });
        } else {
          unsuccessfulOrders.push({
            orderIndex: index,
            ...orderResponse.body,
          });
        }
      });

      return res.json({
        message: "Order placement result",
        successfulOrders,
        unsuccessfulOrders,
      });
    } else {
      console.log("Error response details:", response);
      const errors = response.data.map((orderResponse, index) => ({
        orderIndex: index,
        ...orderResponse.body,
      }));
      return res
        .status(400)
        .json({ error: "Order placement failed", details: errors });
    }
  } catch (error) {
    console.error("Error placing multiple orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// // API to place a single order with proper validations
// export const placeOrder = async (req, res) => {
//   const orderDetails = req.body;

//   // Validate required fields
//   const requiredFields = [
//     "symbol",
//     "qty",
//     "type",
//     "side",
//     "productType",
//     "limitPrice",
//     "stopPrice",
//     "disclosedQty",
//     "validity",
//     "offlineOrder",
//     "stopLoss",
//     "takeProfit",
//     "orderTag",
//   ];
//   for (const field of requiredFields) {
//     if (!orderDetails.hasOwnProperty(field)) {
//       return res.status(400).json({ error: `${field} is required` });
//     }
//   }

//   // Validate field types and values
//   if (typeof orderDetails.symbol !== "string") {
//     return res.status(400).json({ error: "symbol must be a string" });
//   }

//   if (typeof orderDetails.qty !== "number" || orderDetails.qty <= 0) {
//     return res.status(400).json({ error: "qty must be a positive number" });
//   }

//   if (![1, 2, 3, 4].includes(orderDetails.type)) {
//     return res.status(400).json({ error: "type must be one of 1, 2, 3, 4" });
//   }

//   if (![1, -1].includes(orderDetails.side)) {
//     return res.status(400).json({ error: "side must be one of 1, -1" });
//   }

//   const validProductTypes = ["CNC", "INTRADAY", "MARGIN", "CO", "BO"];
//   if (!validProductTypes.includes(orderDetails.productType)) {
//     return res.status(400).json({
//       error: `productType must be one of ${validProductTypes.join(", ")}`,
//     });
//   }

//   if (
//     typeof orderDetails.limitPrice !== "number" ||
//     orderDetails.limitPrice < 0
//   ) {
//     return res
//       .status(400)
//       .json({ error: "limitPrice must be a non-negative number" });
//   }

//   if (
//     typeof orderDetails.stopPrice !== "number" ||
//     orderDetails.stopPrice < 0
//   ) {
//     return res
//       .status(400)
//       .json({ error: "stopPrice must be a non-negative number" });
//   }

//   if (
//     typeof orderDetails.disclosedQty !== "number" ||
//     orderDetails.disclosedQty < 0
//   ) {
//     return res
//       .status(400)
//       .json({ error: "disclosedQty must be a non-negative number" });
//   }

//   if (!["DAY", "IOC"].includes(orderDetails.validity)) {
//     return res.status(400).json({ error: "validity must be one of DAY, IOC" });
//   }

//   if (typeof orderDetails.offlineOrder !== "boolean") {
//     return res.status(400).json({ error: "offlineOrder must be a boolean" });
//   }

//   if (typeof orderDetails.stopLoss !== "number" || orderDetails.stopLoss < 0) {
//     return res
//       .status(400)
//       .json({ error: "stopLoss must be a non-negative number" });
//   }

//   if (
//     typeof orderDetails.takeProfit !== "number" ||
//     orderDetails.takeProfit < 0
//   ) {
//     return res
//       .status(400)
//       .json({ error: "takeProfit must be a non-negative number" });
//   }

//   if (typeof orderDetails.orderTag !== "string") {
//     return res.status(400).json({ error: "orderTag must be a string" });
//   }

//   try {
//     const fyersAccessToken = req.headers.authorization.split(" ")[1];
//     fyers.setAccessToken(fyersAccessToken);
//     const response = await fyers.place_order(orderDetails);
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // API to place multiple orders with proper validations
// export const placeMultipleOrders = async (req, res) => {
//   const ordersDetails = req.body;

//   // Check if ordersDetails is an array
//   if (!Array.isArray(ordersDetails)) {
//     return res
//       .status(400)
//       .json({ error: "Request body must be an array of order details" });
//   }

//   // Validate each order in the array
//   for (let i = 0; i < ordersDetails.length; i++) {
//     const order = ordersDetails[i];
//     const requiredFields = [
//       "symbol",
//       "qty",
//       "type",
//       "side",
//       "productType",
//       "limitPrice",
//       "stopPrice",
//       "disclosedQty",
//       "validity",
//       "offlineOrder",
//       "stopLoss",
//       "takeProfit",
//     ];
//     for (const field of requiredFields) {
//       if (!order.hasOwnProperty(field)) {
//         return res
//           .status(400)
//           .json({ error: `${field} is required for order at index ${i}` });
//       }
//     }

//     // Validate field types and values
//     if (typeof order.symbol !== "string") {
//       return res
//         .status(400)
//         .json({ error: `symbol for order at index ${i} must be a string` });
//     }

//     if (typeof order.qty !== "number" || order.qty <= 0) {
//       return res.status(400).json({
//         error: `qty for order at index ${i} must be a positive number`,
//       });
//     }

//     if (![1, 2, 3, 4].includes(order.type)) {
//       return res.status(400).json({
//         error: `type for order at index ${i} must be one of 1, 2, 3, 4`,
//       });
//     }

//     if (![1, -1].includes(order.side)) {
//       return res
//         .status(400)
//         .json({ error: `side for order at index ${i} must be one of 1, -1` });
//     }

//     const validProductTypes = ["CNC", "INTRADAY", "MARGIN", "CO", "BO"];
//     if (!validProductTypes.includes(order.productType)) {
//       return res.status(400).json({
//         error: `productType for order at index ${i} must be one of ${validProductTypes.join(
//           ", "
//         )}`,
//       });
//     }

//     if (typeof order.limitPrice !== "number" || order.limitPrice < 0) {
//       return res.status(400).json({
//         error: `limitPrice for order at index ${i} must be a non-negative number`,
//       });
//     }

//     if (typeof order.stopPrice !== "number" || order.stopPrice < 0) {
//       return res.status(400).json({
//         error: `stopPrice for order at index ${i} must be a non-negative number`,
//       });
//     }

//     if (typeof order.disclosedQty !== "number" || order.disclosedQty < 0) {
//       return res.status(400).json({
//         error: `disclosedQty for order at index ${i} must be a non-negative number`,
//       });
//     }

//     if (!["DAY", "IOC"].includes(order.validity)) {
//       return res.status(400).json({
//         error: `validity for order at index ${i} must be one of DAY, IOC`,
//       });
//     }

//     if (typeof order.offlineOrder !== "boolean") {
//       return res.status(400).json({
//         error: `offlineOrder for order at index ${i} must be a boolean`,
//       });
//     }

//     if (typeof order.stopLoss !== "number" || order.stopLoss < 0) {
//       return res.status(400).json({
//         error: `stopLoss for order at index ${i} must be a non-negative number`,
//       });
//     }

//     if (typeof order.takeProfit !== "number" || order.takeProfit < 0) {
//       return res.status(400).json({
//         error: `takeProfit for order at index ${i} must be a non-negative number`,
//       });
//     }
//   }

//   try {
//     const fyersAccessToken = req.headers.authorization.split(" ")[1];
//     fyers.setAccessToken(fyersAccessToken);
//     const response = await fyers.place_multi_order(ordersDetails);
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
