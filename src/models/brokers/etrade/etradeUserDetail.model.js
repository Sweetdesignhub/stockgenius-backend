import mongoose from "mongoose";

const eTradeUserDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  accessToken: { type: String, required: true },
  accessTokenSecret: { type: String, required: true },
  accountDetails: { type: Object },
  authDate: { type: Date, default: Date.now },
});

export default mongoose.model("ETradeUserDetail", eTradeUserDetailSchema);
