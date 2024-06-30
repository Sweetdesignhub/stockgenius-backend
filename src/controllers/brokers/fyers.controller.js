import { fyersModel } from "fyers-api-v3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
const logsDir = "./logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const fyers = new fyersModel({ path: logsDir, enableLogging: true });
const APPID = process.env.FYERS_APPID;
const SECRET_KEY = process.env.FYERS_SECRET_KEY;
const REDIRECT_URI = process.env.FYERS_REDIRECT_URI;

fyers.setAppId(APPID);
fyers.setRedirectUrl(REDIRECT_URI);

export const generateAuthCodeUrl = (req, res) => {
  console.log('enteres');
  const authCodeURL = fyers.generateAuthCode();
  console.log('generated', authCodeURL);
  res.json({ authCodeURL });
};

export const generateAccessToken = async (req, res) => {
  console.log("generateAccessToken");
  const uri = req.body.uri;
  console.log("uri : ",uri);
  if (!uri) {
    return res
      .status(400)
      .json({ error: "URI is required in the request body" });
  }
  const urlParams = new URLSearchParams(uri);
  const authCode = urlParams.get("auth_code");
  if (!authCode) {
    return res.status(400).json({ error: "Auth code not found in URI" });
  }
  console.log(authCode);
  try {
    const response = await fyers.generate_access_token({
      client_id: APPID,
      secret_key: SECRET_KEY,
      auth_code: authCode,
    });
    if (response.s === "ok") {
      fyers.setAccessToken(response.access_token);
      res.json({ accessToken: response.access_token });
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchProfile = async (req, res) => {
  try {
    const response = await fyers.get_profile();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchFunds = async (req, res) => {
  try {
    const response = await fyers.get_funds();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const response = await fyers.get_orders();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchHoldings = async (req, res) => {
  try {
    const response = await fyers.get_holdings();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchPositions = async (req, res) => {
  try {
    const response = await fyers.get_positions();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchTrades = async (req, res) => {
  try {
    const response = await fyers.get_tradebook();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// API to place a single order with proper validations
export const placeOrder = async (req, res) => {
  const orderDetails = req.body;

  // Validate required fields
  const requiredFields = [
    "symbol",
    "qty",
    "type",
    "side",
    "productType",
    "limitPrice",
    "stopPrice",
    "disclosedQty",
    "validity",
    "offlineOrder",
    "stopLoss",
    "takeProfit",
    "orderTag",
  ];
  for (const field of requiredFields) {
    if (!orderDetails.hasOwnProperty(field)) {
      return res.status(400).json({ error: `${field} is required` });
    }
  }

  // Validate field types and values
  if (typeof orderDetails.symbol !== "string") {
    return res.status(400).json({ error: "symbol must be a string" });
  }

  if (typeof orderDetails.qty !== "number" || orderDetails.qty <= 0) {
    return res.status(400).json({ error: "qty must be a positive number" });
  }

  if (![1, 2, 3, 4].includes(orderDetails.type)) {
    return res.status(400).json({ error: "type must be one of 1, 2, 3, 4" });
  }

  if (![1, -1].includes(orderDetails.side)) {
    return res.status(400).json({ error: "side must be one of 1, -1" });
  }

  const validProductTypes = ["CNC", "INTRADAY", "MARGIN", "CO", "BO"];
  if (!validProductTypes.includes(orderDetails.productType)) {
    return res.status(400).json({
      error: `productType must be one of ${validProductTypes.join(", ")}`,
    });
  }

  if (
    typeof orderDetails.limitPrice !== "number" ||
    orderDetails.limitPrice < 0
  ) {
    return res
      .status(400)
      .json({ error: "limitPrice must be a non-negative number" });
  }

  if (
    typeof orderDetails.stopPrice !== "number" ||
    orderDetails.stopPrice < 0
  ) {
    return res
      .status(400)
      .json({ error: "stopPrice must be a non-negative number" });
  }

  if (
    typeof orderDetails.disclosedQty !== "number" ||
    orderDetails.disclosedQty < 0
  ) {
    return res
      .status(400)
      .json({ error: "disclosedQty must be a non-negative number" });
  }

  if (!["DAY", "IOC"].includes(orderDetails.validity)) {
    return res.status(400).json({ error: "validity must be one of DAY, IOC" });
  }

  if (typeof orderDetails.offlineOrder !== "boolean") {
    return res.status(400).json({ error: "offlineOrder must be a boolean" });
  }

  if (typeof orderDetails.stopLoss !== "number" || orderDetails.stopLoss < 0) {
    return res
      .status(400)
      .json({ error: "stopLoss must be a non-negative number" });
  }

  if (
    typeof orderDetails.takeProfit !== "number" ||
    orderDetails.takeProfit < 0
  ) {
    return res
      .status(400)
      .json({ error: "takeProfit must be a non-negative number" });
  }

  if (typeof orderDetails.orderTag !== "string") {
    return res.status(400).json({ error: "orderTag must be a string" });
  }

  try {
    const response = await fyers.place_order(orderDetails);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// API to place multiple orders with proper validations
export const placeMultipleOrders = async (req, res) => {
  const ordersDetails = req.body;

  // Check if ordersDetails is an array
  if (!Array.isArray(ordersDetails)) {
    return res
      .status(400)
      .json({ error: "Request body must be an array of order details" });
  }

  // Validate each order in the array
  for (let i = 0; i < ordersDetails.length; i++) {
    const order = ordersDetails[i];
    const requiredFields = [
      "symbol",
      "qty",
      "type",
      "side",
      "productType",
      "limitPrice",
      "stopPrice",
      "disclosedQty",
      "validity",
      "offlineOrder",
      "stopLoss",
      "takeProfit",
    ];
    for (const field of requiredFields) {
      if (!order.hasOwnProperty(field)) {
        return res
          .status(400)
          .json({ error: `${field} is required for order at index ${i}` });
      }
    }

    // Validate field types and values
    if (typeof order.symbol !== "string") {
      return res
        .status(400)
        .json({ error: `symbol for order at index ${i} must be a string` });
    }

    if (typeof order.qty !== "number" || order.qty <= 0) {
      return res.status(400).json({
        error: `qty for order at index ${i} must be a positive number`,
      });
    }

    if (![1, 2, 3, 4].includes(order.type)) {
      return res.status(400).json({
        error: `type for order at index ${i} must be one of 1, 2, 3, 4`,
      });
    }

    if (![1, -1].includes(order.side)) {
      return res
        .status(400)
        .json({ error: `side for order at index ${i} must be one of 1, -1` });
    }

    const validProductTypes = ["CNC", "INTRADAY", "MARGIN", "CO", "BO"];
    if (!validProductTypes.includes(order.productType)) {
      return res.status(400).json({
        error: `productType for order at index ${i} must be one of ${validProductTypes.join(
          ", "
        )}`,
      });
    }

    if (typeof order.limitPrice !== "number" || order.limitPrice < 0) {
      return res.status(400).json({
        error: `limitPrice for order at index ${i} must be a non-negative number`,
      });
    }

    if (typeof order.stopPrice !== "number" || order.stopPrice < 0) {
      return res.status(400).json({
        error: `stopPrice for order at index ${i} must be a non-negative number`,
      });
    }

    if (typeof order.disclosedQty !== "number" || order.disclosedQty < 0) {
      return res.status(400).json({
        error: `disclosedQty for order at index ${i} must be a non-negative number`,
      });
    }

    if (!["DAY", "IOC"].includes(order.validity)) {
      return res.status(400).json({
        error: `validity for order at index ${i} must be one of DAY, IOC`,
      });
    }

    if (typeof order.offlineOrder !== "boolean") {
      return res.status(400).json({
        error: `offlineOrder for order at index ${i} must be a boolean`,
      });
    }

    if (typeof order.stopLoss !== "number" || order.stopLoss < 0) {
      return res.status(400).json({
        error: `stopLoss for order at index ${i} must be a non-negative number`,
      });
    }

    if (typeof order.takeProfit !== "number" || order.takeProfit < 0) {
      return res.status(400).json({
        error: `takeProfit for order at index ${i} must be a non-negative number`,
      });
    }
  }

  try {
    const response = await fyers.place_multi_order(ordersDetails);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
