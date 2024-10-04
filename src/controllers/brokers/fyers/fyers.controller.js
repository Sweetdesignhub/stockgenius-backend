import { fyersModel } from 'fyers-api-v3';
import fs from 'fs';
import dotenv from 'dotenv';
import FyersUserDetail from '../../../models/brokers/fyers/fyersUserDetail.model.js';
import { validateFyersOrder } from '../../../utils/validateFyersOrder.js';

dotenv.config();
const logsDir = './logs';
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
      return res.status(400).json({ error: 'User ID is required' });
    }

    const authCodeURL = fyers.generateAuthCode();
    await updateFyersUserDetails(userId, { authCodeURL, authDate: new Date() });

    res.json({ authCodeURL });
  } catch (error) {
    console.error('Error generating auth code URL:', error);
    res.status(500).json({ error: error.message });
  }
};

export const generateAccessToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { uri } = req.body;
    if (!userId || !uri) {
      return res.status(400).json({ error: 'User ID and URI are required' });
    }

    const urlParams = new URLSearchParams(uri);
    const authCode = urlParams.get('auth_code');
    if (!authCode) {
      return res.status(400).json({ error: 'Auth code not found in URI' });
    }

    const response = await fyers.generate_access_token({
      client_id: APPID,
      secret_key: SECRET_KEY,
      auth_code: authCode,
      grant_type: 'authorization_code',
    });

    if (response.s === 'ok') {
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
    console.error('Error generating access token:', error);
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
        .json({ error: 'User ID and Access Token are required' });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_profile();

    if (response.s === 'ok') {
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
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchFundsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_funds();
    // console.log("funds:", response.fund_limit);

    if (response.s === 'ok') {
      const funds = response.fund_limit;
      // console.log("Funds data to save:", funds);

      // Save funds data to the database
      await FyersUserDetail.findOneAndUpdate(
        { userId },
        { $set: { 'funds.fund_limit': funds } },
        { new: true, upsert: true }
      );

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error('Error fetching funds:', error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchOrdersAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_orders();

    if (response.s === 'ok') {
      const orders = response.orderBook;

      // Ensure the 'orders' field in the schema is an array
      await FyersUserDetail.findOneAndUpdate(
        { userId },
        { $set: { 'orders.orderBook': orders } },
        { new: true, upsert: true }
      );

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const userDetails = await FyersUserDetail.findOne({ userId }).exec();

    if (!userDetails) {
      return res.status(404).json({ error: 'User details not found' });
    }
    res.json({ orders: userDetails.orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const fetchHoldingsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_holdings();

    // Check if the response is successful
    if (response.s === 'ok') {
      const { overall, holdings } = response; // Destructure overall and holdings from the response

      // Save holdings data to the database
      await FyersUserDetail.findOneAndUpdate(
        { userId },
        {
          $set: {
            'holdings.overall': overall, // Update overall holdings data
            'holdings.holdings': holdings, // Update individual holding items
          },
        },
        { new: true, upsert: true }
      );

      res.json(response); // Send the response back to the client
    } else {
      res.status(400).json({ error: response }); //  error responses from the API
    }
  } catch (error) {
    console.error('Error fetching holdings:', error);
    res.status(500).json({ error: error.message }); // server errors
  }
};

export const fetchPositionsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_positions();
    // console.log("Positions:", response.netPositions);

    if (response.s === 'ok') {
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
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: error.message });
  }
};

export const fetchTradesAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    fyers.setAccessToken(accessToken);
    const response = await fyers.get_tradebook();

    if (response.s === 'ok') {
      const trades = response.tradeBook;

      await FyersUserDetail.findOneAndUpdate(
        { userId },
        { $set: { 'trades.tradeBook': trades } },
        { new: true, upsert: true }
      );

      res.json(response);
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller function to place an order
export const placeOrder = async (req, res) => {
  const { userId } = req.params;
  const { accessToken, order } = req.body;

  // Validate inputs
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' });
  }
  if (!order || typeof order !== 'object') {
    return res
      .status(400)
      .json({ error: 'Order details are required and should be an object' });
  }

  // Validate order details
  const { isValid, errors } = validateFyersOrder(order);
  if (!isValid) {
    console.log('Order validation failed:', errors);
    return res.status(400).json({ errors });
  }

  try {
    // Set access token and place the order
    fyers.setAccessToken(accessToken);
    // console.log("Placing order:", order);
    const response = await fyers.place_order(order);
    // console.log("Order placed response:", response);

    if (response.s === 'ok') {
      return res.json(response);
    } else {
      return res.status(400).json({ error: response });
    }
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller function to place multiple orders
export const placeMultipleOrders = async (req, res) => {
  const { userId } = req.params;
  const { accessToken, orders } = req.body;

  // console.log(orders);

  // console.log("place order" , accessToken, orders);

  // Validate inputs
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  if (!accessToken)
    return res.status(400).json({ error: 'Access token is required' });
  if (!orders || !Array.isArray(orders) || orders.length === 0)
    return res
      .status(400)
      .json({ error: 'Orders array is required and should not be empty' });

  try {
    // Set the access token for Fyers API
    fyers.setAccessToken(accessToken);

    // Validate each order in the array
    for (const [index, order] of orders.entries()) {
      const { isValid, errors } = validateFyersOrder(order);
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
    if (response.s === 'ok') {
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
        message: 'Order placement result',
        successfulOrders,
        unsuccessfulOrders,
      });
    } else {
      console.log('Error response details:', response);
      const errors = response.data.map((orderResponse, index) => ({
        orderIndex: index,
        ...orderResponse.body,
      }));
      return res
        .status(400)
        .json({ error: 'Order placement failed', details: errors });
    }
  } catch (error) {
    console.error('Error placing multiple orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const exitPosition = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken, positionId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    if (!positionId) {
      return res.status(400).json({ error: "Position ID is required" });
    }

    // Set Fyers credentials dynamically
    fyers.setAccessToken(accessToken);

    // Prepare the request body with the position ID
    const reqBody = { id: positionId };

    // Exit the position using Fyers API
    const response = await fyers.exit_position(reqBody);

    // Handle the response
    if (response.s === 'ok' && response.code === 200) {
      res.status(200).json({ message: response.message });
    } else {
      res.status(400).json({ error: response.message || "Failed to exit position" });
    }
  } catch (error) {
    console.error("Error exiting position:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};