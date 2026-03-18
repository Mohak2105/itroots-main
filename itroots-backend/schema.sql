-- ITROOTS MySQL schema
--
-- MySQL Workbench connection:
--   Host: localhost
--   Port: 3306
--   Username: root
--   Password: Mohak@664252
--
-- Usage in MySQL Workbench:
-- 1. Connect to your local MySQL server.
-- 2. Run this file once to create the database and tables.
-- 3. Refresh the schemas list and open `itroots_db`.

CREATE DATABASE IF NOT EXISTS itroots_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE itroots_db;

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL,
    username VARCHAR(255) NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NULL,
    profileImage VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('SUPER_ADMIN', 'CMS_MANAGER', 'Faculty', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    specialization VARCHAR(255) NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS placements (
    id CHAR(36) NOT NULL,
    studentName VARCHAR(255) NOT NULL,
    companyName VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    image VARCHAR(255) NULL,
    testimonial TEXT NULL,
    year INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
    id CHAR(36) NOT NULL,
    type ENUM('contact', 'enrollment', 'hire') NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    company VARCHAR(255) NULL,
    course VARCHAR(255) NULL,
    subject VARCHAR(255) NULL,
    roles VARCHAR(255) NULL,
    hiringVolume VARCHAR(255) NULL,
    experienceLevel VARCHAR(255) NULL,
    message TEXT NULL,
    status ENUM('pending', 'contacted', 'converted', 'rejected') NOT NULL DEFAULT 'pending',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_leads_type (type),
    KEY idx_leads_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    thumbnail VARCHAR(255) NULL,
    slug VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duration VARCHAR(255) NULL,
    category VARCHAR(255) NULL,
    status ENUM('ACTIVE', 'DRAFT', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    isPublished TINYINT(1) NOT NULL DEFAULT 0,
    instructorId CHAR(36) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_courses_slug (slug),
    KEY idx_courses_instructorId (instructorId),
    CONSTRAINT fk_courses_instructor FOREIGN KEY (instructorId) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS batches (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    courseId CHAR(36) NOT NULL,
    FacultyId CHAR(36) NOT NULL,
    schedule VARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_batches_courseId (courseId),
    KEY idx_batches_FacultyId (FacultyId),
    CONSTRAINT fk_batches_course FOREIGN KEY (courseId) REFERENCES courses(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_batches_Faculty FOREIGN KEY (FacultyId) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
    id CHAR(36) NOT NULL,
    studentId CHAR(36) NOT NULL,
    batchId CHAR(36) NOT NULL,
    enrollmentDate DATE NOT NULL,
    status ENUM('ACTIVE', 'COMPLETED', 'DROPPED') NOT NULL DEFAULT 'ACTIVE',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_enrollments_student_batch (studentId, batchId),
    KEY idx_enrollments_batchId (batchId),
    CONSTRAINT fk_enrollments_student FOREIGN KEY (studentId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_enrollments_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS batch_contents (
    id CHAR(36) NOT NULL,
    batchId CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type ENUM('VIDEO', 'ASSIGNMENT', 'RESOURCE', 'CODING') NOT NULL,
    contentUrl VARCHAR(255) NOT NULL,
    maxMarks INT NULL,
    codingLanguage VARCHAR(100) NULL,
    starterCode TEXT NULL,
    codingInstructions TEXT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_batch_contents_batchId (batchId),
    CONSTRAINT fk_batch_contents_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tests (
    id CHAR(36) NOT NULL,
    batchId CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    totalMarks INT NOT NULL DEFAULT 100,
    durationMinutes INT NOT NULL DEFAULT 60,
    questions JSON NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tests_batchId (batchId),
    CONSTRAINT fk_tests_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_results (
    id CHAR(36) NOT NULL,
    studentId CHAR(36) NOT NULL,
    testId CHAR(36) NOT NULL,
    score INT NOT NULL,
    completionTime INT NOT NULL,
    correctAnswers INT NOT NULL DEFAULT 0,
    wrongAnswers INT NOT NULL DEFAULT 0,
    unansweredQuestions INT NOT NULL DEFAULT 0,
    percentage INT NOT NULL DEFAULT 0,
    autoSubmitted TINYINT(1) NOT NULL DEFAULT 0,
    violationReason VARCHAR(100) NULL,
    submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_test_results_student_test (studentId, testId),
    KEY idx_test_results_studentId (studentId),
    KEY idx_test_results_testId (testId),
    CONSTRAINT fk_test_results_student FOREIGN KEY (studentId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_test_results_test FOREIGN KEY (testId) REFERENCES tests(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id CHAR(36) NOT NULL,
    studentId CHAR(36) NOT NULL,
    assignmentId CHAR(36) NOT NULL,
    batchId CHAR(36) NOT NULL,
    fileUrl VARCHAR(255) NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    notes TEXT NULL,
    status ENUM('SUBMITTED', 'REVIEWED') NOT NULL DEFAULT 'SUBMITTED',
    grade INT NULL,
    feedback TEXT NULL,
    submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_assignment_submission_student_assignment (studentId, assignmentId),
    KEY idx_assignment_submissions_assignmentId (assignmentId),
    KEY idx_assignment_submissions_batchId (batchId),
    CONSTRAINT fk_assignment_submissions_student FOREIGN KEY (studentId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assignment_submissions_assignment FOREIGN KEY (assignmentId) REFERENCES batch_contents(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_assignment_submissions_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attendance (
    id CHAR(36) NOT NULL,
    studentId CHAR(36) NOT NULL,
    batchId CHAR(36) NOT NULL,
    date DATE NOT NULL,
    status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL DEFAULT 'PRESENT',
    remarks VARCHAR(255) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendance_student_batch_date (studentId, batchId, date),
    KEY idx_attendance_batchId (batchId),
    CONSTRAINT fk_attendance_student FOREIGN KEY (studentId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_attendance_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS announcements (
    id CHAR(36) NOT NULL,
    batchId CHAR(36) NULL,
    authorId CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') NOT NULL DEFAULT 'NORMAL',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_announcements_batchId (batchId),
    KEY idx_announcements_authorId (authorId),
    CONSTRAINT fk_announcements_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_announcements_author FOREIGN KEY (authorId) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS live_classes (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    courseId CHAR(36) NOT NULL,
    batchId CHAR(36) NOT NULL,
    FacultyId CHAR(36) NOT NULL,
    scheduledAt DATETIME NOT NULL,
    meetingLink VARCHAR(255) NOT NULL,
    description TEXT NULL,
    status ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_live_classes_courseId (courseId),
    KEY idx_live_classes_batchId (batchId),
    KEY idx_live_classes_FacultyId (FacultyId),
    KEY idx_live_classes_scheduledAt (scheduledAt),
    CONSTRAINT fk_live_classes_course FOREIGN KEY (courseId) REFERENCES courses(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_live_classes_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_live_classes_Faculty FOREIGN KEY (FacultyId) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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


CREATE TABLE IF NOT EXISTS certificates (
    id CHAR(36) NOT NULL,
    certificateNumber VARCHAR(255) NOT NULL,
    studentId CHAR(36) NOT NULL,
    courseId CHAR(36) NOT NULL,
    batchId CHAR(36) NULL,
    duration VARCHAR(255) NOT NULL,
    signatoryName VARCHAR(255) NOT NULL,
    signatoryTitle VARCHAR(255) NULL,
    issueDate DATE NOT NULL,
    createdBy CHAR(36) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_certificates_number (certificateNumber),
    UNIQUE KEY uq_certificates_student_course (studentId, courseId),
    KEY idx_certificates_courseId (courseId),
    KEY idx_certificates_batchId (batchId),
    KEY idx_certificates_createdBy (createdBy),
    CONSTRAINT fk_certificates_student FOREIGN KEY (studentId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_certificates_course FOREIGN KEY (courseId) REFERENCES courses(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_certificates_batch FOREIGN KEY (batchId) REFERENCES batches(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_certificates_creator FOREIGN KEY (createdBy) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('ANNOUNCEMENT', 'NOTIFICATION', 'REMINDER', 'ALERT', 'PLACEMENT', 'FEES') NOT NULL DEFAULT 'NOTIFICATION',
    audienceType ENUM('ALL_STUDENTS', 'SELECTED_STUDENTS', 'ALL_Faculty', 'SELECTED_Faculty', 'ALL_USERS', 'SELECTED_BATCH', 'SELECTED_BATCH_STUDENTS', 'SELECTED_BATCH_Faculty', 'SELECTED_COURSE', 'SELECTED_COURSE_STUDENTS', 'SELECTED_COURSE_Faculty') NOT NULL,
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



ALTER TABLE notifications
MODIFY COLUMN type ENUM('ANNOUNCEMENT', 'NOTIFICATION', 'REMINDER', 'ALERT', 'PLACEMENT', 'FEES') NOT NULL DEFAULT 'NOTIFICATION';

ALTER TABLE notifications
MODIFY COLUMN audienceType ENUM('ALL_STUDENTS', 'SELECTED_STUDENTS', 'ALL_Faculty', 'SELECTED_Faculty', 'ALL_USERS', 'SELECTED_BATCH', 'SELECTED_BATCH_STUDENTS', 'SELECTED_BATCH_Faculty', 'SELECTED_COURSE', 'SELECTED_COURSE_STUDENTS', 'SELECTED_COURSE_Faculty') NOT NULL;
