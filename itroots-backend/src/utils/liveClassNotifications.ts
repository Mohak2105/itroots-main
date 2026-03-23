import { Op } from 'sequelize';
import LiveClass from '../models/LiveClass';
import Notification from '../models/Notification';
import NotificationRecipient from '../models/NotificationRecipient';

const LIVE_CLASS_NOTIFICATION_TITLE_PATTERN = /^Live Class (Started|Updated|Ended|Cancelled):\s*(.+)$/i;
const LIVE_CLASS_ROUTE_PATTERN = /\/(?:lms\/(?:student|teacher)|student|faculty)?\/live-classes\/([a-z0-9-]+)/i;
const LIVE_CLASS_SESSION_WINDOW_MS = 120 * 60 * 1000;

const normalizeKeyPart = (value: unknown) => String(value ?? '').trim().toLowerCase();

type LiveClassNotificationMeta = {
    liveClassId: string;
    liveClassTitle: string;
    batchId: string;
    courseId: string;
    stateLabel: string;
};

const extractLiveClassIdFromMessage = (message: unknown) => {
    const match = String(message ?? '').match(LIVE_CLASS_ROUTE_PATTERN);
    return match?.[1] || '';
};

const parseLiveClassNotificationMeta = (notification: any): LiveClassNotificationMeta | null => {
    const title = String(notification?.title ?? '').trim();
    const titleMatch = title.match(LIVE_CLASS_NOTIFICATION_TITLE_PATTERN);
    if (!titleMatch) return null;

    return {
        liveClassId: extractLiveClassIdFromMessage(notification?.message),
        liveClassTitle: String(titleMatch[2] ?? '').trim(),
        batchId: normalizeKeyPart(notification?.batchId ?? notification?.batch?.id),
        courseId: normalizeKeyPart(notification?.courseId ?? notification?.course?.id),
        stateLabel: String(titleMatch[1] ?? '').trim().toUpperCase(),
    };
};

const buildLiveClassNotificationKey = (value: { liveClassTitle?: unknown; batchId?: unknown; courseId?: unknown }) => (
    `${normalizeKeyPart(value.liveClassTitle)}::${normalizeKeyPart(value.batchId)}::${normalizeKeyPart(value.courseId)}`
);

const isLiveClassStillCurrent = (liveClass: any, now = Date.now()) => {
    const status = String(liveClass?.status ?? '').trim().toUpperCase();
    if (status !== 'SCHEDULED') return false;

    const scheduledAt = new Date(liveClass?.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) return false;

    return now <= scheduledAt.getTime() + LIVE_CLASS_SESSION_WINDOW_MS;
};

export const clearStudentNotificationsForLiveClass = async (liveClass: any) => {
    const normalizedTitle = String(liveClass?.title ?? '').trim();
    const batchId = normalizeKeyPart(liveClass?.batchId);
    const courseId = normalizeKeyPart(liveClass?.courseId);

    if (!normalizedTitle || !batchId) return;

    const notifications = await Notification.findAll({
        where: {
            batchId: liveClass.batchId,
            title: { [Op.like]: `%: ${normalizedTitle}` },
        },
        attributes: ['id', 'title', 'message', 'batchId', 'courseId'],
    });

    const notificationIds = notifications
        .filter((notification: any) => {
            const meta = parseLiveClassNotificationMeta(notification);
            if (!meta) return false;

            return meta.batchId === batchId && meta.courseId === courseId;
        })
        .map((notification: any) => notification.id);

    if (!notificationIds.length) return;

    await NotificationRecipient.destroy({
        where: { notificationId: { [Op.in]: notificationIds } },
    });

    await Notification.destroy({
        where: { id: { [Op.in]: notificationIds } },
    });
};

export const filterCurrentLiveClassNotificationRecipients = async <T extends { notification?: any }>(recipients: T[]) => {
    const liveClassNotifications = recipients
        .map((recipient) => ({ recipient, meta: parseLiveClassNotificationMeta((recipient as any).notification) }))
        .filter((item): item is { recipient: T; meta: LiveClassNotificationMeta } => Boolean(item.meta));

    if (!liveClassNotifications.length) {
        return recipients;
    }

    const batchIds = Array.from(new Set(
        liveClassNotifications
            .map(({ meta }) => meta.batchId)
            .filter(Boolean),
    ));

    const liveClassIds = Array.from(new Set(
        liveClassNotifications
            .map(({ meta }) => meta.liveClassId)
            .filter(Boolean),
    ));

    const liveClasses = await LiveClass.findAll({
        where: {
            [Op.or]: [
                batchIds.length ? { batchId: { [Op.in]: batchIds } } : null,
                liveClassIds.length ? { id: { [Op.in]: liveClassIds } } : null,
            ].filter(Boolean) as any[],
        },
        attributes: ['id', 'title', 'batchId', 'courseId', 'status', 'scheduledAt'],
        order: [['scheduledAt', 'DESC']],
    });

    const activeLiveClasses = liveClasses.filter((liveClass: any) => isLiveClassStillCurrent(liveClass));
    const activeLiveClassIds = new Set(activeLiveClasses.map((liveClass: any) => String(liveClass.id)));
    const activeLiveClassKeys = new Set(activeLiveClasses.map((liveClass: any) => buildLiveClassNotificationKey({
        liveClassTitle: liveClass.title,
        batchId: liveClass.batchId,
        courseId: liveClass.courseId,
    })));

    const seenKeys = new Set<string>();

    return recipients.filter((recipient) => {
        const meta = parseLiveClassNotificationMeta((recipient as any).notification);
        if (!meta) return true;

        if (meta.stateLabel === 'ENDED' || meta.stateLabel === 'CANCELLED') {
            return false;
        }

        const fallbackKey = buildLiveClassNotificationKey(meta);
        const dedupeKey = meta.liveClassId || fallbackKey;
        const isCurrent = meta.liveClassId
            ? activeLiveClassIds.has(meta.liveClassId)
            : activeLiveClassKeys.has(fallbackKey);

        if (!isCurrent || seenKeys.has(dedupeKey)) {
            return false;
        }

        seenKeys.add(dedupeKey);
        return true;
    });
};
