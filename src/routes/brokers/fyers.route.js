// import express from 'express';
// import {
//   generateAuthCodeUrl,
//   generateAccessToken,
//   fetchProfile,
//   fetchFunds,
//   fetchHoldings,
//   fetchPositions,
//   fetchTrades,
//   placeOrder,
//   placeMultipleOrders,
//   getOrders,
// //   getOrderById,
// //   modifyOrder,
// //   modifyMultipleOrders,
// //   cancelOrder,
// //   cancelMultipleOrders,
// //   exitPositions,
// //   exitPositionsByFilter,
// //   convertPosition,
// //   marketStatus,
// //   getHistoricalData
// } from '../../controllers/brokers/fyers.controller.js';

// const router = express.Router();

// // Define routes
// router.get('/generateAuthCodeUrl', generateAuthCodeUrl);
// router.post('/generateAccessToken', generateAccessToken);
// router.get('/fetchProfile', fetchProfile);
// router.get('/fetchFunds', fetchFunds);
// router.get('/fetchHoldings', fetchHoldings);
// router.get('/fetchPositions', fetchPositions);
// router.get('/fetchTrades', fetchTrades);
// router.post('/placeOrder', placeOrder);
// router.post('/placeMultipleOrders', placeMultipleOrders);
// router.get('/getOrders', getOrders);
// // router.post('/getOrderById', getOrderById);
// // router.post('/modifyOrder', modifyOrder);
// // router.post('/modifyMultipleOrders', modifyMultipleOrders);
// // router.post('/cancelOrder', cancelOrder);
// // router.post('/cancelMultipleOrders', cancelMultipleOrders);
// // router.post('/exitPositions', exitPositions);
// // router.post('/exitPositionsByFilter', exitPositionsByFilter);
// // router.post('/convertPosition', convertPosition);
// // router.get('/marketStatus', marketStatus);
// // router.post('/historical-data', getHistoricalData);

// export default router;

import express from 'express';
import {
  generateAuthCodeUrl,
  generateAccessToken,
} from '../../controllers/brokers/fyers.controller.js';

const router = express.Router();

// Define routes
router.get('/generateAuthCodeUrl', generateAuthCodeUrl);
router.post('/generateAccessToken', generateAccessToken);

export default router;

