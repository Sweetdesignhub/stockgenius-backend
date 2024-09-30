import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendPhoneOTP = async (phoneNumber, otp, name) => {
  await client.messages.create({
    body: `Dear ${name}, your OTP is ${otp}. It will expire in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
};
