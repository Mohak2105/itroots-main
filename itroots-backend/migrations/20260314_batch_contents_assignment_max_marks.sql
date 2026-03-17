ALTER TABLE batch_contents
ADD COLUMN IF NOT EXISTS maxMarks INT NULL AFTER contentUrl;

UPDATE batch_contents
SET maxMarks = 100
WHERE type = 'ASSIGNMENT'
  AND (maxMarks IS NULL OR maxMarks <= 0);
