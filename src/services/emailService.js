import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: "itnanda1987@gmail.com",
//     pass: "jdlt yozr luhj qqzo",
//   },
// });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const transporter = nodemailer.createTransport({
  name: "hostgator",
  host: "gator2101.hostgator.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: "info@stockgenius.ai",
    pass: "Stockgeniusai@2024@",
  },
  logger: true, // Enable logging
  // debug: true, // Include debug information in the logs
});

const sendEmail = async (options) => {
  try {
    const info = await transporter.sendMail(options);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);

    throw new Error("Failed to send email");
  }
};

export const sendEmailOTP = async (email, otp, name) => {
  const imagePath = path.join(__dirname, "../images/emailOtp.png");

  const mailOptions = {
    from: "info@stockgenius.ai",
    to: email,
    subject: "Your Stock Genius.AI Verification Code",
    text: `Dear ${name},

To keep your account safe and secure, please use the One-Time Password (OTP) below to complete your verification.

Your OTP is: ${otp}

This code is valid for the next 10 minutes. Please do not share this code with anyone.

If you didn’t request this OTP, please contact our support team immediately!

------------------------------

Need help?
Contact us at info@stockgenius.ai for assistance or visit our support page.

Thank you for choosing Stock Genius.AI!
We’re committed to keeping your account secure.

Warm regards,
The Stock Genius.AI Team`,
    html: `
      <div style="text-align: center;">
        <img src="cid:stockGeniusLogo" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
      <p>Dear ${name},</p>
      <p>To keep your account safe and secure, please use the One-Time Password (OTP) below to complete your verification.</p>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This code is valid for the next 10 minutes. Please do not share this code with anyone.</p>
      <p>If you didn’t request this OTP, please contact our support team immediately!</p>
      <hr />
      <p>Need help?</p>
      <p>Contact us at <a href="mailto:info@stockgenius.ai">info@stockgenius.ai</a> for assistance or visit <a href="https://stockgenius.ai/">our support page</a>.</p>
      <p>Thank you for choosing Stock Genius.AI!<br />
      We’re committed to keeping your account secure.</p>
      <p>Warm regards,<br />The Stock Genius.AI Team</p>
    `,
    attachments: [
      {
        filename: "emailOtp.png",
        path: imagePath,
        cid: "stockGeniusLogo",
      },
    ],
  };

  await sendEmail(mailOptions);
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const imagePath = path.join(__dirname, "../images/emailOtp.png");

  const mailOptions = {
    from: "info@stockgenius.ai",
    to: email,
    subject: "Password Reset Request",
    text: `Please use the following link to reset your password: ${resetURL}. This link will expire in 1 hour.`,
    html: `
      <div style="text-align: center;">
        <img src="cid:stockGeniusLogo" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
      <p>Please use the following link to reset your password:</p>
      <a href="${resetURL}">${resetURL}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn’t request this password reset, please contact our support team immediately.</p>
      <hr />
      <p>Need help?</p>
      <p>Contact us at <a href="mailto:info@stockgenius.ai">info@stockgenius.ai</a> for assistance or visit <a href="https://stockgenius.ai/">our support page</a>.</p>
      <p>Thank you for choosing Stock Genius.AI!<br />
      We’re committed to keeping your account secure.</p>
      <p>Warm regards,<br />The Stock Genius.AI Team</p>
    `,
    attachments: [
      {
        filename: "emailOtp.png",
        path: imagePath,
        cid: "stockGeniusLogo",
      },
    ],
  };

  await sendEmail(mailOptions);
};

export const sendWelcomeEmail = async (user) => {
  const imagePath = path.join(__dirname, "../images/welcome.png");
  const mailOptions = {
    from: "info@stockgenius.ai",
    to: user.email,
    subject: "🎉 Welcome to Stock Genius.AI – Let’s Get Started!",
    text: `
      Dear ${user.name.split(" ")[0]},

      Welcome to the Stock Genius.AI family! We’re thrilled to have you on board and excited to help you navigate the world of stocks with AI-powered insights that put you ahead of the market. 🚀

      Here’s What You Can Expect:
      - Tailored Stock Predictions: Our cutting-edge AI engine analyzes the market 24/7 to provide you with personalized stock insights and predictions, helping you make smarter investment decisions.
      - Real-Time Market Alerts: Get updates on market movements, including Top Gainers and Losers, so you can stay ahead of the curve.
      - Customized Portfolio Management: Whether you're a seasoned investor or just starting, our tools make it easy to track and optimize your portfolio.

      Ready to Dive In? Here’s How to Get Started:
      - Login to Your Dashboard: [Link to Dashboard]
      - Set Up Your Alerts: [Link to Alerts Setup]
      - Explore AI Predictions: [Link to AI Insights]

      Need Assistance?
      We’re here to help! If you have any questions, feel free to reach out to our support team at [Support Email] or visit [Support Page].

      Pro Tip 💡
      Make the most of your experience by setting up alerts for Top Gainers and following AI-driven stock trends to optimize your portfolio right from the start!

      We’re excited to be part of your investment journey, and we can’t wait to help you reach new financial heights with Stock Genius.AI.

      Thank you for choosing us, and here’s to your success! 🎉

      Best regards,
      The Stock Genius.AI Team
    `,
    html: `
    <div style="text-align: center;">
        <img src="cid:welcomeImage" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
      <div class="container">
        <p>Dear ${user.name.split(" ")[0]},</p>
        <p>We’re thrilled to have you on board and excited to help you navigate the world of stocks with AI-powered insights that put you ahead of the market. 🚀</p>
        <hr/>
        <h2>Here’s What You Can Expect:</h2>
        <ul>
          <li><strong>Tailored Stock Predictions:</strong> Our cutting-edge AI engine analyzes the market 24/7 to provide you with personalized stock insights and predictions, helping you make smarter investment decisions.</li>
          <li><strong>Real-Time Market Alerts:</strong> Get updates on market movements, including Top Gainers and Losers, so you can stay ahead of the curve.</li>
          <li><strong>Customized Portfolio Management:</strong> Whether you're a seasoned investor or just starting, our tools make it easy to track and optimize your portfolio.</li>
        </ul>
        <hr/>
        <h2>Ready to Dive In? Here’s How to Get Started:</h2>
        <ul>
          <li>Login to Your Dashboard: <a href="https://stockgenius.ai/">Go to Dashboard</a></li>
          <li>Set Up Your Alerts: <a href="https://stockgenius.ai/">Link to Alerts Setup</a></li>
          <li>Explore AI Predictions: <a href="https://stockgenius.ai/ai-predictions">Link to AI Insights</a></li>
        </ul>
        <hr/>
        <p>Need Assistance?</p>
        <p>We’re here to help! If you have any questions, feel free to reach out to our support team at <a href="mailto:info@stockgenius.ai">info@stockgenius.ai</a> or visit <a href="https://stockgenius.ai">Support Page</a>.</p>
        <p><strong>Pro Tip 💡</strong> Make the most of your experience by setting up alerts for Top Gainers and following AI-driven stock trends to optimize your portfolio right from the start!</p>
        <p>We’re excited to be part of your investment journey, and we can’t wait to help you reach new financial heights with Stock Genius.AI.</p>
        <p>Thank you for choosing us, and here’s to your success! 🎉</p>
        <p>Best regards,<br>The Stock Genius.AI Team</p>
      </div>
    `,
    attachments: [
      {
        filename: 'welcome.png',
        path: imagePath,
        cid: 'welcomeImage'
      }
    ]
  };

  await sendEmail(mailOptions);
};

//4pm email shifted to 3:20pmist
export const sendDailyTradesReport = async (
  filePath,
  recipientEmail,
  userName,
  marketPerformance = "Good",
  importantLinks = [
    "https://stockgenius.ai/india/portfolio",
    "https://stockgenius.ai/india/dashboard",
    "https://stockgenius.ai/india/NSE100-ai-insights",
  ]
) => {
  const imagePath = path.join(__dirname, "../images/dailyReport.png");

  const mailOptions = {
    from: "info@stockgenius.ai",
    to: recipientEmail,
    subject:
      "Your Daily Stock Summary – A Winning (or Challenging) Day in the Market!",
    text: `Dear ${userName},\n\nToday’s Market Performance: ${marketPerformance}\n\nWe’re here with your daily stock summary brought to you by Stock Genius.AI! 📊✨\n\n📎 Attached: Your full detailed stock report for today, including AI insights, charts, and projections for tomorrow.\n\n🔗 Important Links:\n${importantLinks.join(
      "\n"
    )}\n\nWarm regards,\nThe Stock Genius.AI Team`,
    html: `
      <div style="text-align: center;">
        <img src="cid:stockGeniusLogo" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
      <div style="text-align: left;">
        <p>Dear ${userName},</p>
        <p>Today’s Market Performance: <strong>${marketPerformance}</strong></p>
        <p>We’re here with your daily stock summary brought to you by Stock Genius.AI! 📊✨</p>
        <hr />
        <p>📎 Attached: Your full detailed stock report for today, including AI insights, charts, and projections for tomorrow.</p>
        <p>🔗 Important Links:</p>
        <ul>
          ${importantLinks
        .map((link) => `<li><a href="${link}">${link}</a></li>`)
        .join("")}
        </ul>
        <hr />
        <p>Our Mission<br />Whether it’s a day filled with wins or lessons, we’re committed to helping you make the smartest decisions with the power of AI-driven insights. Thanks for trusting Stock Genius.AI to guide your stock journey.</p>
        <p>Feel free to reach out with any questions, or explore the full report. We’re always here to help!</p>
        <p>Warm regards,<br />The Stock Genius.AI Team</p>
      </div>
    `,
    attachments: [
      {
        filename: "order_report.pdf",
        path: filePath,
      },
      {
        filename: "dailyReport.png",
        path: imagePath,
        cid: "stockGeniusLogo",
      },
    ],
  };

  await sendEmail(mailOptions);
};

export const sendNoOrderMessage = async (recipientEmail, userName) => {
  const motivationalQuote =
    "Every setback is a setup for a comeback. Keep pushing forward!";
  const imagePath = path.join(__dirname, "../images/dailyReport.png");

  const mailOptions = {
    from: "info@stockgenius.ai",
    to: recipientEmail,
    subject: "No Orders Placed Today",
    text: `Dear ${userName},\n\nWe wanted to inform you that no orders were placed by your trading bot today due to challenging market conditions.\n\nMotivational Quote: "${motivationalQuote}"\n\nBest regards,\nThe Stock Genius.AI Team`,
    html: `
     <div style="text-align: center;">
        <img src="cid:stockGeniusLogo" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
      <div style="text-align: left;">
        <p>Dear ${userName},</p>
        <p>We wanted to inform you that no orders were placed by your trading bot today due to challenging market conditions.</p>
        <p><strong>Motivational Quote:</strong> "${motivationalQuote}"</p>
        <p>Best regards,<br />The Stock Genius.AI Team</p>
      </div>
    `,
    attachments: [
      {
        filename: "dailyReport.png",
        path: imagePath,
        cid: "stockGeniusLogo",
      },
    ],
  };

  await sendEmail(mailOptions);
};

export const sendDailyTopGainers = async (
  filePath,
  recipientEmail,
  userName,
  stockSuggestionText, // Add this parameter
  importantLinks = [
    "https://stockgenius.ai/india/dashboard",
    "https://stockgenius.ai/india/NSE100-ai-insights",
  ]
) => {
  const imagePath = path.join(__dirname, "../images/topGainers.png");

  const mailOptions = {
    from: "info@stockgenius.ai",
    to: recipientEmail,
    subject:
      "🚀 Top Gainers of the Day! Your AI-Powered Winning Picks Are Here!",
    html: `
    <div style="text-align: center;">
        <img src="cid:stockGeniusLogoGainer" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
       <div>
        <h3>Dear ${userName},</h3>
        <p>Exciting News from Stock Genius.AI!</p>
        <p>We’ve got some incredible updates for you! Our AI predictions have identified today's Top Gainers in the market, and the results are thrilling. 📈💥</p>
        <p>The stocks we're highlighting today have shown significant growth, and you don’t want to miss out! Here’s a quick breakdown of the action:</p>
        <hr/>
        <h4>What Does "Top Gainer" Mean?</h4>
        <p>When a stock is labeled as a Top Gainer, it means the stock has shown a significant increase in value over the trading day. This could be due to various reasons, such as company performance, market trends, or broader economic factors. And the best part? Our AI-powered engine helps you stay on top of these gainers, predicting their potential for future growth. 🔮</p>
        <hr/>
        <h4>AI Predictions: Why You Should Care About These Gainers</h4>
        <p>Our AI engine doesn't just track what's happening now—it predicts what could happen next. By analyzing market trends, company performance, and historical data, we’re able to offer insights on stocks with high growth potential. These Top Gainers are not just today’s winners—they could also be tomorrow’s stars. ⭐</p>
        <hr/>
        <p>📎 Attached: Your full report on today’s Top Gainers, including detailed analysis, charts, and AI insights.</p>
        
        <h4>What’s Next?</h4>
        <p>Want to take action? Here’s what our AI suggests:</p>
        <p>${stockSuggestionText}</p> <!-- Include the dynamic stock suggestions here -->
        
        <h4>🔗 Important Links:</h4>
        <ul>
          ${importantLinks
        .map((link) => `<li><a href="${link}">${link}</a></li>`)
        .join("")}
        </ul>
        <hr/>
        <p>Your Success is Our Mission</p>
        <p>We’re as excited as you are about these market gains! With the power of AI-driven predictions, you’re never in the dark about the best investment opportunities. Stay tuned, because tomorrow could bring even more winners!</p>
        <p>Thank you for being part of Stock Genius.AI, where we help you make smarter investment decisions, every day. 💼📊</p>
        <p>To your success,<br/>The Stock Genius.AI Team</p>
      </div>
    `,
    attachments: [
      {
        filename: "top_gaineres.xlsx",
        path: filePath,
      },
      {
        filename: "topGainers.png",
        path: imagePath,
        cid: "stockGeniusLogoGainer",
      },
    ],
  };

  // // Log the recipient email before sending
  // console.log(`Sending email to: ${recipientEmail}`);
  // console.log(`Sending filepath: ${filePath}`);

  await sendEmail(mailOptions);
};

export const sendDailyTopLosers = async (
  filePath,
  recipientEmail,
  userName,
  stockSuggestionText,
  importantLinks = [
    "https://stockgenius.ai/india/dashboard",
    "https://stockgenius.ai/india/NSE100-ai-insights",
  ]
) => {
  const imagePath = path.join(__dirname, "../images/topLosers.png");

  const mailOptions = {
    from: "info@stockgenius.ai",
    to: recipientEmail,
    subject: "⚠️ Top Losers of the Day: Stay Informed with Stock Genius.AI", // Subject remains relevant
    html: `
    <div style="text-align: center;">
        <img src="cid:stockGeniusLogoLoser" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
      <div>
        <h3>Dear ${userName},</h3>
        <p>Insights from Stock Genius.AI!</p>
        <p>Today, our AI predictions have highlighted some significant movements in the market with today's Top Losers. 📉🔍</p>
        <p>While these stocks may have seen declines, understanding their movements can provide valuable insights. Here’s a quick breakdown of today’s performance:</p>
        <hr/>
        <h4>What Does "Top Loser" Mean?</h4>
        <p>A Top Loser is a stock that has experienced a significant decrease in value over the trading day. This could be due to various factors such as poor company performance, negative market trends, or broader economic conditions. Analyzing these trends can be crucial for making informed investment decisions.</p>
        <hr/>
        <h4>AI Predictions: Why Understanding These Losers Matters</h4>
        <p>Our AI engine not only identifies stocks that are declining but also analyzes the reasons behind these movements. By providing insights on market dynamics and potential recoveries, we help you stay informed about stocks that might present future opportunities.</p>
        <hr/>
        <p>📎 Attached: Your full report on today’s Top Losers, including detailed analysis, charts, and AI insights.</p>
        
        <h4>What’s Next?</h4>
        <p>Here’s what our AI suggests based on today’s market data:</p>
        <p>${stockSuggestionText}</p> <!-- Include the dynamic stock suggestions here -->
        
        <h4>🔗 Important Links:</h4>
        <ul>
          ${importantLinks
        .map((link) => `<li><a href="${link}">${link}</a></li>`)
        .join("")}
        </ul>
        <hr/>
        <p>Your Success is Our Mission</p>
        <p>Understanding market movements is crucial, and with our AI-driven insights, you can make better-informed decisions. Stay engaged, as tomorrow could bring new opportunities!</p>
        <p>Thank you for being part of Stock Genius.AI, where we empower you to make smarter investment choices, every day. 💼📊</p>
        <p>To your success,<br/>The Stock Genius.AI Team</p>
      </div>
    `,
    attachments: [
      {
        filename: "top_losers.xlsx", // Correct filename for the report
        path: filePath,
      },
      {
        filename: "topLosers.png", // Ensure this is the correct image for top losers
        path: imagePath,
        cid: "stockGeniusLogoLoser",
      },
    ],
  };

  // Log the recipient email before sending (optional)
  // console.log(`Sending email to: ${recipientEmail}`);
  // console.log(`Sending filepath: ${filePath}`);

  await sendEmail(mailOptions);
};

export const sendCoreEngineEmail = async (userId, userName, error, productType) => {
  const mailOptions = {
    from: "info@stockgenius.ai",
    to: ["singharshdeep9039@gmail.com", "manisaikumar321@gmail.com"], // admin email or notification email
    subject: `Python Server Stopped - User: ${userName} (ID: ${userId})`,
    text: `
      Dear Admin,

      The Python server for StockGenius encountered an error while processing the request for user: ${userName} (ID: ${userId}). 

      Product Type: ${productType}

      Error Details: ${error.message}

      Response: ${error.response ? JSON.stringify(error.response.data, null, 2) : 'No response data available'}
      URL: ${error.config ? error.config.url : 'No URL available'}

      Please investigate the issue.

      Best regards,
      StockGenius Team
    `,
    html: `
      <p>Dear Admin,</p>
      <p>The Python server for StockGenius encountered an error while processing the request for user: ${userName} (ID: ${userId}).</p>
      <p><strong>Product Type:</strong> ${productType}</p>
      <p><strong>Error Details:</strong> ${error.message}</p>
      <p><strong>Response:</strong> ${error.response ? `<pre>${JSON.stringify(error.response.data, null, 2)}</pre>` : 'No response data available'}</p>
      <p><strong>URL:</strong> ${error.config ? error.config.url : 'No URL available'}</p>
      <p>Please investigate the issue.</p>
      <p>Best regards,<br>StockGenius Team</p>
    `,
  };

  try {
    await sendEmail(mailOptions);
  } catch (emailError) {
    console.error('Error sending email notification:', emailError);
    // Consider logging this error to a file or monitoring system as well
  }
};


// export const sendUserBotStoppedEmail = async (userEmail, userName, productType) => {
//   const mailOptions = {
//     from: "info@stockgenius.ai",
//     to: userEmail, // User's email
//     subject: "StockGenius: Auto Trading Bot Stopped",
//     text: `
//       Dear ${userName},

//       We regret to inform you that your auto trading bot for the product type "${productType}" has stopped due to an internal issue. Please reactivate the bot at your earliest convenience.

//       We apologize for the inconvenience and appreciate your understanding.

//       Best regards,
//       StockGenius Team
//     `,
//     html: `
//       <p>Dear ${userName},</p>
//       <p>We regret to inform you that your auto trading bot for the product type "<strong>${productType}</strong>" has stopped due to an internal issue. Please reactivate the bot at your earliest convenience.</p>
//       <p>We apologize for the inconvenience and appreciate your understanding.</p>
//       <p>Best regards,<br>StockGenius Team</p>
//     `,
//   };

//   await sendEmail(mailOptions);
// };


export const sendUserBotStoppedEmail = async (userEmail, userName, productType) => {
  const imagePath = path.join(__dirname, "../images/Error.png");

  const mailOptions = {
    from: "info@stockgenius.ai",
    to: userEmail,
    subject: "⚠️ Oops! We Encountered an Error on Your Account",
    html: `
      <div style="text-align: center;">
        <img src="cid:stockGeniusErrorLogo" alt="Stock Genius.AI" style="max-width: 100%; height: auto;"/>
      </div>
      <div>
        <h3>Dear ${userName},</h3>
        
        <p>We're reaching out to inform you that we encountered an <strong>error</strong> while processing your recent request on <strong>Stock Genius.AI.</strong> We sincerely apologize for any inconvenience this may have caused.</p>
        
        <hr/>
        
        <h4>What Happened:</h4>
        <p>It looks like there was an issue with the Auto Trading Bot for your product type <strong>${productType}</strong>. Our team is already on it and working to resolve the issue as quickly as possible.</p>
        
        <hr/>
        
        <h4>What You Can Do Next:</h4>
        <ul>
          <li><strong>Retry the Action:</strong> You may try again in a few minutes. If the problem persists, please reach out to our support team.</li>
          <li><strong>Contact Support:</strong> If you need immediate assistance, feel free to contact us at info@stockgenius.ai, and we'll be happy to help.</li>
        </ul>
        
        <hr/>
        
        <h4>We're Here for You</h4>
        <p>At <strong>Stock Genius.AI,</strong> we're committed to providing you with the best experience possible, and we take errors like this seriously. Rest assured, we are working hard to ensure everything is back on track quickly.</p>
        
        <p>Thank you for your patience and understanding. We'll notify you once the issue is fully resolved.</p>
        
        <p><strong>Best regards,</strong><br/>
        The Stock Genius.AI Team</p>
      </div>
    `,
    attachments: [
      {
        filename: "Error.png",
        path: imagePath,
        cid: "stockGeniusErrorLogo"
      }
    ]
  };

  await sendEmail(mailOptions);
};