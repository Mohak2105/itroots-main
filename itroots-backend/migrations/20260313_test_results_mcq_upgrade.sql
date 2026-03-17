-- Run this on existing databases where test_results already exists.
-- For fresh installs, schema.sql already contains these fields.

ALTER TABLE test_results
    ADD COLUMN IF NOT EXISTS correctAnswers INT NOT NULL DEFAULT 0 AFTER completionTime,
    ADD COLUMN IF NOT EXISTS wrongAnswers INT NOT NULL DEFAULT 0 AFTER correctAnswers,
    ADD COLUMN IF NOT EXISTS unansweredQuestions INT NOT NULL DEFAULT 0 AFTER wrongAnswers,
    ADD COLUMN IF NOT EXISTS percentage INT NOT NULL DEFAULT 0 AFTER unansweredQuestions,
    ADD COLUMN IF NOT EXISTS autoSubmitted TINYINT(1) NOT NULL DEFAULT 0 AFTER percentage,
    ADD COLUMN IF NOT EXISTS violationReason VARCHAR(100) NULL AFTER autoSubmitted;

ALTER TABLE test_results
    ADD UNIQUE INDEX uq_test_results_student_test (studentId, testId);
