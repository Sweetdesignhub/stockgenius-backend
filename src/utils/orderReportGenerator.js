import fs from 'fs';
import PDFDocument from 'pdfkit';
import FyersUserDetail from '../models/brokers/fyers/fyersUserDetail.model.js';
import cron from 'node-cron';
import { sendDailyTradesReport } from '../services/emailService.js';

const generatePDF = (orders) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const pdfPath = './Trade Details.pdf';
    const stream = fs.createWriteStream(pdfPath);

    doc.pipe(stream);

    // Add title
    doc.fontSize(16).text('Capital Market Trade Details', { align: 'center' });
    doc.moveDown();

    // Define table structure
    const table = {
      headers: [
        'Sr.No',
        'TM Name',
        'ClientCode',
        'Buy/Sell',
        'Name of Security',
        'Symbol',
        'Series',
        'Trade No',
        'Trade Time',
        'Quantity',
        'Price(Rs.)',
        'Traded Value(Rs.)',
      ],
      rows: orders.map((order, index) => [
        index + 1,
        'FYERS SECURITIES PRIVATE LIMITED',
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
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(isHeader ? 8 : 7)
        .text(text, x + 2, y + 2, {
          width: width - 4,
          height: height - 4,
          align: 'left',
          valign: 'center',
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

    stream.on('finish', () => resolve(pdfPath));
    stream.on('error', reject);
  });
};

// The rest of the code remains the same
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
