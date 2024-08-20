import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmailOTP = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your OTP for Email Verification',
    text: `Your OTP for AI StockScope is ${otp}. It will expire in 10 minutes.`,
  });
};
