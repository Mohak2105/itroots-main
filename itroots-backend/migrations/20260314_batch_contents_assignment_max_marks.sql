SET @has_batch_contents_max_marks_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'batch_contents' AND column_name = 'maxMarks'
);
SET @alter_batch_contents_max_marks := IF(
    @has_batch_contents_max_marks_column = 0,
    'ALTER TABLE batch_contents ADD COLUMN maxMarks INT NULL AFTER contentUrl',
    'SELECT 1'
);
PREPARE stmt FROM @alter_batch_contents_max_marks;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE batch_contents
SET maxMarks = 100
WHERE type = 'ASSIGNMENT'
  AND (maxMarks IS NULL OR maxMarks <= 0);
