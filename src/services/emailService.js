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

export const sendPasswordResetEmail = async (email, resetURL) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    text: `Please use the following link to reset your password: ${resetURL}. This link will expire in 1 hour.`,
    html: `<p>Please use the following link to reset your password: <a href="${resetURL}">${resetURL}</a>. This link will expire in 1 hour.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
