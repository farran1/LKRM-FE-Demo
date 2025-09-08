-- Enable pg_cron if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Helper to resolve auth.users.id from a text identifier (UUID string or email)
CREATE OR REPLACE FUNCTION public.resolve_user_id(identifier text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE u.id::text = identifier OR u.email = identifier
  LIMIT 1;
$$;

-- Task due notifications: create once per day per user
CREATE OR REPLACE FUNCTION public.create_task_due_notifications()
RETURNS void
LANGUAGE sql
VOLATILE
AS $$
  WITH assignees AS (
    SELECT t."userId" AS task_pk,
           t."assigneeId" AS assignee_identifier,
           t."name" AS task_name,
           t."dueDate"::timestamptz AS due_at,
           public.resolve_user_id(t."assigneeId") AS uid
    FROM public.tasks t
    WHERE t."assigneeId" IS NOT NULL
      AND t."dueDate" IS NOT NULL
      AND (t."dueDate"::date = current_date OR t."dueDate"::date = current_date + 1)
  ), to_insert AS (
    SELECT uid
    FROM assignees
    WHERE uid IS NOT NULL
  )
  INSERT INTO public.mention_notifications (user_id, note_id, mentioned_by, is_read, created_at)
  SELECT uid, NULL, NULL, false, now()
  FROM to_insert ti
  WHERE NOT EXISTS (
    SELECT 1 FROM public.mention_notifications mn
    WHERE mn.user_id = ti.uid
      AND mn.note_id IS NULL
      AND mn.mentioned_by IS NULL
      AND mn.created_at::date = current_date
  );
$$;

-- Event 30-minute reminders for Practice/Meeting event types
CREATE OR REPLACE FUNCTION public.create_event_30min_notifications()
RETURNS void
LANGUAGE sql
VOLATILE
AS $$
  WITH target_events AS (
    SELECT e.id, e."startTime"
    FROM public.events e
    JOIN public.event_types et ON et.id = e."eventTypeId"
    WHERE e."startTime" BETWEEN (now() + interval '30 minutes') AND (now() + interval '31 minutes')
      AND et.name IN ('Practice','Meeting')
  ), attendees AS (
    SELECT te.id AS event_id,
           ec."coachUsername" AS coach_identifier,
           public.resolve_user_id(ec."coachUsername") AS uid
    FROM target_events te
    JOIN public.event_coaches ec ON ec."eventId" = te.id
  ), to_insert AS (
    SELECT uid FROM attendees WHERE uid IS NOT NULL
  )
  INSERT INTO public.mention_notifications (user_id, note_id, mentioned_by, is_read, created_at)
  SELECT uid, NULL, NULL, false, now()
  FROM to_insert ti
  WHERE NOT EXISTS (
    SELECT 1 FROM public.mention_notifications mn
    WHERE mn.user_id = ti.uid
      AND mn.note_id IS NULL
      AND mn.mentioned_by IS NULL
      AND mn.created_at > now() - interval '45 minutes'
  );
$$;

-- Schedule jobs (times are in UTC) if pg_cron is available
DO $$
BEGIN
  PERFORM 1 FROM pg_proc WHERE proname = 'cron_schedule';
  IF FOUND THEN
    -- Daily at 12:00 UTC (adjust as needed)
    PERFORM cron.schedule('task_due_daily_morning', '0 12 * * *', 'SELECT public.create_task_due_notifications();');
    -- Every minute to catch events 30 minutes ahead
    PERFORM cron.schedule('event_30min_notify', '* * * * *', 'SELECT public.create_event_30min_notifications();');
  END IF;
END $$;


