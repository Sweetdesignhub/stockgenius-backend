import WebSocket from 'ws';
import moment from 'moment-timezone';
import AITradingBot from '../models/aiTradingBot.model.js';
import { isWithinTradingHours } from '../utils/helper.js';

const allowedOrigins = [
  'https://www.stockgenius.ai',
  'http://localhost:5173',
  'https://stockgenius.ai',
  'http://127.0.0.1:5173/',
  'https://main.d25eiqtm1m2vp1.amplifyapp.com'
];

export function setupWebSocket(server) {
  const wss = new WebSocket.Server({
    server,
    verifyClient: (info, callback) => {
      const origin = info.origin;
      if (allowedOrigins.includes(origin)) {
        callback(true);
      } else {
        callback(false, 403, 'Forbidden');
      }
    }
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message) => {
      const data = JSON.parse(message);

      if (data.type === 'subscribeBotTime') {
        // Check if bot was created today before establishing connection
        const bot = await AITradingBot.findById(data.botId);
        const today = moment().tz("Asia/Kolkata").startOf('day');
        const botCreatedDate = moment(bot.createdAt).tz("Asia/Kolkata").startOf('day');

        if (botCreatedDate.isSame(today)) {
          ws.botId = data.botId;
          sendBotTime(ws);
        } else {
          // Send one-time message for non-today bots
          ws.send(JSON.stringify({
            type: 'botTime',
            botId: data.botId,
            workingTime: bot.dynamicData[0].workingTime,
            todaysBotTime: '0',
            currentWeekTime: bot.dynamicData[0].currentWeekTime,
            status: bot.dynamicData[0].status,
            isHistorical: true
          }));
          // Close connection for non-today bots
          ws.close();
        }
      } else if (data.type === 'subscribeAllBotsTime') {
        ws.userId = data.userId;
        sendAllBotsTime(ws);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  setInterval(() => updateBotTimes(wss), 1000);
}

async function sendBotTime(ws) {
  try {
    const bot = await AITradingBot.findById(ws.botId);
    if (bot) {
      ws.send(JSON.stringify({
        type: 'botTime',
        botId: ws.botId,
        workingTime: bot.dynamicData[0].workingTime,
        todaysBotTime: bot.dynamicData[0].todaysBotTime,
        currentWeekTime: bot.dynamicData[0].currentWeekTime,
        status: bot.dynamicData[0].status
      }));
    }
  } catch (error) {
    console.error('Error sending bot time:', error);
  }
}

async function sendAllBotsTime(ws) {
  try {
    const today = moment().tz("Asia/Kolkata").startOf('day');
    const startOfWeek = moment().tz("Asia/Kolkata").startOf('isoWeek');

    // Only fetch bots created in the current week
    const bots = await AITradingBot.find({
      userId: ws.userId,
      createdAt: {
        $gte: startOfWeek.toDate()
      }
    });

    let totalTodaysBotTime = 0;
    let totalCurrentWeekTime = 0;

    bots.forEach(bot => {
      const botCreatedAt = moment(bot.createdAt).tz("Asia/Kolkata");

      // Add to today's time only if bot was created today
      if (botCreatedAt.isSame(today, 'day')) {
        totalTodaysBotTime += parseInt(bot.dynamicData[0].todaysBotTime || '0');
      }

      // Always add to week's time for bots created this week
      totalCurrentWeekTime += parseInt(bot.dynamicData[0].currentWeekTime || '0');
    });

    ws.send(JSON.stringify({
      type: 'allBotsTime',
      totalTodaysBotTime: totalTodaysBotTime.toString(),
      totalCurrentWeekTime: totalCurrentWeekTime.toString()
    }));
  } catch (error) {
    console.error('Error sending all bots time:', error);
  }
}

async function updateBotTimes(wss) {
  const now = moment().tz("Asia/Kolkata");
  const today = now.clone().startOf('day');
  const startOfWeek = now.clone().startOf('isoWeek');
  const endOfWeek = startOfWeek.clone().endOf('isoWeek');

  try {
    // Fetch bots created in the current week
    const bots = await AITradingBot.find({
      createdAt: {
        $gte: startOfWeek.toDate()
      }
    });

    for (const bot of bots) {
      if (bot.dynamicData[0].status === 'Running' && isWithinTradingHours()) {
        const workingTime = parseInt(bot.dynamicData[0].workingTime || '0') + 1;
        const botCreatedAt = moment(bot.createdAt).tz("Asia/Kolkata");

        // Update today's time only if bot was created today
        let todaysBotTime = '0';
        if (botCreatedAt.isSame(today, 'day')) {
          todaysBotTime = (parseInt(bot.dynamicData[0].todaysBotTime || '0') + 1).toString();
        }

        // Always update week's time for bots created this week
        let currentWeekTime = (parseInt(bot.dynamicData[0].currentWeekTime || '0') + 1).toString();

        // Reset week's time if we're in a new week
        const lastUpdated = moment(bot.dynamicData[0].lastUpdated).tz("Asia/Kolkata");
        if (lastUpdated.isBefore(startOfWeek)) {
          currentWeekTime = '1'; // Start from 1 since we're updating now
        }

        bot.dynamicData[0].workingTime = workingTime.toString();
        bot.dynamicData[0].todaysBotTime = todaysBotTime;
        bot.dynamicData[0].currentWeekTime = currentWeekTime;
        bot.dynamicData[0].lastUpdated = now.toDate();
        await bot.save();

        wss.clients.forEach((client) => {
          if (client.botId === bot._id.toString()) {
            sendBotTime(client);
          }
          if (client.userId === bot.userId.toString()) {
            sendAllBotsTime(client);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error updating bot times:', error);
  }
}