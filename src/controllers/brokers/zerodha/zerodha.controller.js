import dotenv from "dotenv";
import crypto from "crypto";
import { KiteConnect } from "kiteconnect";
import ZerodhaUserDetail from "../../../models/brokers/zerodha/zerodhaUserDetail.model.js";
import { validateZerodhaOrder } from "../../../utils/validateZerodhaOrder.js";

dotenv.config();

// Validate required environment variables
const validateEnvVars = () => {
  const requiredEnvVars = [
    "ZERODHA_API_KEY",
    "ZERODHA_SECRET_KEY",
    "ZERODHA_REDIRECT_URI",
  ];
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar])
      throw new Error(`Missing environment variable: ${envVar}`);
  });
};

validateEnvVars();

// Initialize Zerodha (KiteConnect) instance with the API key
const zerodha = new KiteConnect({ api_key: process.env.ZERODHA_API_KEY });
const ZERODHA_SECRET_KEY = process.env.ZERODHA_SECRET_KEY;

// Helper function to update Zerodha user details in the database
const updateZerodhaUserDetails = async (userId, updateData) => {
  try {
    return await ZerodhaUserDetail.findOneAndUpdate({ userId }, updateData, {
      new: true,
      upsert: true,
    });
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
    console.log(authCodeURL);
    

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
    const { userId } = req.params;
    const { uri } = req.body;

    if (!userId || !uri) {
      return res.status(400).json({ error: "User ID and URI are required" });
    }

    // Extract the request_token from the provided URI
    const urlParams = new URLSearchParams(uri.split("?")[1]);
    const requestToken = urlParams.get("request_token");

    if (!requestToken) {
      return res
        .status(400)
        .json({ error: "Authorization code (request_token) is required" });
    }

    // Generate session (access token)
    const accessTokenResponse = await zerodha
      .generateSession(requestToken, ZERODHA_SECRET_KEY)
      .catch((error) => {
        console.error("Error generating session:", error);
        return null;
      });
      console.log("acces token", accessTokenResponse);
      console.log("acces token", accessTokenResponse.access_token);
      

    if (!accessTokenResponse || !accessTokenResponse.access_token) {
      return res.status(400).json({
        error: "Failed to generate access token",
        details: accessTokenResponse || "Unknown error",
      });
    }

    // Save accessToken to the user's account in the database
    await updateZerodhaUserDetails(userId, {
      accessToken: accessTokenResponse.access_token,
      authDate: new Date(),
    });

    return res.json({ accessToken: accessTokenResponse.access_token });
  } catch (error) {
    console.error("Error generating access token:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Fetch Zerodha User Profile and save to DB
export const fetchZerodhaProfileAndSave = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userDetail = await ZerodhaUserDetail.findOne({ userId });

    if (!userDetail || !userDetail.accessToken) {
      return res
        .status(400)
        .json({ error: "Access Token is missing or invalid" });
    }

    // Set the access token for KiteConnect SDK
    zerodha.setAccessToken(userDetail.accessToken);

    // Fetch the profile using the SDK
    const profile = await zerodha.getProfile();
    // console.log(profile);
    

    // Update the database with the profile details
    await ZerodhaUserDetail.findOneAndUpdate(
      { userId },
      {
        profile: {
          userId: profile.user_id,
          userType: profile.user_type,
          email: profile.email,
          userName: profile.user_name,
          userShortname: profile.user_shortname,
          broker: profile.broker,
          exchanges: profile.exchanges,
          products: profile.products,
          orderTypes: profile.order_types,
          avatarUrl: profile.avatar_url,
          dematConsent: profile.meta.demat_consent,
        },
        authDate: new Date(),
      },
      { new: true, upsert: true } // Options to return the updated document and create if it doesn't exist
    );

    res.json({ message: "Profile updated successfully", profile });
  } catch (error) {
    console.error("Error fetching Zerodha profile:", error);
    res.status(500).json({ error: "Failed to fetch Zerodha profile" });
  }
};

// Fetch Zerodha Positions and save to DB
export const fetchZerodhaPositionsAndSave = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user details including access token
    const userDetail = await ZerodhaUserDetail.findOne({ userId }).populate(
      "positions"
    );

    if (!userDetail) {
      return res.status(404).json({
        positions: {
          net: [{}], // Empty response structure
          day: [{}],
        },
      });
    }

    zerodha.setAccessToken(userDetail.accessToken); // Set the access token

    // Fetch positions from Zerodha
    const positionsData = await zerodha.getPositions();
    // console.log(positionsData);
    

    // Structure positions data for saving and response
    const positions = {
      net: positionsData.net || [{}],
      day: positionsData.day || [{}],
    };

    // Optionally save the fetched positions to the database
    await ZerodhaUserDetail.updateOne(
      { userId },
      {
        $set: {
          positions: {
            net: positions.net,
            day: positions.day,
          },
        },
      }
    );

    return res.status(200).json({
      positions: {
        net: positions.net.length > 0 ? positions.net : [{}],
        day: positions.day.length > 0 ? positions.day : [{}],
      },
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    return res.status(500).json({ error: "Error fetching positions" });
  }
};

// Fetch Zerodha Holdings and save to DB
export const fetchZerodhaHoldingsAndSave = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user details including access token
    const userDetail = await ZerodhaUserDetail.findOne({ userId });

    if (!userDetail) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize KiteConnect with the access token
    zerodha.setAccessToken(userDetail.accessToken); // Set the access token

    // Call Zerodha API to fetch holdings
    const holdingsData = await zerodha.getHoldings();
    // console.log(holdingsData);
    

    // Extract holdings from the response
    const holdings = holdingsData || []; // Get the holdings or an empty array

    // Save holdings to the user profile in the database
    const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
      { userId },
      {
        $set: {
          holdings: holdings, // Save the fetched holdings
        },
        dateFetched: new Date(),
      },
      { new: true, upsert: true }
    );

    return res.json({
      message: "Holdings saved successfully",
      holdings: updatedUser.holdings,
    });
  } catch (error) {
    console.error("Error fetching holdings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Zerodha Orders and save to DB
export const fetchZerodhaOrdersAndSave = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user details including access token
    const userDetail = await ZerodhaUserDetail.findOne({ userId });

    if (!userDetail) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize KiteConnect with the access token
    zerodha.setAccessToken(userDetail.accessToken); // Set the access token

    // Call Zerodha API to fetch orders
    const ordersData = await zerodha.getOrders();
    // console.log(ordersData);
    

    // Extract orders from the response
    const orders = ordersData || []; // Get the orders or an empty array

    // Save orders to the user profile in the database
    const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
      { userId },
      {
        $set: {
          orders: orders, // Save the fetched orders
        },
        dateFetched: new Date(),
      },
      { new: true, upsert: true }
    );

    return res.json({
      message: "Orders saved successfully",
      orders: updatedUser.orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Zerodha Trades and save to DB
export const fetchZerodhaTradesAndSave = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user details including access token
    const userDetail = await ZerodhaUserDetail.findOne({ userId });

    if (!userDetail) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize KiteConnect with the access token
    zerodha.setAccessToken(userDetail.accessToken); // Set the access token

    // Call Zerodha API to fetch trades
    const tradesData = await zerodha.getTrades();
    // console.log(tradesData);
    

    // Extract trades from the response
    const trades = tradesData || []; // Get the trades or an empty array

    // Save trades to the user profile in the database
    const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
      { userId },
      {
        $set: {
          trades: trades, // Save the fetched trades
        },
        dateFetched: new Date(),
      },
      { new: true, upsert: true }
    );

    return res.json({
      message: "Trades saved successfully",
      trades: updatedUser.trades,
    });
  } catch (error) {
    console.error("Error fetching trades:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fetch Zerodha Funds and save to DB
export const fetchZerodhaFundsAndSave = async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch user details including access token
    const userDetail = await ZerodhaUserDetail.findOne({ userId });

    if (!userDetail) {
      return res.status(404).json({ error: "User not found" });
    }

    // Initialize KiteConnect with the access token
    zerodha.setAccessToken(userDetail.accessToken); // Set the access token

    // Call Zerodha API to fetch funds
    const fundsData = await zerodha.getMargins();
    // console.log(fundsData); // Log the response for debugging

    // Check if the response has data and extract funds
    if (fundsData) {
      const equity = fundsData.equity || {}; // Safely access equity
      const commodity = fundsData.commodity || {}; // Safely access commodity

      // Save funds to the user profile in the database
      const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
        { userId },
        {
          $set: {
            funds: {
              equity,
              commodity,
            }, 
          },
          dateFetched: new Date(),
        },
        { new: true, upsert: true }
      );

      return res.json({
        message: "Funds saved successfully",
        funds: updatedUser.funds,
      });
    } else {
      // Handling case where fundsData does not contain expected data
      return res
        .status(500)
        .json({ error: "Invalid funds data received from API" });
    }
  } catch (error) {
    console.error("Error fetching funds:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// API to place Zerodha order
export const placeZerodhaOrder = async (req, res) => {
  const { userId } = req.params;  
  const { order } = req.body;  

  // Input validation
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  if (!order || typeof order !== 'object') {
    return res.status(400).json({ error: 'Order details are required and should be an object' });
  }

  try {
    // Fetch user's Zerodha details using userId
    const userDetail = await ZerodhaUserDetail.findOne({ userId });

    if (!userDetail) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessToken = userDetail.accessToken;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Validate order details
    const { isValid, errors } = validateZerodhaOrder(order);
    if (!isValid) {
      return res.status(400).json({ error: 'Order validation failed', details: errors });
    }

    // Set access token for Kite SDK (Zerodha)
    zerodha.setAccessToken(accessToken);

    // Place order via Zerodha API
    const orderResponse = await zerodha.placeOrder("regular", order);

    if (orderResponse && orderResponse.order_id) {
      return res.status(200).json({
        message: "Order placed successfully",
        order_id: orderResponse.order_id,
        success: true
      });
    } else {
      return res.status(500).json({ error: 'Failed to place the order. Please try again.' });
    }
    
  } catch (error) {
    console.error("Error placing order:", error.message);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};


// // Fetch Zerodha User Profile and save to DB
// export const fetchZerodhaProfile = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { accessToken } = req.body;

//     if (!userId || !accessToken) {
//       return res
//         .status(400)
//         .json({ error: "User ID and Access Token are required" });
//     }

//     // Call Zerodha API to fetch user profile
//     const response = await axios.get("https://api.kite.trade/user/profile", {
//       headers: {
//         Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`, // Use Zerodha API key and access token
//         "X-Kite-Version": "3", // Ensure API version is correct
//       },
//     });

//     // Log the response data for debugging
//     console.log("Zerodha API response:", response.data);

//     // Check if the response contains profile data under `data`
//     if (
//       response.data &&
//       response.data.status === "success" &&
//       response.data.data
//     ) {
//       const {
//         user_id,
//         user_type,
//         email,
//         user_name,
//         user_shortname,
//         broker,
//         exchanges,
//         products,
//         order_types,
//         avatar_url,
//         meta,
//       } = response.data.data; // Adjusted to access `data`

//       // Update user profile in the database
//       await updateZerodhaUserDetails(userId, {
//         zerodhaId: user_id,
//         accessToken,
//         profile: {
//           userId: user_id,
//           userType: user_type,
//           email,
//           userName: user_name,
//           userShortName: user_shortname,
//           broker,
//           exchanges,
//           products,
//           orderTypes: order_types,
//           avatarUrl: avatar_url,
//           dematConsent: meta.demat_consent,
//         },
//       });

//       // Return the profile data to the client
//       res.json({ profile: response.data.data });
//     } else {
//       // Handle the case where profile data is not available
//       res
//         .status(400)
//         .json({ error: response.data.message || "Profile data not found" });
//     }
//   } catch (error) {
//     console.error("Error fetching profile:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// Fetch Zerodha Positions and save to DB
// export const fetchZerodhaPositionsAndSave = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { accessToken } = req.body;

//     if (!userId || !accessToken) {
//       return res
//         .status(400)
//         .json({ error: "User ID and Access Token are required" });
//     }

//     // Call Zerodha API to fetch positions
//     const response = await axios.get(
//       "https://api.kite.trade/portfolio/positions",
//       {
//         headers: {
//           Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
//           "X-Kite-Version": "3",
//         },
//       }
//     );

//     if (response.data && response.data.status === "success") {
//       const positions = response.data.data;

//       // Save positions to the user profile in the database
//       const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
//         { userId },
//         {
//           $set: {
//             "positions": positions.net,
//           },
//           dateFetched: new Date(),
//         },
//         { new: true, upsert: true }
//       );

//       return res.json({
//         message: "Positions saved successfully",
//         positions: updatedUser.positions,
//       });
//     } else {
//       return res.status(400).json({ error: "Failed to fetch positions" });
//     }
//   } catch (error) {
//     console.error("Error fetching positions:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// // Fetch Zerodha Holdings and save to DB
// export const fetchZerodhaHoldingsAndSave = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { accessToken } = req.body;

//     if (!userId || !accessToken) {
//       return res
//         .status(400)
//         .json({ error: "User ID and Access Token are required" });
//     }

//     // Call Zerodha API to fetch holdings
//     const response = await axios.get(
//       "https://api.kite.trade/portfolio/holdings",
//       {
//         headers: {
//           Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
//           "X-Kite-Version": "3",
//         },
//       }
//     );

//     if (response.data && response.data.status === "success") {
//       const holdings = response.data.data;

//       // Save holdings to the user profile in the database
//       const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
//         { userId },
//         {
//           $set: {
//             "holdings": holdings,
//           },
//           dateFetched: new Date(),
//         },
//         { new: true, upsert: true }
//       );

//       return res.json({
//         message: "Holdings saved successfully",
//         holdings: updatedUser.holdings,
//       });
//     } else {
//       return res.status(400).json({ error: "Failed to fetch holdings" });
//     }
//   } catch (error) {
//     console.error("Error fetching holdings:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// // Fetch Zerodha Orders and save to DB
// export const fetchZerodhaOrdersAndSave = async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { accessToken } = req.body;

//       if (!userId || !accessToken) {
//         return res
//           .status(400)
//           .json({ error: "User ID and Access Token are required" });
//       }

//       // Call Zerodha API to fetch orders
//       const response = await axios.get(
//         "https://api.kite.trade/orders",
//         {
//           headers: {
//             Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
//             "X-Kite-Version": "3",
//           },
//         }
//       );

//       if (response.data && response.data.status === "success") {
//         const orders = response.data.data;

//         // Save orders to the user profile in the database
//         const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
//           { userId },
//           {
//             $set: {
//               "orders": orders,
//             },
//             dateFetched: new Date(),
//           },
//           { new: true, upsert: true }
//         );

//         return res.json({
//           message: "Orders saved successfully",
//           orders: updatedUser.orders,
//         });
//       } else {
//         return res.status(400).json({ error: "Failed to fetch orders" });
//       }
//     } catch (error) {
//       console.error("Error fetching orders:", error);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   };

//   // Fetch Zerodha Trades and save to DB
// export const fetchZerodhaTradesAndSave = async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { accessToken } = req.body;

//       if (!userId || !accessToken) {
//         return res
//           .status(400)
//           .json({ error: "User ID and Access Token are required" });
//       }

//       // Call Zerodha API to fetch trades
//       const response = await axios.get(
//         "https://api.kite.trade/trades",
//         {
//           headers: {
//             Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
//             "X-Kite-Version": "3",
//           },
//         }
//       );

//       if (response.data && response.data.status === "success") {
//         const trades = response.data.data;

//         // Save trades to the user profile in the database
//         const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
//           { userId },
//           {
//             $set: {
//               "trades": trades,
//             },
//             dateFetched: new Date(),
//           },
//           { new: true, upsert: true }
//         );

//         return res.json({
//           message: "Trades saved successfully",
//           trades: updatedUser.trades,
//         });
//       } else {
//         return res.status(400).json({ error: "Failed to fetch trades" });
//       }
//     } catch (error) {
//       console.error("Error fetching trades:", error);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   };

//   // Fetch Zerodha Funds and save to DB
// export const fetchZerodhaFundsAndSave = async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { accessToken } = req.body;

//       if (!userId || !accessToken) {
//         return res.status(400).json({ error: "User ID and Access Token are required" });
//       }

//       // Call Zerodha API to fetch funds
//       const response = await axios.get(
//         "https://api.kite.trade/user/margins",
//         {
//           headers: {
//             Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
//             "X-Kite-Version": "3",
//           },
//         }
//       );

//       if (response.data && response.data.status === "success") {
//         const funds = response.data.data;

//         // Save funds to the user profile in the database
//         const updatedUser = await ZerodhaUserDetail.findOneAndUpdate(
//           { userId },
//           {
//             $set: {
//               funds: {
//                 equity: funds.equity, // Save the equity data
//                 commodity: funds.commodity, // Save the commodity data
//               },
//             },
//             dateFetched: new Date(),
//           },
//           { new: true, upsert: true } // Create if not exists
//         );

//         return res.json({
//           message: "Funds saved successfully",
//           funds: updatedUser.funds,
//         });
//       } else {
//         return res.status(400).json({ error: "Failed to fetch funds" });
//       }
//     } catch (error) {
//       console.error("Error fetching funds:", error);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   };
