import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
import { KiteConnect } from "kiteconnect";
import zerodhaUserDetailModel from "../../../models/brokers/zerodha/zerodhaUserDetail.model.js";
import ZerodhaUserDetail from "../../../models/brokers/zerodha/zerodhaUserDetail.model.js";

dotenv.config();

// Initialize Zerodha (KiteConnect) instance with the API key
const zerodha = new KiteConnect({
  api_key: process.env.ZERODHA_API_KEY,
});

const ZERODHA_SECRET_KEY = process.env.ZERODHA_SECRET_KEY;

// Helper to generate checksum for Zerodha API request
const generateChecksum = (requestToken) => {
  return crypto
    .createHash("sha256")
    .update(
      `${process.env.ZERODHA_API_KEY}${requestToken}${ZERODHA_SECRET_KEY}`
    )
    .digest("hex");
};

// Helper function to update Zerodha user details in the database
const updateZerodhaUserDetails = async (userId, updateData) => {
  try {
    return await zerodhaUserDetailModel.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );
  } catch (error) {
    throw new Error(`Failed to update Zerodha user details: ${error.message}`);
  }
};

// Generate Auth Code URL
export const generateZerodhaAuthCodeUrl = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const authCodeURL = `https://kite.zerodha.com/connect/login?v=3&api_key=${process.env.ZERODHA_API_KEY}&redirect_uri=${process.env.ZERODHA_REDIRECT_URI}&response_type=code`;

    await updateZerodhaUserDetails(userId, {
      authCodeURL,
      authDate: new Date(),
    });

    res.json({ authCodeURL });
  } catch (error) {
    console.error("Error generating auth code URL:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Generate Access Token
export const generateZerodhaAccessToken = async (req, res) => {
  try {
    const { userId } = req.params; // Extract the user ID from the request params
    const { uri } = req.body; // Extract the provided URI from the request body

    if (!userId || !uri) {
      return res.status(400).json({ error: "User ID and URI are required" });
    }

    // Extract the request_token from the provided URI (Zerodha's callback URL)
    const urlParams = new URLSearchParams(uri.split("?")[1]);
    const requestToken = urlParams.get("request_token");

    if (!requestToken) {
      return res
        .status(400)
        .json({ error: "Authorization code (request_token) is required" });
    }

    // Generate session (access token) using request token and your API secret key
    const accessTokenResponse = await zerodha.generateSession(
      requestToken,
      process.env.ZERODHA_SECRET_KEY
    );

    if (accessTokenResponse && accessTokenResponse.access_token) {
      const accessToken = accessTokenResponse.access_token;

      // Save accessToken to the user's account in the database
      await updateZerodhaUserDetails(userId, {
        accessToken,
        authDate: new Date(),
      });

      return res.json({ accessToken });
    } else {
      return res.status(400).json({
        error: "Failed to generate access token",
        details: accessTokenResponse,
      });
    }
  } catch (error) {
    console.error("Error generating access token:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Fetch Zerodha User Profile and save to DB
export const fetchZerodhaProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId || !accessToken) {
      return res
        .status(400)
        .json({ error: "User ID and Access Token are required" });
    }

    // Call Zerodha API to fetch user profile
    const response = await axios.get("https://api.kite.trade/user/profile", {
      headers: {
        Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`, // Use Zerodha API key and access token
        "X-Kite-Version": "3", // Ensure API version is correct
      },
    });

    // Log the response data for debugging
    console.log("Zerodha API response:", response.data);

    // Check if the response contains profile data under `data`
    if (
      response.data &&
      response.data.status === "success" &&
      response.data.data
    ) {
      const {
        user_id,
        user_type,
        email,
        user_name,
        user_shortname,
        broker,
        exchanges,
        products,
        order_types,
        avatar_url,
        meta,
      } = response.data.data; // Adjusted to access `data`

      // Update user profile in the database
      await updateZerodhaUserDetails(userId, {
        zerodhaId: user_id,
        accessToken,
        profile: {
          userId: user_id,
          userType: user_type,
          email,
          userName: user_name,
          userShortName: user_shortname,
          broker,
          exchanges,
          products,
          orderTypes: order_types,
          avatarUrl: avatar_url,
          dematConsent: meta.demat_consent,
        },
      });

      // Return the profile data to the client
      res.json({ profile: response.data.data });
    } else {
      // Handle the case where profile data is not available
      res
        .status(400)
        .json({ error: response.data.message || "Profile data not found" });
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Zerodha Positions and save to DB
export const fetchZerodhaPositionsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId || !accessToken) {
      return res
        .status(400)
        .json({ error: "User ID and Access Token are required" });
    }

    // Call Zerodha API to fetch positions
    const response = await axios.get(
      "https://api.kite.trade/portfolio/positions",
      {
        headers: {
          Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
          "X-Kite-Version": "3",
        },
      }
    );

    if (response.data && response.data.status === "success") {
      const positions = response.data.data;

      // Save positions to the user profile in the database
      const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
        { userId },
        {
          $set: {
            "positions": positions.net,
          },
          dateFetched: new Date(),
        },
        { new: true, upsert: true } 
      );

      return res.json({
        message: "Positions saved successfully",
        positions: updatedUser.positions,
      });
    } else {
      return res.status(400).json({ error: "Failed to fetch positions" });
    }
  } catch (error) {
    console.error("Error fetching positions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Zerodha Holdings and save to DB
export const fetchZerodhaHoldingsAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId || !accessToken) {
      return res
        .status(400)
        .json({ error: "User ID and Access Token are required" });
    }

    // Call Zerodha API to fetch holdings
    const response = await axios.get(
      "https://api.kite.trade/portfolio/holdings",
      {
        headers: {
          Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
          "X-Kite-Version": "3",
        },
      }
    );

    if (response.data && response.data.status === "success") {
      const holdings = response.data.data;

      // Save holdings to the user profile in the database
      const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
        { userId },
        {
          $set: {
            "holdings": holdings, 
          },
          dateFetched: new Date(),
        },
        { new: true, upsert: true } 
      );

      return res.json({
        message: "Holdings saved successfully",
        holdings: updatedUser.holdings,
      });
    } else {
      return res.status(400).json({ error: "Failed to fetch holdings" });
    }
  } catch (error) {
    console.error("Error fetching holdings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Zerodha Orders and save to DB
export const fetchZerodhaOrdersAndSave = async (req, res) => {
    try {
      const { userId } = req.params;
      const { accessToken } = req.body;
  
      if (!userId || !accessToken) {
        return res
          .status(400)
          .json({ error: "User ID and Access Token are required" });
      }
  
      // Call Zerodha API to fetch orders
      const response = await axios.get(
        "https://api.kite.trade/orders",
        {
          headers: {
            Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
            "X-Kite-Version": "3",
          },
        }
      );
  
      if (response.data && response.data.status === "success") {
        const orders = response.data.data;
  
        // Save orders to the user profile in the database
        const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
          { userId },
          {
            $set: {
              "orders": orders, 
            },
            dateFetched: new Date(),
          },
          { new: true, upsert: true } 
        );
  
        return res.json({
          message: "Orders saved successfully",
          orders: updatedUser.orders,
        });
      } else {
        return res.status(400).json({ error: "Failed to fetch orders" });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Fetch Zerodha Trades and save to DB
export const fetchZerodhaTradesAndSave = async (req, res) => {
    try {
      const { userId } = req.params;
      const { accessToken } = req.body;
  
      if (!userId || !accessToken) {
        return res
          .status(400)
          .json({ error: "User ID and Access Token are required" });
      }
  
      // Call Zerodha API to fetch trades
      const response = await axios.get(
        "https://api.kite.trade/trades",
        {
          headers: {
            Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
            "X-Kite-Version": "3",
          },
        }
      );
  
      if (response.data && response.data.status === "success") {
        const trades = response.data.data;
  
        // Save trades to the user profile in the database
        const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
          { userId },
          {
            $set: {
              "trades": trades,
            },
            dateFetched: new Date(),
          },
          { new: true, upsert: true }
        );
  
        return res.json({
          message: "Trades saved successfully",
          trades: updatedUser.trades,
        });
      } else {
        return res.status(400).json({ error: "Failed to fetch trades" });
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Fetch Zerodha Funds and save to DB
export const fetchZerodhaFundsAndSave = async (req, res) => {
    try {
      const { userId } = req.params;
      const { accessToken } = req.body;
  
      if (!userId || !accessToken) {
        return res.status(400).json({ error: "User ID and Access Token are required" });
      }
  
      // Call Zerodha API to fetch funds
      const response = await axios.get(
        "https://api.kite.trade/user/margins",
        {
          headers: {
            Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
            "X-Kite-Version": "3",
          },
        }
      );
  
      if (response.data && response.data.status === "success") {
        const funds = response.data.data;
  
        // Save funds to the user profile in the database
        const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
          { userId },
          {
            $set: {
              funds: {
                equity: funds.equity, // Save the equity data
                commodity: funds.commodity, // Save the commodity data
              },
            },
            dateFetched: new Date(),
          },
          { new: true, upsert: true } // Create if not exists
        );
  
        return res.json({
          message: "Funds saved successfully",
          funds: updatedUser.funds,
        });
      } else {
        return res.status(400).json({ error: "Failed to fetch funds" });
      }
    } catch (error) {
      console.error("Error fetching funds:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };


