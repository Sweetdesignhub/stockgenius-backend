import fs from 'fs';
import PDFDocument from 'pdfkit';
import FyersUserDetail from '../models/brokers/fyers/fyersUserDetail.model.js';
import cron from 'node-cron';
import { sendDailyTradesReport } from '../services/emailService.js';

// Function to generate the PDF
const generatePDF = (orders) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const pdfPath = './Trade Details.pdf';
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // Add title
    doc.fontSize(14).text('Capital Market:', { align: 'left' });
    doc.moveDown();

    // Define table structure
    const table = {
      headers: [
        'Sr.No',
        'TM Name',
        'ClientCode',
        'Buy/Sell',
        'Name of the Security',
        'Symbol',
        'Series',
        'Trade No',
        'Trade Time',
        'Quantity',
        'Price(Rs.)',
        'Traded Value(Rs.)',
      ],
      rows: [],
    };

    // Populate table rows
    orders.forEach((order, index) => {
      table.rows.push([
        index + 1,
        'FYERS SECURITIESPRIVATE LIMITED',
        order.clientId,
        order.side === 1 ? 'B' : 'S',
        order.description,
        order.symbol,
        'EQ',
        order.id,
        new Date(order.orderDateTime).toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        order.qty,
        order.limitPrice.toFixed(2),
        (order.limitPrice * order.qty).toFixed(2),
      ]);
    });

    // Define column widths (adjust as needed to fit your page)
    const colWidths = [30, 70, 50, 40, 80, 60, 40, 80, 60, 50, 50, 70];
    const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const startX = (doc.page.width - tableWidth) / 2;

    // Draw table header
    let yPos = doc.y;
    table.headers.forEach((header, i) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(
          header,
          startX + colWidths.slice(0, i).reduce((sum, width) => sum + width, 0),
          yPos,
          {
            width: colWidths[i],
            align: 'left',
          }
        );
    });

    // Draw table rows
    yPos += 20;
    table.rows.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        doc
          .font('Helvetica')
          .fontSize(8)
          .text(
            cell.toString(),
            startX +
              colWidths
                .slice(0, cellIndex)
                .reduce((sum, width) => sum + width, 0),
            yPos,
            {
              width: colWidths[cellIndex],
              align: 'left',
            }
          );
      });
      yPos += 20;

      // Add a new page if we're near the bottom
      if (yPos > doc.page.height - 50) {
        doc.addPage();
        yPos = 50;
      }
    });

    doc.end();

    stream.on('finish', () => resolve(pdfPath));
    stream.on('error', reject);
  });
};

async function generateAndSendReport() {
  try {
    const users = await FyersUserDetail.find({});
    for (const user of users) {
      if (user.orders && user.orders.orderBook) {
        const pdfPath = await generatePDF(user.orders.orderBook);
        await sendDailyTradesReport(pdfPath, user.profile.email_id);
        fs.unlinkSync(pdfPath);
      }
    }

    console.log('Daily reports sent successfully');
  } catch (error) {
    console.error('Error generating and sending reports:', error);
  }
}

const startReportScheduler = () => {
  cron.schedule('0 16 * * *', generateAndSendReport);
  console.log(
    'Report scheduler started. Reports will be generated and sent daily at 4:00 PM.'
  );
};

export default startReportScheduler;
