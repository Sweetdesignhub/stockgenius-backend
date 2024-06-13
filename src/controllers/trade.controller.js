import User from '../models/user.model.js';
import { fyersModel } from 'fyers-api-v3';

export const placeTrade = async (req, res) => {
  try {
    const { symbol, quantity, price, order_type, transaction_type } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !user.fyersToken) return res.status(401).json({ error: 'User not authenticated with FYERS' });

    const fyers = new fyersModel({ token: user.fyersToken });
    const tradeResponse = await fyers.placeOrder({
      symbol,
      qty: quantity,
      type: order_type,
      side: transaction_type,
      productType: 'INTRADAY',
      limitPrice: price,
      stopPrice: 0,
      validity: 'DAY',
      disclosedQty: 0,
      offlineOrder: 'False',
      stopLoss: 0,
      takeProfit: 0,
    });

    res.status(201).json({ message: 'Trade placed successfully', tradeResponse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to place trade' });
  }
};
