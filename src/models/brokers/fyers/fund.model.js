import mongoose from 'mongoose';

const { Schema } = mongoose;

// Define the schema for fund limit details
const fundLimitSchema = new Schema({
    id: {
        type: Number,
        required: true,
        // unique: true
    },
    title: {
        type: String,
        required: true
    },
    equityAmount: {
        type: Number,
        required: true
    },
    commodityAmount: {
        type: Number,
        required: true
    }
});

// Define the schema for funds data
const FundSchema = new Schema({
    fund_limit: [fundLimitSchema] // Array of fund limit details
}, { timestamps: true }); // No _id for embedded documents

export default FundSchema;
