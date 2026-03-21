const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const parsePlacementDueDate = (value: any) => {
    const normalized = String(value ?? '').trim();
    if (!normalized) return null;

    const parsedDate = DATE_ONLY_PATTERN.test(normalized)
        ? new Date(`${normalized}T23:59:59.999`)
        : new Date(normalized);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return parsedDate;
};

export const isPlacementExpired = (placement: { dueDate?: Date | string | null }, now = new Date()) => {
    if (!placement?.dueDate) {
        return false;
    }

    const dueDate = placement.dueDate instanceof Date
        ? placement.dueDate
        : new Date(placement.dueDate);

    if (Number.isNaN(dueDate.getTime())) {
        return false;
    }

    return dueDate.getTime() < now.getTime();
};

export const sanitizePlacementForStudent = (placement: any, now = new Date()) => {
    const payload = typeof placement?.toJSON === 'function' ? placement.toJSON() : placement;
    const expired = isPlacementExpired(payload, now);

    return {
        ...payload,
        isExpired: expired,
        applyLink: expired ? '' : String(payload?.applyLink || ''),
    };
};
