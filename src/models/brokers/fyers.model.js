import mongoose from "mongoose";

const FyersCredentialsSchema = new mongoose.Schema({
  broker: { type: String, default: "Fyers" },
  nickname: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  fyersId: { type: String, required: true, unique: true },
  appId: { type: String, required: true, unique: true },
  secretId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authCodeURL: { type: String },
  authDate: { type: Date },
  accessToken: { type: String },
  refreshToken: { type: String },
});

export default mongoose.model("FyersCredentials", FyersCredentialsSchema);
