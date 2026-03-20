const extractDatabaseErrorMessage = (error: any) => {
    const parts = [
        error?.original?.sqlMessage,
        error?.parent?.sqlMessage,
        error?.message,
    ];

    return parts
        .map((part) => String(part || "").trim())
        .find(Boolean) || "";
};

export const getNotificationWriteErrorMessage = (
    error: any,
    fallback = "Unable to send notification",
) => {
    const message = extractDatabaseErrorMessage(error);

    if (/Data truncated for column 'audienceType'/i.test(message)) {
        return "Notification audience type is not supported by the current database schema. Run the latest notifications migration and restart the backend.";
    }

    if (/Data truncated for column 'type'/i.test(message)) {
        return "Notification type is not supported by the current database schema. Run the latest notifications migration and restart the backend.";
    }

    return message || fallback;
};
