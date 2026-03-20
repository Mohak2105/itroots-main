-- Run this on existing databases where test_results already exists.
-- For fresh installs, schema.sql already contains these fields.

SET @has_test_results_correct_answers_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'test_results' AND column_name = 'correctAnswers'
);
SET @alter_test_results_correct_answers := IF(
    @has_test_results_correct_answers_column = 0,
    'ALTER TABLE test_results ADD COLUMN correctAnswers INT NOT NULL DEFAULT 0 AFTER completionTime',
    'SELECT 1'
);
PREPARE stmt FROM @alter_test_results_correct_answers;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_test_results_wrong_answers_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'test_results' AND column_name = 'wrongAnswers'
);
SET @alter_test_results_wrong_answers := IF(
    @has_test_results_wrong_answers_column = 0,
    'ALTER TABLE test_results ADD COLUMN wrongAnswers INT NOT NULL DEFAULT 0 AFTER correctAnswers',
    'SELECT 1'
);
PREPARE stmt FROM @alter_test_results_wrong_answers;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_test_results_unanswered_questions_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'test_results' AND column_name = 'unansweredQuestions'
);
SET @alter_test_results_unanswered_questions := IF(
    @has_test_results_unanswered_questions_column = 0,
    'ALTER TABLE test_results ADD COLUMN unansweredQuestions INT NOT NULL DEFAULT 0 AFTER wrongAnswers',
    'SELECT 1'
);
PREPARE stmt FROM @alter_test_results_unanswered_questions;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_test_results_percentage_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'test_results' AND column_name = 'percentage'
);
SET @alter_test_results_percentage := IF(
    @has_test_results_percentage_column = 0,
    'ALTER TABLE test_results ADD COLUMN percentage INT NOT NULL DEFAULT 0 AFTER unansweredQuestions',
    'SELECT 1'
);
PREPARE stmt FROM @alter_test_results_percentage;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_test_results_auto_submitted_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'test_results' AND column_name = 'autoSubmitted'
);
SET @alter_test_results_auto_submitted := IF(
    @has_test_results_auto_submitted_column = 0,
    'ALTER TABLE test_results ADD COLUMN autoSubmitted TINYINT(1) NOT NULL DEFAULT 0 AFTER percentage',
    'SELECT 1'
);
PREPARE stmt FROM @alter_test_results_auto_submitted;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_test_results_violation_reason_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'test_results' AND column_name = 'violationReason'
);
SET @alter_test_results_violation_reason := IF(
    @has_test_results_violation_reason_column = 0,
    'ALTER TABLE test_results ADD COLUMN violationReason VARCHAR(100) NULL AFTER autoSubmitted',
    'SELECT 1'
);
PREPARE stmt FROM @alter_test_results_violation_reason;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_test_results_unique_index := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'test_results' AND index_name = 'uq_test_results_student_test'
);
SET @create_test_results_unique_index := IF(
    @has_test_results_unique_index = 0,
    'ALTER TABLE test_results ADD UNIQUE INDEX uq_test_results_student_test (studentId, testId)',
    'SELECT 1'
);
PREPARE stmt FROM @create_test_results_unique_index;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
