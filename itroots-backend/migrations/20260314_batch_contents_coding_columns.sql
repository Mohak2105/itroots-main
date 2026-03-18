ALTER TABLE batch_contents
    MODIFY COLUMN type ENUM('VIDEO', 'ASSIGNMENT', 'RESOURCE', 'CODING') NOT NULL;

SET @has_batch_contents_coding_language_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'batch_contents' AND column_name = 'codingLanguage'
);
SET @alter_batch_contents_coding_language := IF(
    @has_batch_contents_coding_language_column = 0,
    'ALTER TABLE batch_contents ADD COLUMN codingLanguage VARCHAR(100) NULL AFTER contentUrl',
    'SELECT 1'
);
PREPARE stmt FROM @alter_batch_contents_coding_language;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_batch_contents_starter_code_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'batch_contents' AND column_name = 'starterCode'
);
SET @alter_batch_contents_starter_code := IF(
    @has_batch_contents_starter_code_column = 0,
    'ALTER TABLE batch_contents ADD COLUMN starterCode TEXT NULL AFTER codingLanguage',
    'SELECT 1'
);
PREPARE stmt FROM @alter_batch_contents_starter_code;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_batch_contents_coding_instructions_column := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'batch_contents' AND column_name = 'codingInstructions'
);
SET @alter_batch_contents_coding_instructions := IF(
    @has_batch_contents_coding_instructions_column = 0,
    'ALTER TABLE batch_contents ADD COLUMN codingInstructions TEXT NULL AFTER starterCode',
    'SELECT 1'
);
PREPARE stmt FROM @alter_batch_contents_coding_instructions;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
