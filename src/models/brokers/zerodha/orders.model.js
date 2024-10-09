import mongoose from 'mongoose';


const orderSchema = new mongoose.Schema(
  {
    account_id: { type: String, required: true },
    placed_by: { type: String, required: true },
    order_id: { type: String, required: true},
    exchange_order_id: { type: String },
    parent_order_id: { type: String },
    status: { type: String, required: true },
    status_message: { type: String },
    status_message_raw: { type: String },
    order_timestamp: { type: Date, required: true },
    exchange_update_timestamp: { type: String },
    exchange_timestamp: { type: Date },
    variety: { type: String, required: true },
    modified: { type: Boolean, default: false },
    exchange: { type: String, required: true },
    tradingsymbol: { type: String, required: true },
    instrument_token: { type: Number, required: true },
    order_type: { type: String, required: true },
    transaction_type: { type: String, required: true },
    validity: { type: String, required: true },
    validity_ttl: { type: Number },
    product: { type: String, required: true },
    quantity: { type: Number, required: true },
    disclosed_quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    trigger_price: { type: Number, default: 0 },
    average_price: { type: Number },
    filled_quantity: { type: Number },
    pending_quantity: { type: Number },
    cancelled_quantity: { type: Number },
    market_protection: { type: Number, default: 0 },
    meta: { type: Object, default: {} },
    tag: { type: String },
    tags: [{ type: String }],
    guid: { type: String },
  },
  { timestamps: true }
);

export default orderSchema;
