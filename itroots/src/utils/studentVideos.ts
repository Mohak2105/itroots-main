import { ENDPOINTS } from "@/config/api";

export type StudentEnrollmentLike = {
    batchId: string;
    batch?: {
        course?: {
            title?: string;
        };
    };
};

export type StudentVideoRecord = {
    id: string;
    title: string;
    description?: string;
    contentUrl?: string;
    fileUrl?: string;
    createdAt?: string;
    uploadedAt?: string;
    subject?: string;
    batchId?: string;
};

export const normalizeStudentVideoRecords = (payload: any): StudentVideoRecord[] => {
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.contents)) {
        return payload.contents;
    }

    if (Array.isArray(payload)) {
        return payload;
    }

    return [];
};

const dedupeVideos = (videos: StudentVideoRecord[]) => {
    const seen = new Set<string>();
    return videos.filter((video) => {
        if (!video?.id || seen.has(video.id)) {
            return false;
        }
        seen.add(video.id);
        return true;
    });
};

export const fetchStudentUploadedVideos = async (
    token: string,
    enrollments: StudentEnrollmentLike[]
): Promise<StudentVideoRecord[]> => {
    let normalizedVideos: StudentVideoRecord[] = [];

    try {
        const videosResponse = await fetch(`${ENDPOINTS.STUDENT.BATCH_RESOURCES}?type=VIDEO`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const videosData = await videosResponse.json().catch(() => null);

        if (videosResponse.ok) {
            normalizedVideos = normalizeStudentVideoRecords(videosData);
        }
    } catch {
        normalizedVideos = [];
    }

    if (!normalizedVideos.length && enrollments.length > 0) {
        const fallbackGroups = await Promise.all(
            enrollments.map(async (enrollment) => {
                try {
                    const response = await fetch(
                        `${ENDPOINTS.STUDENT.BATCH_RESOURCES}/${enrollment.batchId}?type=VIDEO`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );
                    const payload = await response.json().catch(() => null);

                    if (!response.ok) {
                        return [];
                    }

                    return normalizeStudentVideoRecords(payload).map((video) => ({
                        ...video,
                        batchId: video.batchId || enrollment.batchId,
                        subject: video.subject || enrollment.batch?.course?.title || "",
                    }));
                } catch {
                    return [];
                }
            })
        );

        normalizedVideos = fallbackGroups.flat();
    }

    return dedupeVideos(normalizedVideos);
};
