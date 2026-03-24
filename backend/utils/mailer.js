import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root if not already loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        const mailOptions = {
            from: `"Expense-Approval" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Mailer] Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('[Mailer] Error sending email:', error);
        throw error;
    }
};

export const sendClaimStatusEmail = async (employee, claim, status, rejectionReason = null) => {
    const isApproved = status === 'Approved';

    const subject = `Claim ${status}: ${claim.claim_number}`;

    const html = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <p>Hi Selva Kumar,</p>
            
            <p>This is to inform you that a reimbursement claim has been ${status.toLowerCase()}.</p>
            
            <p><strong>Details:</strong></p>
            <ul>
                <li><strong>Claim ID:</strong> ${claim.claim_number}</li>
                <li><strong>Employee Name:</strong> ${employee.name}</li>
                <li><strong>Amount:</strong> ${claim.currency || 'INR'} ${claim.total_amount}</li>
                <li><strong>Report Name:</strong> ${claim.report_name}</li>
            </ul>

            ${!isApproved && rejectionReason ? `<p><strong>Rejection Reason:</strong> ${rejectionReason}</p>` : ''}

            <p>Regards,<br>
            TTL Support</p>
        </div>
    `;

    return sendEmail({ to: employee.email, subject, html });
};
