import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    placedBy: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    exchangeOrderId: { type: String },
    parentOrderId: { type: String },
    status: { type: String, required: true },
    statusMessage: { type: String },
    orderTimestamp: { type: Date, required: true },
    variety: { type: String, required: true },
    exchange: { type: String, required: true },
    tradingSymbol: { type: String, required: true },
    instrumentToken: { type: Number, required: true },
    orderType: { type: String, required: true },
    transactionType: { type: String, required: true },
    validity: { type: String, required: true },
    product: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number },
    triggerPrice: { type: Number },
    averagePrice: { type: Number },
    filledQuantity: { type: Number },
    pendingQuantity: { type: Number },
    cancelledQuantity: { type: Number }
  },
  { timestamps: true }
);

export default orderSchema;
