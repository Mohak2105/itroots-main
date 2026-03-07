const nodemailer = require('nodemailer');

const parsePort = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const createTransport = () => {
    if (!process.env.SMTP_HOST) {
        return nodemailer.createTransport({ jsonTransport: true });
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parsePort(process.env.SMTP_PORT, 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
            : undefined,
    });
};

const transport = createTransport();
const fromAddress = process.env.MAIL_FROM || 'no-reply@itroots.local';

export const sendWelcomeEmail = async ({
    to,
    name,
    username,
    password,
    role,
}: {
    to: string;
    name: string;
    username: string;
    password: string;
    role: string;
}) => {
    const result = await transport.sendMail({
        from: fromAddress,
        to,
        subject: `Welcome to ITRoots LMS - ${role} Login Details`,
        text: `Hello ${name},\n\nYour ITRoots LMS account has been created.\nUsername: ${username}\nPassword: ${password}\nRole: ${role}\n\nYou can also log in with your email address.\n`,
        html: `<p>Hello ${name},</p><p>Your ITRoots LMS account has been created.</p><p><strong>Username:</strong> ${username}<br /><strong>Password:</strong> ${password}<br /><strong>Role:</strong> ${role}</p><p>You can also log in with your email address.</p>`,
    });

    if (!process.env.SMTP_HOST) {
        console.log('Email transport is using jsonTransport. Configure SMTP_* env vars for real delivery.');
        console.log(JSON.stringify(result.message || result, null, 2));
    }

    return result;
};

export const sendNotificationEmail = async ({
    to,
    name,
    title,
    message,
}: {
    to: string;
    name: string;
    title: string;
    message: string;
}) => {
    const result = await transport.sendMail({
        from: fromAddress,
        to,
        subject: title,
        text: `Hello ${name},\n\n${message}`,
        html: `<p>Hello ${name},</p><p>${message.replace(/\n/g, '<br />')}</p>`,
    });

    if (!process.env.SMTP_HOST) {
        console.log('Email transport is using jsonTransport. Configure SMTP_* env vars for real delivery.');
        console.log(JSON.stringify(result.message || result, null, 2));
    }

    return result;
};
