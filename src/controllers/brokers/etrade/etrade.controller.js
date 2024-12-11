// import OAuth from "oauth";
// import dotenv from "dotenv";
// import ETradeUserDetail from "../../../models/brokers/etrade/eTradeUserDetail.model.js";
// import axios from "axios";

// dotenv.config();

// // OAuth setup using Sandbox API Keys
// const oauth = new OAuth.OAuth(
//   "https://apisb.etrade.com/oauth/request_token",
//   "https://apisb.etrade.com/oauth/access_token",
//   process.env.ETRADE_SANDBOX_CONSUMER_KEY,
//   process.env.ETRADE_SANDBOX_CONSUMER_SECRET,
//   "1.0",
//   process.env.ETRADE_CALLBACK_URL,
//   "HMAC-SHA1"
// );

// let requestToken = "";
// let requestTokenSecret = "";

// // Helper function to update E*TRADE user details in the database
// const updateETradeUserDetails = async (userId, updateData) => {
//   return await ETradeUserDetail.findOneAndUpdate({ userId }, updateData, {
//     new: true,
//     upsert: true,
//   });
// };

// // Controller to generate the OAuth request token and redirect the user to E*TRADE's authorization page
// export const generateAuthCodeUrl = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     oauth.getOAuthRequestToken((error, token, tokenSecret) => {
//       if (error) {
//         return res.status(500).json({ error: "Error obtaining OAuth request token", error });
//       }

//       requestToken = token;
//       requestTokenSecret = tokenSecret;
//       const authURL = `https://us.etrade.com/e/t/etws/authorize?key=${process.env.ETRADE_SANDBOX_CONSUMER_KEY}&token=${requestToken}`;
//       res.json({ authCodeURL: authURL });
//     });
//   } catch (error) {
//     console.error("Error generating auth code URL:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// // Controller to handle the callback from E*TRADE and exchange the request token for an access token
// export const generateAccessToken = async (req, res) => {
//   try {
//     const { userId } = req.query;
//     console.log(userId);
    
//     const { oauth_verifier } = req.query; // Verifier from E*TRADE's callback

//     if (!userId || !oauth_verifier) {
//       return res.status(400).json({ error: "User ID and verifier are required" });
//     }

//     oauth.getOAuthAccessToken(
//       requestToken,
//       requestTokenSecret,
//       oauth_verifier,
//       async (error, accessToken, accessTokenSecret) => {
//         if (error) {
//           return res.status(500).json({ error: "Error getting OAuth access token" });
//         }

//         // Save access token and secret in the database
//         await updateETradeUserDetails(userId, {
//           accessToken,
//           accessTokenSecret,
//           authDate: new Date(),
//         });

//         console.log("access token", accessToken);
        

//         res.json({ accessToken });
//       }
//     );
//   } catch (error) {
//     console.error("Error generating access token:", error);
//     res.status(500).json({ error: error.message });
//   }
// };

// export const fetchProfileAndSave = async (req, res) => {
//     try {
//       const { userId } = req.params;
//       const { accessToken } = req.body;
  
//       if (!userId || !accessToken) {
//         return res.status(400).json({ error: "User ID and Access Token are required" });
//       }
  
//       const url = "https://api.etrade.com/v1/accounts/list";
//       console.log("Starting E*TRADE API request at:", new Date());
  
//       const config = {
//         headers: { Authorization: `Bearer ${accessToken}` },
//         timeout: 30000, // 30s timeout
//       };
  
//       const response = await axios.get(url, config);
//       const accountData = response.data;
  
//       console.log("Starting database update at:", new Date());
//       await updateETradeUserDetails(userId, { accountDetails: accountData });
//       console.log("Database updated at:", new Date());
  
//       res.json(accountData);
//     } catch (error) {
//       console.error("Error fetching profile:", error);
//       res.status(500).json({ error: error.message });
//     }
//   };

  
// // // const fetchWithTimeout = (url, accessToken, timeout = 30000) => {
// // //     return new Promise((resolve, reject) => {
// // //       const timer = setTimeout(() => {
// // //         console.error('Request timed out after', timeout, 'ms');
// // //         reject(new Error('Request timed out'));
// // //       }, timeout);
  
// // //       console.log("Making API request to:", url, "at", new Date());
      
// // //       oauth.get(url, accessToken, (error, data, response) => {
// // //         clearTimeout(timer);
// // //         console.log("API response received at:", new Date());
        
// // //         if (error) {
// // //           console.error("Error during API call:", error);
// // //           reject(error);
// // //         } else {
// // //           resolve({ data, response });
// // //         }
// // //       });
// // //     });
// // //   };
  

// // // const fetchWithRetry = async (url, accessToken, retries = 3, delay = 2000) => {
// // //     try {
// // //       const response = await fetchWithTimeout(url, accessToken);
      
// // //       if (response.response.statusCode === 500) {
// // //         const errorData = JSON.parse(response.data);
// // //         if (errorData.message.includes("maintenance") && retries > 0) {
// // //           console.log(`Maintenance in progress. Retrying... ${retries} attempts left.`);
// // //           await new Promise((resolve) => setTimeout(resolve, delay));
// // //           return fetchWithRetry(url, accessToken, retries - 1, delay * 2); // Exponential backoff
// // //         } else {
// // //           throw new Error('Service unavailable. Please try again later.');
// // //         }
// // //       }
  
// // //       return response;
// // //     } catch (error) {
// // //       if (retries > 0) {
// // //         console.log(`Retrying... ${retries} attempts left.`);
// // //         await new Promise((resolve) => setTimeout(resolve, delay));
// // //         return fetchWithRetry(url, accessToken, retries - 1, delay * 2);
// // //       } else {
// // //         throw error;
// // //       }
// // //     }
// // //   };
  

// // // export const fetchProfileAndSave = async (req, res) => {
// // //     try {
// // //       const { userId } = req.params;
// // //       const { accessToken } = req.body;
  
// // //       if (!userId || !accessToken) {
// // //         return res.status(400).json({ error: "User ID and Access Token are required" });
// // //       }
  
// // //       const url = "https://apisb.etrade.com/v1/accounts/list";
// // //       console.log("Starting E*TRADE API request at:", new Date());
  
// // //       const response = await fetchWithRetry(url, accessToken);
  
// // //       if (response.response.statusCode === 500) {
// // //         const errorData = JSON.parse(response.data);
// // //         return res.status(500).json({ error: "E*TRADE is under maintenance. Please try again later." });
// // //       }
  
// // //       const accountData = JSON.parse(response.data);
// // //       console.log("Starting database update at:", new Date());
// // //       await updateETradeUserDetails(userId, { accountDetails: accountData });
// // //       console.log("Database updated at:", new Date());
  
// // //       res.json(accountData);
// // //     } catch (error) {
// // //       console.error("Error fetching profile:", error);
// // //       res.status(500).json({ error: error.message });
// // //     }
// // //   };
  

import OAuth from "oauth";
import dotenv from "dotenv";
import ETradeUserDetail from "../../../models/brokers/etrade/eTradeUserDetail.model.js";
import axios from "axios";
import crypto from "crypto";
import querystring from "querystring";

dotenv.config();

// OAuth setup using Sandbox API Keys
const oauth = new OAuth.OAuth(
  "https://apisb.etrade.com/oauth/request_token",
  "https://apisb.etrade.com/oauth/access_token",
  process.env.ETRADE_SANDBOX_CONSUMER_KEY,
  process.env.ETRADE_SANDBOX_CONSUMER_SECRET,
  "1.0",
  process.env.ETRADE_CALLBACK_URL, // This will be used for the standard callback URL
  "HMAC-SHA1"
);

let requestToken = "";
let requestTokenSecret = "";

// Helper function to update E*TRADE user details in the database
const updateETradeUserDetails = async (userId, updateData) => {
  return await ETradeUserDetail.findOneAndUpdate({ userId }, updateData, {
    new: true,
    upsert: true,
  });
};

// Helper function to generate OAuth signature
const getOAuthSignature = (accessToken, accessTokenSecret, url) => {
  const consumerKey = process.env.ETRADE_SANDBOX_CONSUMER_KEY;
  const consumerSecret = process.env.ETRADE_SANDBOX_CONSUMER_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = Math.random().toString(36).substring(2);

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_nonce: nonce,
    oauth_timestamp: timestamp,
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0",
  };

  const sortedParams = querystring.stringify(oauthParams);
  const baseString = `GET&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;
  return crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
};

// Controller to generate the OAuth request token and redirect the user to E*TRADE's authorization page
export const generateAuthCodeUrl = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const callbackUrl = "oob"; // Use 'oob' for out-of-band callback
    oauth.getOAuthRequestToken({ callback: callbackUrl }, (error, token, tokenSecret) => {
      if (error) {
        console.error("Error obtaining request token:", error);
        return res.status(500).json({ error: "Error obtaining request token" });
      }

      requestToken = token;
      requestTokenSecret = tokenSecret;
      const authURL = `https://us.etrade.com/e/t/etws/authorize?key=${process.env.ETRADE_SANDBOX_CONSUMER_KEY}&token=${requestToken}`;
      res.json({ authCodeURL: authURL });
    });
  } catch (error) {
    console.error("Error generating auth code URL:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controller to exchange the request token for an access token
export const generateAccessToken = async (req, res) => {
  try {
    const { userId } = req.query;
    const { oauth_verifier } = req.query;

    if (!userId || !oauth_verifier) {
      return res.status(400).json({ error: "User ID and verifier are required" });
    }

    oauth.getOAuthAccessToken(
      requestToken,
      requestTokenSecret,
      oauth_verifier,
      async (error, accessToken, accessTokenSecret) => {
        if (error) {
          console.error("Error getting access token:", error);
          return res.status(500).json({ error: "Error getting access token" });
        }

        await updateETradeUserDetails(userId, { accessToken, accessTokenSecret, authDate: new Date() });
        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.error("Error generating access token:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controller to fetch E*TRADE user profile and save it
export const fetchProfileAndSave = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userDetail = await ETradeUserDetail.findOne({ userId }).lean();
    if (!userDetail || !userDetail.accessToken || !userDetail.accessTokenSecret) {
      return res.status(400).json({ error: "Invalid or missing user credentials" });
    }

    const url = "https://apisb.etrade.com/v1/accounts/list";
    const oauthSignature = getOAuthSignature(userDetail.accessToken, userDetail.accessTokenSecret, url);

    const config = {
      headers: {
        Authorization: `OAuth oauth_consumer_key="${process.env.ETRADE_SANDBOX_CONSUMER_KEY}", oauth_token="${userDetail.accessToken}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${Math.floor(Date.now() / 1000)}", oauth_nonce="${Math.random().toString(36).substring(2)}", oauth_signature="${oauthSignature}"`,
      },
      timeout: 30000,
    };

    const response = await axios.get(url, config);
    const accountData = response.data;

    await updateETradeUserDetails(userId, { accountDetails: accountData });
    res.json(accountData);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: error.message });
  }
};