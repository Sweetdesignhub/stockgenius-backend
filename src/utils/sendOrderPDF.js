import { parse } from 'json2csv';
import { createPDF } from './createPDF.js';
import FyersUserDetail from '../models/brokers/fyers/fyersUserDetail.model.js';
import { fetchOrders } from '../controllers/brokers/fyers/fyers.controller.js';

export async function sendOrderPDF() {
  const trades = await fetchOrders();

  const fields = [
    'clientId',
    'side',
    'description',
    'symbol',
    'id',
    'qty',
    'orderDateTime',
    'limitPrice',
    'tradeValue',
  ];
  const opts = { fields };

  const data = trades.tradeBook.map((item, index) => ({
    SrNo: index + 1,
    TMName: 'stockgenius',
    clientId: item.clientId,
    BuySell: item.side === 1 ? 'Buy' : 'Sell',
    NameOfSecurity: item.description,
    Symbol: item.symbol,
    Series: 'EQ',
    Id: item.id,
    Qty: item.qty,
    TradeTime: new Date(item.orderDateTime).toLocaleString(),
    LimitPrice: item.limitPrice,
    TradedValue: item.tradeValue,
  }));

  const csv = parse(data, opts);

  await createPDF(csv);
}
