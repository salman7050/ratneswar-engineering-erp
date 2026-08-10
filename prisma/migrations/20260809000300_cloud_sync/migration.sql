-- Shared cloud sync event bus. It carries no business data; only table name,
-- operation and timestamp so logged-in dashboards know when to refresh.
CREATE TABLE IF NOT EXISTS public.erp_sync_events (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.erp_sync_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'erp_sync_events'
      AND policyname = 'authenticated users can receive erp sync events'
  ) THEN
    CREATE POLICY "authenticated users can receive erp sync events"
      ON public.erp_sync_events
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.emit_erp_sync_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.erp_sync_events(table_name, operation)
  VALUES (TG_TABLE_NAME, TG_OP);

  -- Keep the event bus tiny. Business records are not stored here.
  DELETE FROM public.erp_sync_events
  WHERE created_at < now() - interval '2 days';
  RETURN NULL;
END;
$$;

-- Attach one statement-level trigger to every current public ERP table except
-- the event bus and Prisma migration history.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT IN ('erp_sync_events', '_prisma_migrations')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS erp_cloud_sync_trigger ON public.%I', r.tablename);
    EXECUTE format(
      'CREATE TRIGGER erp_cloud_sync_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.emit_erp_sync_event()',
      r.tablename
    );
  END LOOP;
END $$;

-- Publish only the tiny event table through Supabase Realtime.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'erp_sync_events'
     ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_sync_events';
  END IF;
END $$;
