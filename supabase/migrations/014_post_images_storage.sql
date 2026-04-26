-- ============================================================
-- Migration 014: post-images Storage Bucket
--
-- STEP 1 — Dashboard (cannot be done in SQL):
--   Open Supabase Dashboard → Storage → New bucket
--   Name:               post-images
--   Public bucket:      ON  (public read access for all post images)
--   File size limit:    10MB
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   → Click Create
--
-- STEP 2 — Run the SQL below in SQL Editor after creating the bucket.
-- ============================================================

-- ── RLS policies on storage.objects ──────────────────────────
-- storage.objects RLS is enabled by Supabase by default.
-- File path convention: {user_id}/{post_id}.jpg

-- Anyone can read post images (posts are public).
DROP POLICY IF EXISTS "post_images_public_read" ON storage.objects;
CREATE POLICY "post_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- Authenticated users can only write to their own user_id folder.
-- (storage.foldername(name))[1] returns the first path segment.
-- File path: {user_id}/{post_id}.jpg → first segment = user_id.
DROP POLICY IF EXISTS "post_images_authenticated_insert" ON storage.objects;
CREATE POLICY "post_images_authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only delete their own images.
DROP POLICY IF EXISTS "post_images_owner_delete" ON storage.objects;
CREATE POLICY "post_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
