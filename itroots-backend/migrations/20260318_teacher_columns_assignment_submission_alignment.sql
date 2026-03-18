USE itroots_db;

SET @has_batches_teacher_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'teacherId'
);
SET @alter_batches_teacher := IF(@has_batches_teacher_column = 0, 'ALTER TABLE batches ADD COLUMN teacherId CHAR(36) NULL', 'SELECT 1');
PREPARE stmt FROM @alter_batches_teacher;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_batches_faculty_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'batches' AND column_name = 'FacultyId'
);
SET @backfill_batches_teacher := IF(
    @has_batches_faculty_column = 1,
    'UPDATE batches SET teacherId = COALESCE(teacherId, FacultyId) WHERE teacherId IS NULL AND FacultyId IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @backfill_batches_teacher;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_live_classes_teacher_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'live_classes' AND column_name = 'teacherId'
);
SET @alter_live_classes_teacher := IF(@has_live_classes_teacher_column = 0, 'ALTER TABLE live_classes ADD COLUMN teacherId CHAR(36) NULL', 'SELECT 1');
PREPARE stmt FROM @alter_live_classes_teacher;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_live_classes_faculty_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'live_classes' AND column_name = 'FacultyId'
);
SET @backfill_live_classes_teacher := IF(
    @has_live_classes_faculty_column = 1,
    'UPDATE live_classes SET teacherId = COALESCE(teacherId, FacultyId) WHERE teacherId IS NULL AND FacultyId IS NOT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @backfill_live_classes_teacher;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_assignment_submissions_submitted_code_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'assignment_submissions' AND column_name = 'submittedCode'
);
SET @alter_assignment_submissions_submitted_code := IF(
    @has_assignment_submissions_submitted_code_column = 0,
    'ALTER TABLE assignment_submissions ADD COLUMN submittedCode TEXT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @alter_assignment_submissions_submitted_code;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_assignment_submissions_coding_language_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'assignment_submissions' AND column_name = 'codingLanguage'
);
SET @alter_assignment_submissions_coding_language := IF(
    @has_assignment_submissions_coding_language_column = 0,
    'ALTER TABLE assignment_submissions ADD COLUMN codingLanguage VARCHAR(100) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @alter_assignment_submissions_coding_language;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
