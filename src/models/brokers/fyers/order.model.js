import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the schema for an individual order
const orderLimitSchema = new Schema({
    clientId: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true,
        // unique: true
    },
    exchOrdId: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true
    },
    remainingQuantity: {
        type: Number,
        required: true
    },
    filledQty: {
        type: Number,
        required: true
    },
    discloseQty: {
        type: Number,
        required: true
    },
    limitPrice: {
        type: Number,
        required: true
    },
    stopPrice: {
        type: Number,
        required: true
    },
    tradedPrice: {
        type: Number,
        required: true
    },
    type: {
        type: Number,
        required: true
    },
    fyToken: {
        type: String,
        required: true
    },
    exchange: {
        type: Number,
        required: true
    },
    segment: {
        type: Number,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    instrument: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        default: ''
    },
    offlineOrder: {
        type: Boolean,
        required: true
    },
    orderDateTime: {
        type: String,
        required: true
    },
    orderValidity: {
        type: String,
        required: true
    },
    pan: {
        type: String,
        default: ''
    },
    productType: {
        type: String,
        required: true
    },
    side: {
        type: Number,
        required: true
    },
    status: {
        type: Number,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    ex_sym: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    ch: {
        type: Number,
        required: true
    },
    chp: {
        type: Number,
        required: true
    },
    lp: {
        type: Number,
        required: true
    },
    slNo: {
        type: Number,
        required: true
    },
    dqQtyRem: {
        type: Number,
        required: true
    },
    orderNumStatus: {
        type: String,
        required: true
    },
    disclosedQty: {
        type: Number,
        required: true
    },
    orderTag: {
        type: String,
        required: true
    }
});

// Define the schema for order data
const OrderSchema = new Schema({
    orderBook: [orderLimitSchema]
},{ timestamps: true });

export default  OrderSchema;
