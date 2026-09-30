INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
    'office-intelligence-uploads',
    'office-intelligence-uploads',
    false,
    52428800
)
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    public = false,
    file_size_limit = EXCLUDED.file_size_limit;