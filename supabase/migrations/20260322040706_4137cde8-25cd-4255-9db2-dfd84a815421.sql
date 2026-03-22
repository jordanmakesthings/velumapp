CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
SELECT cron.schedule(
  'daily-reminder-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://icwcszaasekfhzpxrxzd.supabase.co/functions/v1/daily-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2NzemFhc2VrZmh6cHhyeHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NzkyMzYsImV4cCI6MjA4OTM1NTIzNn0.LEe6CDjMSdXJ-ueDqAYYwSvruTzduOibSA1cf5ZvG6c"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
