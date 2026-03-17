-- Create storage bucket for track media (audio, images)
INSERT INTO storage.buckets (id, name, public) VALUES ('track-media', 'track-media', true);

-- Allow authenticated users to upload to track-media
CREATE POLICY "Authenticated users can upload track media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'track-media');

-- Allow public read access to track-media
CREATE POLICY "Public read access to track media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'track-media');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete track media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'track-media');

-- Allow authenticated users to update track media
CREATE POLICY "Authenticated users can update track media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'track-media');