USE itroots_db;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS specialization VARCHAR(255) NULL;

SET @has_username_index := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'uq_users_username'
);
SET @create_username_index := IF(@has_username_index = 0, 'CREATE UNIQUE INDEX uq_users_username ON users (username)', 'SELECT 1');
PREPARE stmt FROM @create_username_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS duration VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS status ENUM('ACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT';

CREATE TABLE IF NOT EXISTS payments (
    id CHAR(36) NOT NULL,
    studentId CHAR(36) NOT NULL,
    courseId CHAR(36) NULL,
    batchId CHAR(36) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(20) NOT NULL DEFAULT 'INR',
    installmentNumber INT NOT NULL DEFAULT 1,
    paymentMethod ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE') NOT NULL DEFAULT 'ONLINE',
    status ENUM('PENDING', 'PAID', 'PARTIAL', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PAID',
    paymentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dueDate DATETIME NULL,
    receiptNumber VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    createdBy CHAR(36) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_receiptNumber (receiptNumber),
    KEY idx_payments_studentId (studentId),
    KEY idx_payments_courseId (courseId),
    KEY idx_payments_batchId (batchId),
    KEY idx_payments_createdBy (createdBy),
    CONSTRAINT fk_payments_student FOREIGN KEY (studentId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payments_course FOREIGN KEY (courseId) REFERENCES courses(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_payments_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_payments_creator FOREIGN KEY (createdBy) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('ANNOUNCEMENT', 'NOTIFICATION') NOT NULL DEFAULT 'NOTIFICATION',
    audienceType ENUM('ALL_STUDENTS', 'SELECTED_STUDENTS', 'ALL_TEACHERS', 'SELECTED_TEACHERS', 'ALL_USERS') NOT NULL,
    sendEmail TINYINT(1) NOT NULL DEFAULT 0,
    createdBy CHAR(36) NOT NULL,
    batchId CHAR(36) NULL,
    courseId CHAR(36) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notifications_createdBy (createdBy),
    KEY idx_notifications_batchId (batchId),
    KEY idx_notifications_courseId (courseId),
    CONSTRAINT fk_notifications_creator FOREIGN KEY (createdBy) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_notifications_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_notifications_course FOREIGN KEY (courseId) REFERENCES courses(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_recipients (
    id CHAR(36) NOT NULL,
    notificationId CHAR(36) NOT NULL,
    userId CHAR(36) NOT NULL,
    emailSent TINYINT(1) NOT NULL DEFAULT 0,
    emailSentAt DATETIME NULL,
    readAt DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notification_recipient (notificationId, userId),
    KEY idx_notification_recipients_userId (userId),
    CONSTRAINT fk_notification_recipients_notification FOREIGN KEY (notificationId) REFERENCES notifications(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notification_recipients_user FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE users SET username = 'admin' WHERE email = 'admin@itroots.com' AND (username IS NULL OR username = '');
UPDATE users SET username = 'cmsmanager' WHERE email = 'cms@itroots.com' AND (username IS NULL OR username = '');
UPDATE users SET username = 'teacher', specialization = COALESCE(specialization, 'Full Stack Development') WHERE email = 'teacher@itroots.com' AND (username IS NULL OR username = '');
UPDATE users SET username = 'student' WHERE email = 'student@itroots.com' AND (username IS NULL OR username = '');
UPDATE courses SET status = CASE WHEN isPublished = 1 THEN 'ACTIVE' ELSE 'DRAFT' END WHERE status IS NULL OR status = '';
