import fs from "fs";
import PDFDocument from "pdfkit";
import FyersUserDetail from "../models/brokers/fyers/fyersUserDetail.model.js";
import cron from "node-cron";
import {
  sendDailyTopGainers,
  sendDailyTopLosers,
  sendDailyTradesReport,
  sendNoOrderMessage,
} from "../services/emailService.js";
import User from "../models/user.js";
import s3 from "./aws.js";
import path from "path";
import XLSX from "xlsx";
import ActivatedBot from "../models/activatedBot.model.js";
import moment from "moment-timezone";

const generatePDF = (orders) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const pdfPath = "./Trade Details.pdf";
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // Add title
    doc.fontSize(16).text("Capital Market Trade Details", { align: "center" });
    doc.moveDown();

    // Define table structure
    const table = {
      headers: [
        "Sr.No",
        "TM Name",
        "ClientCode",
        "Buy/Sell",
        "Name of Security",
        "Symbol",
        "Series",
        "Trade No",
        "Trade Time",
        "Quantity",
        "Price(Rs.)",
        "Traded Value(Rs.)",
      ],
      rows: orders.map((order, index) => [
        index + 1,
        "FYERS SECURITIES PRIVATE LIMITED",
        order.clientId,
        order.side === 1 ? "B" : "S",
        order.description,
        order.symbol,
        "EQ",
        order.id,
        new Date(order.orderDateTime).toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        order.qty,
        order.limitPrice.toFixed(2),
        (order.limitPrice * order.qty).toFixed(2),
      ]),
    };

    // Calculate column widths
    const colWidths = [25, 70, 50, 30, 70, 50, 30, 60, 50, 40, 50, 60];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const startX = (doc.page.width - tableWidth) / 2;

    // Helper function to draw a cell
    const drawCell = (text, x, y, width, height, isHeader = false) => {
      doc.rect(x, y, width, height).stroke();
      doc
        .font(isHeader ? "Helvetica-Bold" : "Helvetica")
        .fontSize(isHeader ? 8 : 7)
        .text(text, x + 2, y + 2, {
          width: width - 4,
          height: height - 4,
          align: "left",
          valign: "center",
        });
    };

    // Draw table
    let yPos = doc.y;
    const rowHeight = 20;

    // Draw header
    table.headers.forEach((header, i) => {
      drawCell(
        header,
        startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0),
        yPos,
        colWidths[i],
        rowHeight,
        true
      );
    });
    yPos += rowHeight;

    // Draw rows
    table.rows.forEach((row) => {
      row.forEach((cell, i) => {
        drawCell(
          cell.toString(),
          startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0),
          yPos,
          colWidths[i],
          rowHeight
        );
      });
      yPos += rowHeight;

      // Add a new page if we're near the bottom
      if (yPos > doc.page.height - 50) {
        doc.addPage();
        yPos = 50;
      }
    });

    doc.end();

    stream.on("finish", () => resolve(pdfPath));
    stream.on("error", reject);
  });
};

async function generateAndSendReport() {
  try {
    const excludedEmails = ["excluded@example.com"]; // Array of excluded emails

    // Get today's date in IST
    const startOfToday = moment.tz("Asia/Kolkata").startOf("day").toDate(); // 00:00:00.000
    const startOfTomorrow = moment
      .tz("Asia/Kolkata")
      .add(1, "days")
      .startOf("day")
      .toDate(); // 00:00:00.000 of next day

    // Step 1: Fetch all users with activated bots created today
    const eligibleUsers = await ActivatedBot.find({
      createdAt: { $gte: startOfToday, $lt: startOfTomorrow },
    });

    console.log("Eligible users:", eligibleUsers);

    // Step 2: Filter out excluded emails
    const eligibleUsersFiltered = eligibleUsers.filter(
      (user) => !excludedEmails.includes(user.email)
    );

    console.log("Filtered eligible users:", eligibleUsersFiltered);

    // Step 3: Prepare user details for reporting
    const userIdEmailMap = eligibleUsersFiltered.reduce((acc, user) => {
      acc[user.userId] = {
        email: user.email,
        firstName: user.name.split(" ")[0], // Save first name
      };
      return acc;
    }, {});

    // Step 4: Fetch FyersUserDetail based on eligible user IDs
    const fyersUsers = await FyersUserDetail.find({
      userId: { $in: Object.keys(userIdEmailMap) },
    });

    // Step 5: Send reports or no order messages
    await Promise.all(
      fyersUsers.map(async (fyersUser) => {
        const { email, firstName } = userIdEmailMap[fyersUser.userId];

        console.log("Processing email:", email);

        // Convert authDate and compare it with today's date in IST
        const authDateIST = moment
          .tz(fyersUser.authDate, "Asia/Kolkata")
          .startOf("day")
          .toDate();

        if (
          fyersUser.orders?.orderBook?.length > 0 &&
          authDateIST >= startOfToday &&
          authDateIST < startOfTomorrow
        ) {
          try {
            const pdfPath = await generatePDF(fyersUser.orders.orderBook);
            console.log(`Sending report to: ${email}`);
            await sendDailyTradesReport(pdfPath, email, firstName);
            fs.unlinkSync(pdfPath); // Clean up the PDF file
          } catch (pdfError) {
            console.error(
              `Error generating or sending PDF for user: ${email}`,
              pdfError
            );
          }
        } else {
          console.log(
            `No orders found for user: ${email}. Sending no order message.`
          );
          await sendNoOrderMessage(email, firstName);
        }
      })
    );

    console.log("Daily reports sent successfully");
  } catch (error) {
    console.error("Error generating and sending reports:", error);
  }
}

const startReportScheduler = () => {
  // cron job to run at 4:00 PM only on weekdays (Monday to Friday)
  cron.schedule("0 16 * * 1-5", generateAndSendReport);
  console.log(
    "Report scheduler started. Reports will be generated and sent on weekdays at 4:00 PM IST."
  );
};

// top gainers

const fetchTopGainersReport = async () => {
  const params = {
    Bucket: "automationdatabucket",
    Key: "Realtime_Reports/top_gaineres.xlsx",
  };

  try {
    const data = await s3.getObject(params).promise();
    // console.log(data);

    const tempFilePath = path.join("/tmp", "top_gainers.xlsx");
    fs.writeFileSync(tempFilePath, data.Body); // Write to a temporary location

    // Read the Excel file to extract company names
    const workbook = XLSX.readFile(tempFilePath);
    const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Read data as an array of arrays

    // Extract company names from the first column (index 0)
    const stockSuggestions = [];
    for (const row of jsonData.slice(1)) {
      // Skip the header row
      const stockName = row[0];
      if (stockName) {
        // Check if the stock name is not empty
        stockSuggestions.push(stockName);
      }
      if (stockSuggestions.length === 3) {
        // Stop if we have 3 valid suggestions
        break;
      }
    }
    // console.log('Stock Suggestions:', stockSuggestions);

    return { filePath: tempFilePath, stockSuggestions }; // Return both file path and stock suggestions
  } catch (error) {
    console.error("Error fetching report from S3:", error);
    throw new Error("Failed to fetch report from S3");
  }
};

const scheduleEmailTopGainer = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const users = await User.find({}, "email name"); // Fetch all users
      // console.log(users);

      const { filePath, stockSuggestions } = await fetchTopGainersReport();
      // console.log("Temporary file path:", filePath);

      for (const user of users) {
        // Loop through all users
        try {
          const firstName = user.name.split(" ")[0];

          // Create dynamic stock suggestion text
          const stockSuggestionText = stockSuggestions
            .map((stock, index) => {
              if (!stock) return ""; // Handle empty stock
              return `[Stock ${index + 1}]: ${stock} - ${
                index === 0
                  ? "Keep an eye on this stock, as it’s predicted to rise in the next few days."
                  : index === 1
                  ? "Momentum is building! You might want to consider investing."
                  : "This one’s got long-term potential, especially with the industry showing upward trends."
              }`;
            })
            .filter(Boolean)
            .join("<br/>"); // Filter out any empty strings and join with line breaks

          await sendDailyTopGainers(
            filePath,
            user.email,
            firstName,
            stockSuggestionText
          );
          // console.log(`Email sent successfully to ${user.email}!`);
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error.message);
        }
      }

      fs.unlinkSync(filePath); // Clean up the report file
    } catch (error) {
      console.error("Error in scheduling emails:", error.message);
    }
  });
};

//top losers

const fetchTopLosersReport = async () => {
  const params = {
    Bucket: "automationdatabucket",
    Key: "Realtime_Reports/top_losers.xlsx", // Change to top losers file
  };

  try {
    const data = await s3.getObject(params).promise();
    // console.log(data);

    const tempFilePath = path.join("/tmp", "top_losers.xlsx"); // Updated file name
    fs.writeFileSync(tempFilePath, data.Body); // Write to a temporary location

    // Read the Excel file to extract company names
    const workbook = XLSX.readFile(tempFilePath);
    const sheetName = workbook.SheetNames[0]; // Assuming data is in the first sheet
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Read data as an array of arrays

    // Extract company names from the first column (index 0)
    const stockSuggestions = [];
    for (const row of jsonData.slice(1)) {
      // Skip the header row
      const stockName = row[0];
      if (stockName) {
        // Check if the stock name is not empty
        stockSuggestions.push(stockName);
      }
      if (stockSuggestions.length === 3) {
        // Stop if we have 3 valid suggestions
        break;
      }
    }
    // console.log('Stock Suggestions:', stockSuggestions);

    return { filePath: tempFilePath, stockSuggestions }; // Return both file path and stock suggestions
  } catch (error) {
    console.error("Error fetching report from S3:", error);
    throw new Error("Failed to fetch report from S3");
  }
};

const scheduleEmailTopLosers = () => {
  cron.schedule("0 8 * * *", async () => {
    try {
      const users = await User.find({}, "email name"); // Fetch all users
      // console.log(users);

      const { filePath, stockSuggestions } = await fetchTopLosersReport();
      // console.log("Temporary file path:", filePath);

      for (const user of users) {
        // Loop through all users
        try {
          const firstName = user.name.split(" ")[0];

          // Create dynamic stock suggestion text
          const stockSuggestionText = stockSuggestions
            .map((stock, index) => {
              if (!stock) return ""; // Handle empty stock
              return `[Stock ${index + 1}]: ${stock} - ${
                index === 0
                  ? "Keep an eye on this stock, as it’s predicted to rise in the next few days."
                  : index === 1
                  ? "Momentum is building! You might want to consider investing."
                  : "This one’s got long-term potential, especially with the industry showing upward trends."
              }`;
            })
            .filter(Boolean)
            .join("<br/>"); // Filter out any empty strings and join with line breaks

          await sendDailyTopLosers(
            filePath,
            user.email,
            firstName,
            stockSuggestionText
          );
          // console.log(`Email sent successfully to ${user.email}!`);
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error.message);
        }
      }

      fs.unlinkSync(filePath); // Clean up the report file
    } catch (error) {
      console.error("Error in scheduling emails:", error.message);
    }
  });
};

export { scheduleEmailTopGainer, scheduleEmailTopLosers, startReportScheduler };
