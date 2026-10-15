-- OPTIONAL clean-up for Supabase: removes the 13 tables WITHOUT the ysr_nri_wing_ prefix
-- that were created by the first version of schema.sql (members, admins, tickets …).
-- Safety: a table is removed ONLY if it is empty AND has the YSRCP NRI Wing columns.
-- Any table that belongs to another app (different columns, or has data) is left alone and listed as "kept".
-- Run in Supabase → SQL Editor → New query → paste → Ctrl+A → Run. Read the messages under the editor.
DO $$
DECLARE
  t record;
  n bigint;
BEGIN
  -- children first, so foreign keys don't block the parents
  FOR t IN SELECT * FROM (VALUES
      (1,  'rsvps',             'event_id'),
      (2,  'task_done',         'task_id'),
      (3,  'questions',         'hidden'),
      (4,  'ticket_events',     'by_who'),
      (5,  'tickets',           'volunteer_token'),
      (6,  'meet_requests',     'purpose'),
      (7,  'whatsapp_requests', 'chapter'),
      (8,  'country_leaders',   'role'),
      (9,  'social_photos',     'ext_id'),
      (10, 'app_state',         'value'),
      (11, 'volunteers',        'district'),
      (12, 'admins',            'pass_hash'),
      (13, 'members',           'member_no')
    ) AS v(ord, name, col) ORDER BY ord
  LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.name) THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.name AND column_name = t.col) THEN
      RAISE NOTICE 'kept %: not a YSRCP NRI Wing table', t.name;
      CONTINUE;
    END IF;
    EXECUTE format('SELECT COUNT(*) FROM public.%I', t.name) INTO n;
    IF n > 0 THEN
      RAISE NOTICE 'kept %: it has % rows', t.name, n;
      CONTINUE;
    END IF;
    BEGIN
      EXECUTE format('DROP TABLE public.%I', t.name);   -- no CASCADE: never touches other apps' objects
      RAISE NOTICE 'removed %', t.name;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'kept %: %', t.name, SQLERRM;
    END;
  END LOOP;
END $$;
