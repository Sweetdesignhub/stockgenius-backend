import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { sendDailyTradesReport } from '../services/emailService.js';

export async function createPDF(data) {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const fontSize = 12;
    page.drawText(data, {
      x: 50,
      y: height - 50,
      size: fontSize,
    });
    pdfDoc.encrypt({
      ownerPassword: 'strongpassword',
      permissions: {
        copying: false,
        printing: 'lowResolution',
      },
    });
    const pdfBytes = await pdfDoc.save();
    const outputPath = './output.pdf';
    fs.writeFileSync(outputPath, pdfBytes);
    await sendDailyTradesReport('recipient-email@gmail.com', outputPath);
    console.log('Report sent successfully');
  } catch (error) {
    console.log('Failed to create or send report:', error);
  }
}
