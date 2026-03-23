export const normalizeNamePart = (value: unknown) => String(value ?? '').trim();

export const buildFullName = (...parts: Array<unknown>) => (
    parts
        .map((part) => normalizeNamePart(part))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
);

export const splitFullName = (value?: unknown) => {
    const normalized = normalizeNamePart(value);
    if (!normalized) {
        return { firstName: '', middleName: '', lastName: '' };
    }

    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
        return { firstName: parts[0], middleName: '', lastName: '' };
    }

    if (parts.length === 2) {
        return { firstName: parts[0], middleName: '', lastName: parts[1] };
    }

    return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(' '),
        lastName: parts[parts.length - 1],
    };
};

export const resolveUserNameFields = (
    input: {
        firstName?: unknown;
        middleName?: unknown;
        lastName?: unknown;
        name?: unknown;
    },
    fallback?: {
        firstName?: unknown;
        middleName?: unknown;
        lastName?: unknown;
        name?: unknown;
    },
) => {
    const fallbackCombined = buildFullName(
        fallback?.firstName,
        fallback?.middleName,
        fallback?.lastName,
    ) || normalizeNamePart(fallback?.name);
    const fallbackParts = splitFullName(fallbackCombined);
    const hasStructuredInput = input.firstName !== undefined || input.middleName !== undefined || input.lastName !== undefined;

    if (hasStructuredInput) {
        const firstName = input.firstName !== undefined ? normalizeNamePart(input.firstName) : fallbackParts.firstName;
        const middleName = input.middleName !== undefined ? normalizeNamePart(input.middleName) : fallbackParts.middleName;
        const lastName = input.lastName !== undefined ? normalizeNamePart(input.lastName) : fallbackParts.lastName;
        const name = normalizeNamePart(input.name) || buildFullName(firstName, middleName, lastName);

        return {
            firstName: firstName || null,
            middleName: middleName || null,
            lastName: lastName || null,
            name,
        };
    }

    const providedName = normalizeNamePart(input.name);
    if (providedName) {
        const providedParts = splitFullName(providedName);
        return {
            firstName: providedParts.firstName || null,
            middleName: providedParts.middleName || null,
            lastName: providedParts.lastName || null,
            name: providedName,
        };
    }

    return {
        firstName: fallbackParts.firstName || null,
        middleName: fallbackParts.middleName || null,
        lastName: fallbackParts.lastName || null,
        name: fallbackCombined,
    };
};
