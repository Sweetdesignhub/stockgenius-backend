import mongoose from 'mongoose';

const { Schema } = mongoose;

// schema for individual holding details
const holdingSchema = new Schema({
    costPrice: {
        type: Number,
        required: true
    },
    id: {
        type: Number,
        required: true,
        // unique: true
    },
    fyToken: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    isin: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
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
    qty_t1: {
        type: Number,
        required: true
    },
    remainingQuantity: {
        type: Number,
        required: true
    },
    collateralQuantity: {
        type: Number,
        required: true
    },
    remainingPledgeQuantity: {
        type: Number,
        required: true
    },
    pl: {
        type: Number,
        required: true
    },
    ltp: {
        type: Number,
        required: true
    },
    marketVal: {
        type: Number,
        required: true
    },
    holdingType: {
        type: String,
        required: true
    }
});

//  schema for overall holdings data
const overallSchema = new Schema({
    count_total: {
        type: Number,
        required: true
    },
    pnl_perc: {
        type: Number,
        required: true
    },
    total_current_value: {
        type: Number,
        required: true
    },
    total_investment: {
        type: Number,
        required: true
    },
    total_pl: {
        type: Number,
        required: true
    }
});

// Define the schema for holdings data
const HoldingsSchema = new Schema({
    overall: overallSchema,
    holdings: [holdingSchema] // Array of holding details
}, { timestamps: true }); 

export default HoldingsSchema;
