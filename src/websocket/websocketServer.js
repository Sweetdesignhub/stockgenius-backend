import WebSocket from 'ws';
import moment from 'moment-timezone';
import AITradingBot from '../models/aiTradingBot.model.js';
import { isWithinTradingHours } from '../utils/helper.js';

export function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      if (data.type === 'subscribeBotTime') {
        ws.botId = data.botId;
        sendBotTime(ws);
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
    const bots = await AITradingBot.find({ userId: ws.userId });
    let totalTodaysBotTime = 0;
    let totalCurrentWeekTime = 0;

    const now = moment().tz("Asia/Kolkata");
    const startOfDay = now.clone().startOf('day');
    const startOfWeek = now.clone().startOf('isoWeek');

    bots.forEach(bot => {
      const botLastUpdated = moment(bot.dynamicData[0].lastUpdated).tz("Asia/Kolkata");

      if (botLastUpdated.isSameOrAfter(startOfDay)) {
        totalTodaysBotTime += parseInt(bot.dynamicData[0].todaysBotTime || '0');
      }

      if (botLastUpdated.isSameOrAfter(startOfWeek)) {
        totalCurrentWeekTime += parseInt(bot.dynamicData[0].currentWeekTime || '0');
      }
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
  const startOfDay = now.clone().startOf('day');
  const startOfWeek = now.clone().startOf('isoWeek');

  try {
    const bots = await AITradingBot.find();

    for (const bot of bots) {
      // Daily reset logic
      if (now.isSame(startOfDay, 'second')) {
        bot.dynamicData[0].todaysBotTime = '0';
      }

      // Weekly reset logic
      if (now.isSame(startOfWeek, 'second')) {
        bot.dynamicData[0].currentWeekTime = '0';
      }

      // If the bot is running and within trading hours, update time
      if (bot.dynamicData[0].status === 'Running' && isWithinTradingHours()) {
        const workingTime = parseInt(bot.dynamicData[0].workingTime || '0') + 1;
        let todaysBotTime = parseInt(bot.dynamicData[0].todaysBotTime || '0') + 1;
        let currentWeekTime = parseInt(bot.dynamicData[0].currentWeekTime || '0') + 1;

        bot.dynamicData[0].workingTime = workingTime.toString();
        bot.dynamicData[0].todaysBotTime = todaysBotTime.toString();
        bot.dynamicData[0].currentWeekTime = currentWeekTime.toString();
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