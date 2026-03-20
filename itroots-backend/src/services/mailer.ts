const nodemailer = require('nodemailer');

const parsePort = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string | undefined, fallback = false) => {
    if (value === undefined) return fallback;
    return String(value).trim().toLowerCase() === 'true';
};

const mailProvider = String(process.env.MAIL_PROVIDER || '').trim().toUpperCase();

const resolveSmtpSettings = () => {
    const useZeptoEnv = mailProvider === 'ZEPTO';
    const host = String(
        process.env.SMTP_HOST
        || (useZeptoEnv ? process.env.ZEPTO_SMTP_HOST || 'smtp.zeptomail.com' : '')
    ).trim();

    const port = parsePort(
        process.env.SMTP_PORT || (useZeptoEnv ? process.env.ZEPTO_SMTP_PORT : undefined),
        587
    );

    const secure = parseBoolean(
        process.env.SMTP_SECURE || (useZeptoEnv ? process.env.ZEPTO_SMTP_SECURE : undefined),
        false
    );

    const user = String(process.env.SMTP_USER || (useZeptoEnv ? process.env.ZEPTO_SMTP_USER : '') || '').trim();
    const pass = String(process.env.SMTP_PASS || (useZeptoEnv ? process.env.ZEPTO_SMTP_PASS : '') || '').trim();

    return {
        host,
        port,
        secure,
        user,
        pass,
        providerLabel: useZeptoEnv ? 'ZEPTO_SMTP' : 'SMTP',
    };
};

const smtpSettings = resolveSmtpSettings();
const usingJsonTransport = !smtpSettings.host;

const createTransport = () => {
    if (usingJsonTransport) {
        return nodemailer.createTransport({ jsonTransport: true });
    }

    return nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        auth: smtpSettings.user
            ? {
                user: smtpSettings.user,
                pass: smtpSettings.pass,
            }
            : undefined,
    });
};

const transport = createTransport();
const fromAddress = process.env.MAIL_FROM || process.env.ZEPTO_MAIL_FROM || smtpSettings.user || 'no-reply@itroots.local';
const fromName = process.env.MAIL_FROM_NAME || 'ITRoots LMS';
const fromField = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;

const asHtmlSafe = (value: string) =>
    String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const logJsonTransportHint = () => {
    console.log('[mailer] jsonTransport is active. Configure SMTP_* or MAIL_PROVIDER=ZEPTO with ZEPTO_SMTP_* env vars for real delivery.');
};

export const verifyMailerConnection = async () => {
    if (usingJsonTransport) {
        logJsonTransportHint();
        return { ok: true, mode: 'JSON_TRANSPORT' };
    }

    try {
        await transport.verify();
        console.log(`[mailer] ${smtpSettings.providerLabel} connection verified (${smtpSettings.host}:${smtpSettings.port})`);
        return { ok: true, mode: smtpSettings.providerLabel };
    } catch (error: any) {
        console.error(`[mailer] ${smtpSettings.providerLabel} verification failed:`, error?.message || error);
        return { ok: false, mode: smtpSettings.providerLabel, error: error?.message || String(error) };
    }
};

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
    const safeName = asHtmlSafe(name);
    const safeUsername = asHtmlSafe(username);
    const safePassword = asHtmlSafe(password);
    const safeRole = asHtmlSafe(role);

    const result = await transport.sendMail({
        from: fromField,
        to,
        subject: `Welcome to ITRoots LMS - ${role} Login Details`,
        text: `Hello ${name},\n\nYour ITRoots LMS account has been created.\nUsername: ${username}\nPassword: ${password}\nRole: ${role}\n\nYou can also log in with your email address.\n`,
        html: `<p>Hello ${safeName},</p><p>Your ITRoots LMS account has been created.</p><p><strong>Username:</strong> ${safeUsername}<br /><strong>Password:</strong> ${safePassword}<br /><strong>Role:</strong> ${safeRole}</p><p>You can also log in with your email address.</p>`,
    });

    if (usingJsonTransport) {
        logJsonTransportHint();
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
        from: fromField,
        to,
        subject: title,
        text: `Hello ${name},\n\n${message}`,
        html: `<p>Hello ${asHtmlSafe(name)},</p><p>${asHtmlSafe(message).replace(/\n/g, '<br />')}</p>`,
    });

    if (usingJsonTransport) {
        logJsonTransportHint();
        console.log(JSON.stringify(result.message || result, null, 2));
    }

    return result;
};
