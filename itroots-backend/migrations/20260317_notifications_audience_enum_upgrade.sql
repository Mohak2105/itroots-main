-- Upgrade notifications.audienceType on existing databases.
-- Safe to run multiple times.

ALTER TABLE notifications
MODIFY COLUMN type ENUM(
    'ANNOUNCEMENT',
    'NOTIFICATION',
    'REMINDER',
    'ALERT',
    'PLACEMENT',
    'FEES'
) NOT NULL DEFAULT 'NOTIFICATION';

ALTER TABLE notifications
MODIFY COLUMN audienceType ENUM(
    'ALL_STUDENTS',
    'SELECTED_STUDENTS',
    'ALL_TEACHERS',
    'SELECTED_TEACHERS',
    'ALL_USERS',
    'ALL_Faculty',
    'SELECTED_Faculty',
    'SELECTED_BATCH',
    'SELECTED_BATCH_STUDENTS',
    'SELECTED_BATCH_Faculty',
    'SELECTED_COURSE',
    'SELECTED_COURSE_STUDENTS',
    'SELECTED_COURSE_Faculty'
) NOT NULL;

UPDATE notifications
SET audienceType = 'ALL_Faculty'
WHERE audienceType = 'ALL_TEACHERS';

UPDATE notifications
SET audienceType = 'SELECTED_Faculty'
WHERE audienceType = 'SELECTED_TEACHERS';

ALTER TABLE notifications
MODIFY COLUMN audienceType ENUM(
    'ALL_STUDENTS',
    'SELECTED_STUDENTS',
    'ALL_Faculty',
    'SELECTED_Faculty',
    'ALL_USERS',
    'SELECTED_BATCH',
    'SELECTED_BATCH_STUDENTS',
    'SELECTED_BATCH_Faculty',
    'SELECTED_COURSE',
    'SELECTED_COURSE_STUDENTS',
    'SELECTED_COURSE_Faculty'
) NOT NULL;
