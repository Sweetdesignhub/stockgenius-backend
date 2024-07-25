import { fyersModel } from "fyers-api-v3";
import fs from "fs";
import dotenv from "dotenv";

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

export const generateAuthCodeUrl = (req, res) => {
  console.log("enteres");
  const authCodeURL = fyers.generateAuthCode();
  console.log("generated", authCodeURL);
  res.json({ authCodeURL });
};

export const generateAccessToken = async (req, res) => {
  const uri = req.body.uri;
  // console.log("uri :",uri);
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
  // console.log(authCode);
  try {
    const response = await fyers.generate_access_token({
      client_id: APPID,
      secret_key: SECRET_KEY,
      auth_code: authCode,
      grant_type: "authorization_code",
    });
    if (response.s === "ok") {
      console.log(response);
      // fyers.setAccessToken(response.access_token);
      // res.json({ accessToken: response.access_token });
      const accessToken = response.access_token;
      res.json({ accessToken });
    } else {
      res.status(400).json({ error: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchProfile = async (req, res) => {
  try {
    const fyersAccessToken = req.headers.authorization.split(" ")[1];
    fyers.setAccessToken(fyersAccessToken);
    const response = await fyers.get_profile();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchFunds = async (req, res) => {
  try {
    const fyersAccessToken = req.headers.authorization.split(" ")[1];
    fyers.setAccessToken(fyersAccessToken);
    const response = await fyers.get_funds();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const fyersAccessToken = req.headers.authorization.split(" ")[1];

    fyers.setAccessToken(fyersAccessToken);
    // fyers.setAccessToken('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhcGkuZnllcnMuaW4iLCJpYXQiOjE3MjE3NjA4MjgsImV4cCI6MTcyMTc4MTA0OCwibmJmIjoxNzIxNzYwODI4LCJhdWQiOlsieDowIiwieDoxIiwieDoyIiwiZDoxIiwiZDoyIl0sInN1YiI6ImFjY2Vzc190b2tlbiIsImF0X2hhc2giOiJnQUFBQUFCbW5fdzh0OG5OVXVSSnFZNmFfd3MzdlM5UEZ5dEJWSEYtcnR6TEdfN2dFRGU5SmV3dHJyTEQ5N0NYZmM2d3J1bVhyd1ItcWQ4eURvbXFra1hRZWNFRmQzOE9TdWItQk53R2dOM2NNbmxQNGwwQUE5ND0iLCJkaXNwbGF5X25hbWUiOiJBU1dJTkkgR0FKSkFMQSIsIm9tcyI6IksxIiwiaHNtX2tleSI6IjU1MmM0M2Y1OGMyMDdlMzQ4YzcxM2Q3Y2JjNmRjOTlhNDE3NDFjMDJjMmIwM2U0NTgzZmE2MjYxIiwiZnlfaWQiOiJZQTE0MjIxIiwiYXBwVHlwZSI6MTAyLCJwb2FfZmxhZyI6Ik4ifQ.RFfhOXQgfFVfGxeLYM7ycNhbFKQlcAfBwI9hLeTN_is');
    const response = await fyers.get_orders();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchHoldings = async (req, res) => {
  try {
    const fyersAccessToken = req.headers.authorization.split(" ")[1];

    // fyers.setAccessToken('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhcGkuZnllcnMuaW4iLCJpYXQiOjE3MjE3NjA4MjgsImV4cCI6MTcyMTc4MTA0OCwibmJmIjoxNzIxNzYwODI4LCJhdWQiOlsieDowIiwieDoxIiwieDoyIiwiZDoxIiwiZDoyIl0sInN1YiI6ImFjY2Vzc190b2tlbiIsImF0X2hhc2giOiJnQUFBQUFCbW5fdzh0OG5OVXVSSnFZNmFfd3MzdlM5UEZ5dEJWSEYtcnR6TEdfN2dFRGU5SmV3dHJyTEQ5N0NYZmM2d3J1bVhyd1ItcWQ4eURvbXFra1hRZWNFRmQzOE9TdWItQk53R2dOM2NNbmxQNGwwQUE5ND0iLCJkaXNwbGF5X25hbWUiOiJBU1dJTkkgR0FKSkFMQSIsIm9tcyI6IksxIiwiaHNtX2tleSI6IjU1MmM0M2Y1OGMyMDdlMzQ4YzcxM2Q3Y2JjNmRjOTlhNDE3NDFjMDJjMmIwM2U0NTgzZmE2MjYxIiwiZnlfaWQiOiJZQTE0MjIxIiwiYXBwVHlwZSI6MTAyLCJwb2FfZmxhZyI6Ik4ifQ.RFfhOXQgfFVfGxeLYM7ycNhbFKQlcAfBwI9hLeTN_is');
    fyers.setAccessToken(fyersAccessToken);
    const response = await fyers.get_holdings();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchPositions = async (req, res) => {
  try {
    const fyersAccessToken = req.headers.authorization.split(" ")[1];
    fyers.setAccessToken(fyersAccessToken);
    const response = await fyers.get_positions();
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchTrades = async (req, res) => {
  try {
    const fyersAccessToken = req.headers.authorization.split(" ")[1];
    fyers.setAccessToken(fyersAccessToken);
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
    const fyersAccessToken = req.headers.authorization.split(" ")[1];
    fyers.setAccessToken(fyersAccessToken);
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
    const fyersAccessToken = req.headers.authorization.split(" ")[1];
    fyers.setAccessToken(fyersAccessToken);
    const response = await fyers.place_multi_order(ordersDetails);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// import { fyersModel } from "fyers-api-v3";
// import fs from "fs";
// import dotenv from "dotenv";
// import FyersCredentials from "../../models/brokers/fyers.model.js";

// dotenv.config();
// const logsDir = "./logs";
// if (!fs.existsSync(logsDir)) {
//   fs.mkdirSync(logsDir);
// }

// const fyers = new fyersModel({ path: logsDir, enableLogging: true });

// export const saveCredentials = async (req, res) => {
//   const { nickname, mobileNumber, email, fyersId, appId, secretId, userId } =
//     req.body;

//   try {
//     // Check for duplicates
//     const existingCredentials = await FyersCredentials.findOne({
//       $or: [{ fyersId }, { appId }, { secretId }],
//     });

//     if (existingCredentials) {
//       return res
//         .status(400)
//         .json({ error: "Duplicate Fyers ID, App ID, or Secret ID found" });
//     }

//     const newCredentials = new FyersCredentials({
//       broker: "Fyers",
//       nickname,
//       mobile: mobileNumber,
//       email,
//       fyersId,
//       appId,
//       secretId,
//       userId,
//     });

//     await newCredentials.save();
//     res.status(201).json({ message: "Credentials saved successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Fetch all broker details using userId
// export const getBrokerDetails = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const brokerDetails = await FyersCredentials.find({ userId });
//     res.status(200).json(brokerDetails);
//   } catch (error) {
//     res.status(500).json({ error: "Error fetching broker details" });
//   }
// };

// // Update Fyers credentials
// export const updateFyersCredentials = async (req, res) => {
//   const { id } = req.params;
//   const { nickname, mobileNumber, email, fyersId, appId, secretId } = req.body;

//   try {
//     const updatedCredentials = await FyersCredentials.findByIdAndUpdate(
//       id,
//       { nickname, mobileNumber, email, fyersId, appId, secretId },
//       { new: true }
//     );
//     res.status(200).json(updatedCredentials);
//   } catch (error) {
//     res.status(500).json({ error: "Error updating Fyers credentials" });
//   }
// };

// // Delete Fyers credentials
// export const deleteFyersCredentials = async (req, res) => {
//   const { id } = req.params;

//   try {
//     await FyersCredentials.findByIdAndDelete(id);
//     res.status(200).json({ message: "Fyers credentials deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Error deleting Fyers credentials" });
//   }
// };

// // Generate Authorization Code URL

// export const generateAuthCodeUrl = async (req, res) => {
//   const { userId } = req.body;
//   const { id} = req.params;

//   try {
//     // Check if the user ID and credentials ID exist
//     const userCredentials = await FyersCredentials.findOne({
//       userId,
//       _id: id,
//     });

//     if (!userCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Credentials not found or unauthorized access." });
//     }

//     // Update or create FyersCredentials if not exists
//     const fyersCredentials = await FyersCredentials.findOneAndUpdate(
//       { userId, _id: id },
//       { userId },
//       { upsert: true, new: true }
//     );

//     // Configure Fyers API credentials
//     fyers.setAppId(fyersCredentials.appId);
//     fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);

//     // Generate authCode URL
//     const authCodeURL = fyers.generateAuthCode();

//     // Save authCodeURL to the database
//     fyersCredentials.authCodeURL = authCodeURL;
//     await fyersCredentials.save();

//     res.json({ authCodeURL });
//   } catch (error) {
//     console.error("Error generating authCode URL:", error);
//     res.status(500).json({ error: "Failed to generate authCode URL." });
//   }
// };

// // Generate Access Token
// export const generateAccessToken = async (req, res) => {
//   const { userId, id, uri } = req.body;
//   console.log('Userid: ', userId);
//   console.log('creid: ', id);
//   console.log('Uri: ', uri);

//   try {
//     if (!uri) {
//       return res
//         .status(400)
//         .json({ error: "URI is required in the request body" });
//     }

//     const urlParams = new URLSearchParams(uri);
//     const authCode = urlParams.get("auth_code");

//     if (!authCode) {
//       return res.status(400).json({ error: "Auth code not found in URI" });
//     }

//     // Check if the user ID and credentials ID exist
//     const userCredentials = await FyersCredentials.findOne({
//       userId,
//       _id: id,
//     });

//     if (!userCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Credentials not found or unauthorized access." });
//     }

//     // Configure Fyers API credentials
//     fyers.setAppId(userCredentials.appId);
//     fyers.setSecretId(userCredentials.secretId);

//     // Generate access token using Fyers API client
//     const response = await fyers.generate_access_token({
//       client_id: userCredentials.appId,
//       secret_key: userCredentials.secretId,
//       auth_code: authCode,
//     });

//     if (response.s === "ok") {
//       const { access_token: accessToken, refresh_token: refreshToken } =
//         response;

//       // Update FyersCredentials document with new tokens
//       userCredentials.accessToken = accessToken;
//       userCredentials.refreshToken = refreshToken;
//       await userCredentials.save();

//       // Set access token in Fyers API client instance
//       fyers.setAccessToken(accessToken);

//       return res.json({ accessToken });
//     } else {
//       return res.status(400).json({ error: response });
//     }
//   } catch (error) {
//     console.error("Error generating access token:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// // Fetch Profile
// export const fetchProfile = async (req, res) => {
//   const userId = "66617e9b6e78cf0b3ea0d9e4";
//   console.log("Fetching profile for user: ", userId);

//   try {
//     // Find Fyers credentials for the user
//     const fyersCredentials = await FyersCredentials.findOne({ userId });

//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     // Set Fyers API credentials
//     fyers.setAccessToken(fyersCredentials.accessToken);
//     fyers.setAppId(fyersCredentials.appId); // Set App ID using setAppId function
//     fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);

//     // Call Fyers API to get profile data
//     const response = await fyers.get_profile();
//     console.log("Fyers profile response: ", response);

//     // Return profile data in JSON response
//     res.json(response);
//   } catch (error) {
//     console.error("Error fetching Fyers profile: ", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Fetch Funds
// export const fetchFunds = async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const fyersCredentials = await FyersCredentials.findOne({ userId });
//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     fyers.setAccessToken(fyersCredentials.accessToken);
//     fyers.setAppId(fyersCredentials.appId);
//     fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);

//     const response = await fyers.get_funds();
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Get Orders
// export const getOrders = async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const fyersCredentials = await FyersCredentials.findOne({ userId });
//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     fyers.setAccessToken(fyersCredentials.accessToken);
//     fyers.setAppId(fyersCredentials.appId);
//     fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);

//     const response = await fyers.get_orders();
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Fetch Holdings
// export const fetchHoldings = async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const fyersCredentials = await FyersCredentials.findOne({ userId });
//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     fyers.setAccessToken(fyersCredentials.accessToken);
//     fyers.setAppId(fyersCredentials.appId);
//     fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);

//     const response = await fyers.get_holdings();
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Fetch Positions
// export const fetchPositions = async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const fyersCredentials = await FyersCredentials.findOne({ userId });
//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     fyers.setAccessToken(fyersCredentials.accessToken);
//     fyers.setAppId(fyersCredentials.appId);
//     fyers.setRedirectUrl(process.env.FYERS_REDIRECT_URI);

//     const response = await fyers.get_positions();
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Fetch Trades
// export const fetchTrades = async (req, res) => {
//   const { userId } = req.params;
//   try {
//     const fyersCredentials = await FyersCredentials.findOne({ userId });
//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     fyers.setAccessToken(fyersCredentials.accessToken);

//     const response = await fyers.get_tradebook();
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Place Order
// export const placeOrder = async (req, res) => {
//   const { userId } = req.params;
//   const orderDetails = req.body;

//   try {
//     const fyersCredentials = await FyersCredentials.findOne({ userId });
//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     fyers.setAccessToken(fyersCredentials.accessToken);

//     const response = await fyers.place_order(orderDetails);
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Place Multiple Orders
// export const placeMultipleOrders = async (req, res) => {
//   const { userId } = req.params;
//   const ordersDetails = req.body;

//   try {
//     const fyersCredentials = await FyersCredentials.findOne({ userId });
//     if (!fyersCredentials) {
//       return res
//         .status(404)
//         .json({ error: "Fyers credentials not found for user" });
//     }

//     fyers.setAccessToken(fyersCredentials.accessToken);

//     const response = await fyers.place_multi_order(ordersDetails);
//     res.json(response);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
