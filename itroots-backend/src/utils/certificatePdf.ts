import { Response } from 'express';

export const streamCertificatePdf = (res: Response, certificate: any) => {
    const PDFDocument = require('pdfkit');
    const student = certificate.student;
    const course = certificate.course;
    const batch = certificate.batch;
    const creator = certificate.creator;
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${student.name.replace(/[^a-z0-9]/gi, '_')}_certificate.pdf"`);

    const doc: any = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    doc.pipe(res);

    doc.rect(22, 22, 798, 550).lineWidth(2).strokeColor('#0f4c81').stroke();
    doc.roundedRect(38, 38, 766, 518, 18).lineWidth(1).strokeColor('#d4a53a').stroke();
    doc.rect(52, 52, 738, 490).fillOpacity(0.06).fillAndStroke('#f8f4ea', '#f8f4ea');
    doc.fillOpacity(1);

    doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f4c81').text('ITROOTS LMS', 0, 72, { align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor('#4b5563').text('Empowering Minds Through Industry-Ready Learning', 0, 96, { align: 'center' });

    doc.font('Helvetica-Bold').fontSize(28).fillColor('#b68a25').text('CERTIFICATE OF COMPLETION', 0, 145, { align: 'center' });
    doc.moveTo(280, 185).lineTo(560, 185).lineWidth(1).strokeColor('#d4a53a').stroke();

    doc.font('Helvetica').fontSize(16).fillColor('#4b5563').text('This certificate is proudly presented to', 0, 220, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(34).fillColor('#0f172a').text(student.name, 0, 255, { align: 'center' });

    doc.font('Helvetica').fontSize(17).fillColor('#334155').text('for successfully completing the course', 0, 315, { align: 'center' });
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#0f4c81').text(course?.title || 'Course', 0, 347, { align: 'center' });
    doc.font('Helvetica').fontSize(14).fillColor('#475569').text(`Duration: ${certificate.duration}`, 0, 387, { align: 'center' });

    if (batch?.name) {
        doc.font('Helvetica').fontSize(13).fillColor('#64748b').text(`Batch: ${batch.name}${batch.schedule ? ` | ${batch.schedule}` : ''}`, 0, 412, { align: 'center' });
    }

    doc.font('Helvetica').fontSize(12).fillColor('#475569').text(`Certificate No: ${certificate.certificateNumber}`, 85, 472);
    doc.text(`Issued On: ${issueDate}`, 600, 472, { width: 120, align: 'right' });

    doc.moveTo(92, 510).lineTo(250, 510).lineWidth(1).strokeColor('#0f4c81').stroke();
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text(certificate.signatoryName, 82, 518, { width: 190, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor('#64748b').text(certificate.signatoryTitle || creator?.name || 'Authorized Signatory', 82, 538, { width: 190, align: 'center' });

    doc.moveTo(558, 510).lineTo(716, 510).lineWidth(1).strokeColor('#0f4c81').stroke();
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('ITROOTS Learning Platform', 548, 518, { width: 190, align: 'center' });
    doc.font('Helvetica').fontSize(11).fillColor('#64748b').text('Official Academic Certificate', 548, 538, { width: 190, align: 'center' });

    doc.end();
};
