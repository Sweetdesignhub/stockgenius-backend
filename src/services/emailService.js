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

const sendEmail = async (options) => {
  try {
    const info = await transporter.sendMail(options);
    return info;
  } catch (error) {
    throw new Error('Failed to send email');
  }
};

export const sendEmailOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your OTP for Email Verification',
    text: `Your OTP for AI StockScope is ${otp}. It will expire in 10 minutes.`,
    html: `<p>Your OTP for AI StockScope is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`,
  };

  await sendEmail(mailOptions);
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset Request',
    text: `Please use the following link to reset your password: ${resetURL}. This link will expire in 1 hour.`,
    html: `
      <h1>Password Reset Request</h1>
      <p>Please use the following link to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await sendEmail(mailOptions);
};

export const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Welcome to AI StockScope!',
    text: `
      Dear ${user.name},

      Welcome to AI StockScope! We're thrilled to have you on board.

      Your account has been successfully created and you're now part of our community of savvy investors leveraging AI for smarter stock market decisions.

      Here's what you can do next:
      1. Explore our AI-powered stock analysis tools
      2. Set up your first watchlist
      3. Try our bot for AutoTrading

      If you have any questions or need assistance, our support team is always here to help.

      Best regards,
      The AI StockScope Team
    `,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AI StockScope</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #0066cc; }
          .cta-button { display: inline-block; padding: 10px 20px; background-color: #0066cc; color: #ffffff; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to AI StockScope!</h1>
          <p>Dear ${user.name},</p>
          <p>We're thrilled to have you on board. Your account has been successfully created and you're now part of our community of savvy investors leveraging AI for smarter stock market decisions.</p>
          <h2>Here's what you can do next:</h2>
          <ol>
          <li>Explore our AI-powered stock analysis tools</li>
          <li>Set up your first watchlist</li>
          <li>Try our bot for AutoTrading</li>
          </ol>
          <p>
            <a href="${process.env.APP_URL}/dashboard" class="cta-button">Go to Dashboard</a>
          </p>
          <p>If you have any questions or need assistance, our support team is always here to help.</p>
          <p>
            Best regards,<br>
            The AI StockScope Team
          </p>
        </div>
      </body>
      </html>
    `,
  };

  await sendEmail(mailOptions);
};
