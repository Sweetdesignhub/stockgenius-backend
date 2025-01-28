import { ConversationPage } from "twilio/lib/rest/conversations/v1/conversation.js";
import User from "../models/user.js";
import {
  sendEmailOTP,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../services/emailService.js";
import { generateOTP, isOTPValid } from "../services/otpService.js";
import { sendPhoneOTP } from "../services/phoneService.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
  verifyToken,
} from "../services/tokenService.js";
import { errorHandler } from "../utils/errorHandler.js";
import {
  isStrongPassword,
  isValidEmail,
  isValidPhoneNumber,
} from "../utils/validators.js";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import Bot from "../models/autoTradeBot/bot.model.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// console.log("google : ", process.env.GOOGLE_CLIENT_ID);

export const signup = async (req, res, next) => {
  const { email, name, password, phoneNumber, country, state } = req.body;
  // console.log(email);

  if (!isValidEmail(email)) {
    return next(errorHandler(400, "Invalid email"));
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return next(errorHandler(400, "Invalid phone number"));
  }

  if (!isStrongPassword(password)) {
    return next(errorHandler(400, "Password not strong enough"));
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNumber }],
  });

  // console.log(existingUser);

  if (existingUser) {
    if (existingUser.email === email) {
      return next(errorHandler(400, "Email already in use"));
    }
    if (existingUser.phoneNumber === phoneNumber) {
      return next(errorHandler(400, "Phone number already in use"));
    }
  }

  const emailOTP = generateOTP();
  const phoneOTP = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = new User({
    email,
    name,
    password,
    phoneNumber,
    country,
    state,
    emailOTP,
    phoneOTP,
    otpExpiry,
  });

  await user.save();

  // Create a default papertrade bot for the user
  const defaultBot = new Bot({
    userId: user._id,
    name: "Default PaperTradeBot", // Corrected field
    profitPercentage: "5", // Profit Percentage as a string
    riskPercentage: "2", // Risk Percentage as a string
    productType: "CNC",
    isDefault: true,
    broker: "PaperTrading",
    dynamicData: [
      {
        tradeRatio: 50,
        profitGained: 0,
        workingTime: "0",
        todaysBotTime: "0",
        currentWeekTime: "0",
        totalBalance: 0,
        status: "Inactive",
        limits: 0,
      },
    ],
  });

  await defaultBot.save();

  await sendEmailOTP(email, emailOTP, name);
  await sendPhoneOTP(phoneNumber, phoneOTP, name);

  res
    .status(201)
    .json({ message: "User created. Please verify your email and phone." });
};

export const googleAuth = async (req, res, next) => {
  const { token, country, state } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // console.log("google : ", process.env.GOOGLE_CLIENT_ID);

    const payload = ticket.getPayload();
    // console.log(payload);
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const uniquePhonePlaceholder = `pending_${uuidv4()}`;

      user = new User({
        email,
        name,
        avatar: picture,
        isEmailVerified: true,
        isPhoneVerified: false,
        password: randomPassword,
        phoneNumber: uniquePhonePlaceholder,
        country: country || "Pending",
        state: state || "Pending",
      });

      try {
        await user.save();

        // Create a default papertrade bot for the new user
        const defaultBot = new Bot({
          userId: user._id,
          name: "Default PaperTradeBot", // Corrected field
          profitPercentage: "5", // Profit Percentage as a string
          riskPercentage: "2", // Risk Percentage as a string
          productType: "CNC",
          isDefault: true,
          broker: "PaperTrading",
          dynamicData: [
            {
              tradeRatio: 50,
              profitGained: 0,
              workingTime: "0",
              todaysBotTime: "0",
              currentWeekTime: "0",
              totalBalance: 0,
              status: "Inactive",
              limits: 0,
            },
          ],
        });

        await defaultBot.save();
      } catch (saveError) {
        console.error("Error saving new user:", saveError);
        return next(
          errorHandler(400, "Error creating new user: " + saveError.message)
        );
      }
    }

    if (!user.isPhoneVerified || user.phoneNumber.startsWith("pending_")) {
      return res.status(200).json({
        message: "Additional information required",
        userId: user._id,
        requiresAdditionalInfo: true,
      });
    }

    // User is fully verified, proceed with login
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.setHeader("Set-Cookie", [accessToken, refreshToken]);
    res.json({ data: user, message: "Google authentication successful" });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return next(
      errorHandler(401, "Error during Google authentication: " + error.message)
    );
  }
};

export const googleUpdateUser = async (req, res, next) => {
  // console.log(req.body);
  try {
    const phoneOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, // This should be the ID from the URL parameters
      {
        $set: {
          phoneNumber: req.body.phoneNumber,
          state: req.body.state,
          country: req.body.country,
          phoneOTP: phoneOTP,
          otpExpiry: otpExpiry,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }
    await sendPhoneOTP(req.body.phoneNumber, phoneOTP);
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(errorHandler(404, "User not found"));
  }

  if (user.isEmailVerified) {
    return next(errorHandler(400, "Email already verified"));
  }

  if (!isOTPValid(user.emailOTP, otp, user.otpExpiry)) {
    return next(errorHandler(400, "Invalid or expired OTP"));
  }

  user.isEmailVerified = true;
  user.emailOTP = undefined;
  await user.save();

  res.json({ message: "Email verified successfully" });
};

export const verifyPhone = async (req, res, next) => {
  const { phoneNumber, otp } = req.body;
  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return next(errorHandler(404, "User not found"));
  }

  if (user.isPhoneVerified) {
    return next(errorHandler(400, "Phone number already verified"));
  }

  if (!isOTPValid(user.phoneOTP, otp, user.otpExpiry)) {
    return next(errorHandler(400, "Invalid or expired OTP"));
  }

  user.isPhoneVerified = true;
  user.phoneOTP = undefined;
  user.otpExpiry = undefined;
  await user.save();

  await sendWelcomeEmail(user);

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.setHeader("Set-Cookie", [accessToken, refreshToken]);
  res.json({ message: "Phone number verified successfully" });
};

export const resendEmailOTP = async (req, res, next) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return next(errorHandler(400, "Invalid email address"));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(errorHandler(404, "User not found"));
  }

  if (user.isEmailVerified) {
    return next(errorHandler(400, "Email already verified"));
  }

  // Generate new OTP
  const newOTP = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update user document
  user.emailOTP = newOTP;
  user.otpExpiry = otpExpiry;
  await user.save();

  // Send new OTP via email
  try {
    await sendEmailOTP(email, newOTP, user.name);
    res.status(200).json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email OTP:", error);
    return next(errorHandler(500, "Error sending email OTP"));
  }
};

export const resendPhoneOTP = async (req, res, next) => {
  const { phoneNumber } = req.body;

  if (!isValidPhoneNumber(phoneNumber)) {
    return next(errorHandler(400, "Invalid phone number"));
  }

  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return next(errorHandler(404, "User not found"));
  }

  if (user.isPhoneVerified) {
    return next(errorHandler(400, "Phone number already verified"));
  }

  // Generate new OTP
  const newOTP = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update user document
  user.phoneOTP = newOTP;
  user.otpExpiry = otpExpiry;
  await user.save();

  // Send new OTP via SMS
  try {
    await sendPhoneOTP(phoneNumber, newOTP, user.name);
    res.status(200).json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error("Error sending phone OTP:", error);
    return next(errorHandler(500, "Error sending phone OTP"));
  }
};

export const login = async (req, res, next) => {
  const { identifier, password, useOTP } = req.body;

  // Check if the identifier is an email or phone number
  const isEmail = isValidEmail(identifier);
  const isPhone = isValidPhoneNumber(identifier);

  if (!isEmail && !isPhone) {
    return next(errorHandler(400, "Invalid email or phone number"));
  }

  const user = await User.findOne(
    isEmail ? { email: identifier } : { phoneNumber: identifier }
  );

  if (!user) {
    return next(errorHandler(401, "User not found"));
  }

  if (!user.isEmailVerified || !user.isPhoneVerified) {
    return next(errorHandler(403, "Account not fully verified"));
  }

  if (useOTP) {
    // Generate and send OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.loginOTP = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const name = user.name.split(" ")[0];

    if (isEmail) {
      await sendEmailOTP(identifier, otp, name);
    } else {
      await sendPhoneOTP(identifier, otp, name);
    }

    return res.json({ message: "OTP sent for login verification" });
  } else {
    // Password-based login
    if (!password) {
      return next(errorHandler(400, "Password is required"));
    }

    if (!(await user.comparePassword(password))) {
      return next(errorHandler(401, "Invalid credentials"));
    }

    const accessToken = generateAccessToken(user);
    // console.log(accessToken);

    const refreshToken = await generateRefreshToken(user);
    // console.log(refreshToken);

    res.setHeader("Set-Cookie", [accessToken, refreshToken]);
    res.json({ data: user, message: "Login successful" });
  }
};

// New function to verify OTP for login
export const verifyLoginOTP = async (req, res, next) => {
  const { identifier, otp } = req.body;

  const isEmail = isValidEmail(identifier);
  const user = await User.findOne(
    isEmail ? { email: identifier } : { phoneNumber: identifier }
  );

  if (!user) {
    return next(errorHandler(404, "User not found"));
  }

  if (!isOTPValid(user.loginOTP, otp, user.otpExpiry)) {
    return next(errorHandler(400, "Invalid or expired OTP"));
  }

  // Clear the OTP fields
  user.loginOTP = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user);

  res.setHeader("Set-Cookie", [accessToken, refreshToken]);
  res.json({ data: user, message: "Login successful" });
};

export const refreshToken = async (req, res, next) => {
  const payload = await verifyRefreshToken(req);
  if (!payload) {
    return next(errorHandler(401, "Invalid refresh token"));
  }

  const user = await User.findById(payload.userId);
  const accessToken = generateAccessToken(user);
  const newRefreshToken = await generateRefreshToken(user);

  res.setHeader("Set-Cookie", [accessToken, newRefreshToken]);
  res.json({ message: "Access token refreshed" });
};

// Request password reset
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return next(errorHandler(400, "Invalid email address"));
  }

  const user = await User.findOne({ email });
  if (!user) {
    // We don't want to reveal whether a user exists or not
    return res.status(200).json({
      message:
        "If a user with that email exists, a password reset link has been sent.",
    });
  }

  const resetToken = generateToken(user._id, "1h");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail(user.email, resetURL);
    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return next(errorHandler(500, "Error sending password reset email"));
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(errorHandler(400, "Missing required fields"));
  }

  if (!isStrongPassword(newPassword)) {
    return next(errorHandler(400, "Password not strong enough"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(errorHandler(400, "Invalid or expired token"));
  }

  const user = await User.findOne({
    _id: decoded.userId,
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(errorHandler(400, "Invalid or expired token"));
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "Password has been reset successfully" });
};

// Validate reset token
export const validateResetToken = async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(errorHandler(400, "Token is required"));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(errorHandler(400, "Invalid or expired token"));
  }

  const user = await User.findOne({
    _id: decoded.userId,
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(errorHandler(400, "Invalid or expired token"));
  }

  res.status(200).json({ message: "Token is valid" });
};

export const logout = async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    // Find the user with this refresh token and remove it
    await User.findOneAndUpdate(
      { refreshToken },
      { $unset: { refreshToken: 1 } }
    );
  }

  // Clear the cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({ message: "Logged out successfully" });
};
