import cron from 'node-cron';
import moment from 'moment-timezone'; // For handling IST
import axios from 'axios'; // For making HTTP requests
import AITradingBot from '../models/aiTradingBot.model.js';
import { endHour, endMin, startHour, startMin } from '../utils/endStartTime.js';

const activateBots = async () => {
  try {
    // Get current date in IST timezone
    const now = moment().tz('Asia/Kolkata');
    const todayStart = now.startOf('day').toDate();
    const todayEnd = now.endOf('day').toDate();

    // Find bots created today with status 'Schedule'
    const botsToActivate = await AITradingBot.find({
      createdAt: { $gte: todayStart, $lt: todayEnd },
      dynamicData: { $elemMatch: { status: 'Schedule' } }, // Adjusted query to handle arrays
    });

    console.log(botsToActivate);

    for (const bot of botsToActivate) {
        const apiEndpoint = getApiEndpoint('activate', bot);
      
        // Extract profitPercentage and riskPercentage from bot
        const { profitPercentage, riskPercentage } = bot;
      
        // Pass profitPercentage and riskPercentage in the payload
        await axios.post(apiEndpoint, {
            marginProfitPercentage: profitPercentage,
            marginLossPercentage: riskPercentage,
        });
      
        // Update the status within the dynamicData array
        await AITradingBot.updateOne(
          { _id: bot._id, 'dynamicData._id': bot.dynamicData[0]._id },
          { $set: { 'dynamicData.$.status': 'Running' } }
        );
      
        console.log(`Activated bot with ID: ${bot._id}`);
      }
      
  } catch (error) {
    console.error('Error activating bots:', error);
  }
};

const deactivateBots = async () => {
  try {
    // Get current date in IST timezone
    const now = moment().tz('Asia/Kolkata');
    const todayStart = now.startOf('day').toDate();
    const todayEnd = now.endOf('day').toDate();

    // Find bots created today with status 'Running'
    const botsToDeactivate = await AITradingBot.find({
      createdAt: { $gte: todayStart, $lt: todayEnd },
      dynamicData: { $elemMatch: { status: 'Running' } }, // Adjusted query to handle arrays
    });

    console.log(botsToDeactivate);

    for (const bot of botsToDeactivate) {
      const apiEndpoint = getApiEndpoint('deactivate', bot);
      await axios.patch(apiEndpoint);

      // Update the status within the dynamicData array
      await AITradingBot.updateOne(
        { _id: bot._id, 'dynamicData._id': bot.dynamicData[0]._id }, 
        { $set: { 'dynamicData.$.status': 'Inactive' } }
      );

      console.log(`Deactivated bot with ID: ${bot._id}`);
    }
  } catch (error) {
    console.error('Error deactivating bots:', error);
  }
};

const getApiEndpoint = (action, bot) => {
  const botType = bot.productType;
  const currentUserId = bot.userId;
  if (botType === 'INTRADAY' || botType === 'CNC') {
    return `http://localhost:8080/api/v1/users/${currentUserId}/auto-trade-bot-${botType}/${action}/bots/${bot._id}`;
  }
  return '';
};


// Function to start the scheduler
export default function startBotScheduler() {
    // Schedule the task to run daily at 9:30 AM IST for activation
    cron.schedule(`${startMin} ${startHour} * * *`, () => {
      console.log('Running bot activation task at 9:30 AM IST');
      activateBots();
    });
  
    // Schedule the task to run daily at 3:30 PM IST for deactivation
    cron.schedule(`${endMin} ${endHour} * * *`, () => {
      console.log('Running bot deactivation task at 3:30 PM IST');
      deactivateBots();
    });
  }
