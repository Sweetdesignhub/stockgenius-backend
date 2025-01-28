// import cron from 'node-cron';
// import moment from 'moment-timezone'; // For handling IST
// import axios from 'axios';
// import Bot from '../../models/autoTradeBot/bot.model.js';
// import { endHour, endMin, startHour, startMin } from '../../utils/endStartTime.js';


// const API_BASE_URL = 'https://api.stockgenius.ai';
// // const API_BASE_URL = 'http://localhost:8080';

// const activateBotsPT = async () => {
//   try {
//     //  current date in IST timezone
//     const now = moment().tz('Asia/Kolkata');
//     const todayStart = now.startOf('day').toDate();
//     const todayEnd = now.endOf('day').toDate();

//     //  bots created today with status 'Schedule'
//     const botsToActivate = await Bot.find({
//       createdAt: { $gte: todayStart, $lt: todayEnd },
//       dynamicData: { $elemMatch: { status: 'Schedule' } }, // query to handle arrays
//     });

//     console.log(botsToActivate);

//     for (const bot of botsToActivate) {
//       const apiEndpoint = getApiEndpoint('activate', bot);

//       // Extract profitPercentage and riskPercentage from bot
//       const { profitPercentage, riskPercentage } = bot;

//       // Pass profitPercentage and riskPercentage in the payload
//       await axios.post(apiEndpoint, {
//         marginProfitPercentage: profitPercentage,
//         marginLossPercentage: riskPercentage,
//       });

//       // Update the status within the dynamicData array
//       await Bot.updateOne(
//         { _id: bot._id, 'dynamicData._id': bot.dynamicData[0]._id },
//         {
//           $set: {
//             'dynamicData.$.status': 'Running',
//             'dynamicData.$.workingTime': '0',
//             'dynamicData.$.todaysBotTime': '0',
//           }
//         }
//       );

//       console.log(`Activated bot with ID: ${bot._id}`);
//     }

//   } catch (error) {
//     console.error('Error activating bots:', error);
//   }
// };

// const deactivateBotsPT = async () => {
//   try {
//     //  current date in IST timezone
//     const now = moment().tz('Asia/Kolkata');
//     const todayStart = now.startOf('day').toDate();
//     const todayEnd = now.endOf('day').toDate();

//     //  bots created today with status 'Running'
//     const botsToDeactivate = await Bot.find({
//       createdAt: { $gte: todayStart, $lt: todayEnd },
//       dynamicData: { $elemMatch: { status: 'Running' } }, //  query to handle arrays
//     });

//     console.log(botsToDeactivate);

//     for (const bot of botsToDeactivate) {
//       const apiEndpoint = getApiEndpoint('deactivate', bot);
//       await axios.post(apiEndpoint);

//       // Fetch the latest bot data to get the current time values
//       const updatedBot = await Bot.findById(bot._id);
//       const finalWorkingTime = updatedBot.dynamicData[0].workingTime;
//       const finalTodaysBotTime = updatedBot.dynamicData[0].todaysBotTime;

//       // Update the status within the dynamicData array
//       await Bot.updateOne(
//         { _id: bot._id, 'dynamicData._id': bot.dynamicData[0]._id },
//         {
//           $set: {
//             'dynamicData.$.status': 'Inactive',
//             'dynamicData.$.workingTime': finalWorkingTime,
//             'dynamicData.$.todaysBotTime': finalTodaysBotTime,
//           }
//         }
//       );

//       console.log(`Deactivated bot with ID: ${bot._id}`);
//     }
//   } catch (error) {
//     console.error('Error deactivating bots:', error);
//   }
// };

// const getApiEndpoint = (action, bot) => {
//   const botType = bot.productType;
//   const currentUserId = bot.userId;
//   if (botType === 'INTRADAY' || botType === 'CNC') {
//     return `${API_BASE_URL}/api/v1/autoTradeBot/${action}/users/${currentUserId}/bots/${bot._id}`;
//   }
//   return '';
// };


// // Function to start the scheduler
// export default function startBotSchedulerPT() {
//   // Schedule the task to run daily at 9:15 AM IST for activation
//   cron.schedule(`${startMin} ${startHour} * * *`, () => {
//     console.log('Running bot activation papertrading task at 9:15 AM IST');
//     activateBotsPT();
//   });

//   // Schedule the task to run daily at 3:30 PM IST for deactivation
//   cron.schedule(`${endMin} ${endHour} * * *`, () => {
//     console.log('Running bot deactivation papertrading task at 3:30 PM IST');
//     deactivateBotsPT();
//   });
// }
