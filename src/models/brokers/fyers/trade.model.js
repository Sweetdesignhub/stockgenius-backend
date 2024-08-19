import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the schema for net position details
const netTradeSchema = new Schema({
    clientId: { type: String, required: true },
    orderDateTime: { type: String, required: true },
    orderNumber: { type: String, required: true },
    exchangeOrderNo: { type: String, required: true },
    exchange: { type: Number, required: true },
    side: { type: Number, required: true },
    segment: { type: Number, required: true },
    orderType: { type: Number, required: true },
    fyToken: { type: String, required: true },
    productType: { type: String, required: true },
    tradedQty: { type: Number, required: true },
    tradePrice: { type: Number, required: true },
    tradeValue: { type: Number, required: true },
    tradeNumber: { type: String, required: true },
    row: { type: Number, required: true },
    symbol: { type: String, required: true },
    orderTag: { type: String, required: true }
});

// Define the schema for positions data
const TradeSchema = new Schema({
  tradeBook: [netTradeSchema],
},{ timestamps: true });

export default TradeSchema;
