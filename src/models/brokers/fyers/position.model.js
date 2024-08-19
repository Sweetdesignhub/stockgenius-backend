import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the schema for net position details
const netPositionSchema = new Schema({
    netQty: { type: Number, required: true },
  qty: { type: Number, required: true },
  avgPrice: { type: Number, required: true },
  netAvg: { type: Number, required: true },
  side: { type: Number, required: true }, // e.g., 1 for buy, -1 for sell
  productType: { type: String, required: true },
  realized_profit: { type: Number, required: true },
  unrealized_profit: { type: Number, required: true },
  pl: { type: Number, required: true },
  ltp: { type: Number, required: true }, // Last traded price
  buyQty: { type: Number, required: true },
  buyAvg: { type: Number, required: true },
  buyVal: { type: Number, required: true },
  sellQty: { type: Number, required: true },
  sellAvg: { type: Number, required: true },
  sellVal: { type: Number, required: true },
  slNo: { type: Number, required: true },
  fyToken: { type: String, required: true },
  crossCurrency: { type: String, required: true },
  rbiRefRate: { type: Number, required: true },
  qtyMulti_com: { type: Number, required: true },
  segment: { type: Number, required: true },
  symbol: { type: String, required: true },
  id: { type: String, required: true }, 
  cfBuyQty: { type: Number, default: 0 },
  cfSellQty: { type: Number, default: 0 },
  dayBuyQty: { type: Number, default: 0 },
  daySellQty: { type: Number, default: 0 },
  exchange: { type: Number, required: true },
});

// Define the schema for positions data
const PositionSchema = new Schema({
  netPositions: [netPositionSchema],
  overall: {
    count_total: Number,
    count_open: Number,
    pl_total: Number,
    pl_realized: Number,
    pl_unrealized: Number,
  }
},{ timestamps: true });

export default PositionSchema;
