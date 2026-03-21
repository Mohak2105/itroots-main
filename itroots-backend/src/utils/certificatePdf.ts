import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { resolveStoredCertificateSignature } from './certificateSignature';

const renderCenteredLogo = (doc: any, imagePath: string, x: number, y: number, width: number, height: number) => {
    if (!fs.existsSync(imagePath)) {
        return false;
    }

    doc.image(imagePath, x, y, { fit: [width, height], align: 'center' });
    return true;
};

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
    const signatorySignaturePath = resolveStoredCertificateSignature(certificate.signatorySignature);
    const lmsLogoPath = path.resolve(__dirname, '..', '..', '..', 'itroots', 'public', 'images', 'lms_logo.png');
    const sealLogoPath = path.resolve(__dirname, '..', '..', '..', 'itroots', 'public', 'images', 'logo.png');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${student.name.replace(/[^a-z0-9]/gi, '_')}_certificate.pdf"`);

    const doc: any = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    doc.pipe(res);

    doc.rect(0, 0, 842, 595).fill('#f7fbff');

    doc.circle(-72, -44, 205).fill('#0d3f74');
    doc.circle(-38, -18, 182).fill('#0f5ca8');
    doc.circle(12, 22, 150).fill('#2a86dc');
    doc.circle(26, 30, 128).fill('#113d73');

    doc.circle(855, 610, 190).fill('#0d3f74');
    doc.circle(820, 592, 166).fill('#0f5ca8');
    doc.circle(788, 568, 138).fill('#2a86dc');
    doc.circle(778, 558, 116).fill('#113d73');

    doc.rect(52, 44, 718, 486).lineWidth(1.5).strokeColor('#b7cbe0').stroke();
    doc.rect(58, 50, 706, 474).lineWidth(0.6).strokeColor('#d9e4ef').stroke();

    const hasMainLogo = renderCenteredLogo(doc, lmsLogoPath, 298, 58, 245, 72);
    if (!hasMainLogo) {
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#12395b').text('ITROOTS LMS', 0, 82, { align: 'center' });
        doc.font('Helvetica').fontSize(11).fillColor('#526173').text('Empowering Minds Through Industry-Ready Learning', 0, 106, { align: 'center' });
    }

    doc.font('Times-Bold').fontSize(42).fillColor('#111827').text('CERTIFICATE', 0, 126, { align: 'center' });
    doc.font('Times-Bold').fontSize(18).fillColor('#111827').text('OF ACHIEVEMENT', 0, 172, {
        align: 'center',
        characterSpacing: 6,
    });

    doc.moveTo(352, 214).lineTo(392, 214).lineWidth(0.8).strokeColor('#1f2937').stroke();
    doc.circle(421, 214, 1.8).fillColor('#1f2937').fill();
    doc.moveTo(450, 214).lineTo(490, 214).lineWidth(0.8).strokeColor('#1f2937').stroke();

    doc.font('Times-Roman').fontSize(14).fillColor('#3f4a59').text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', 0, 242, {
        align: 'center',
        characterSpacing: 2,
    });
    doc.font('Times-Italic').fontSize(34).fillColor('#111827').text(student.name, 0, 286, { align: 'center' });
    doc.moveTo(183, 337).lineTo(660, 337).lineWidth(1).strokeColor('#c7d5e4').stroke();

    doc.font('Times-Roman').fontSize(14).fillColor('#475569').text(
        'For successfully completing the professional course conducted by ITROOTS LMS.',
        140,
        355,
        { width: 562, align: 'center', lineGap: 4 }
    );
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#12395b').text(course?.title || 'Course Title', 0, 408, { align: 'center' });
    doc.font('Helvetica').fontSize(14).fillColor('#526173').text(`Duration: ${certificate.duration || 'Not specified'}`, 0, 444, {
        align: 'center',
    });

    if (batch?.name) {
        doc.font('Helvetica').fontSize(13).fillColor('#66788b').text(
            `Batch: ${batch.name}${batch.schedule ? ` | ${batch.schedule}` : ''}`,
            0,
            468,
            { align: 'center' }
        );
    }

    doc.circle(421, 500, 42).lineWidth(1).strokeColor('#b9cce0').stroke();
    doc.circle(421, 500, 35).lineWidth(1).strokeColor('#d8e3ef').stroke();
    if (!renderCenteredLogo(doc, sealLogoPath, 399, 478, 44, 44)) {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#8aa0b7').text('ITROOTS', 389, 496, { width: 64, align: 'center' });
    }

    doc.moveTo(148, 500).lineTo(304, 500).lineWidth(1).strokeColor('#12395b').stroke();
    if (signatorySignaturePath) {
        doc.image(signatorySignaturePath, 148, 438, {
            fit: [156, 48],
            align: 'center',
            valign: 'center',
        });
    } else {
        doc.font('Times-Italic').fontSize(22).fillColor('#111827').text(certificate.signatoryName, 0, 470, {
            width: 452,
            align: 'center',
        });
    }
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(certificate.signatoryName, 130, 508, {
        width: 190,
        align: 'center',
    });
    doc.font('Helvetica').fontSize(10).fillColor('#526173').text(certificate.signatoryTitle || creator?.name || 'Authorized Signatory', 130, 526, {
        width: 190,
        align: 'center',
    });

    doc.moveTo(538, 500).lineTo(694, 500).lineWidth(1).strokeColor('#12395b').stroke();
    doc.font('Times-Italic').fontSize(22).fillColor('#111827').text('ITROOTS LMS', 390, 470, {
        width: 452,
        align: 'center',
    });
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('ITROOTS LMS', 520, 508, {
        width: 190,
        align: 'center',
    });
    doc.font('Helvetica').fontSize(10).fillColor('#526173').text('Official Academic Certificate', 520, 526, {
        width: 190,
        align: 'center',
    });

    doc.font('Helvetica').fontSize(11).fillColor('#526173').text(`Certificate No: ${certificate.certificateNumber}`, 70, 542);
    doc.text(`Issued On: ${issueDate}`, 620, 542, { width: 150, align: 'right' });

    doc.end();
};
