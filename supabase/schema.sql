-- Run this once in the Supabase SQL Editor for the project connected to Vercel.
CREATE TABLE IF NOT EXISTS public.lantern_wishes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wish text NOT NULL CHECK (char_length(wish) BETWEEN 1 AND 100),
  x double precision NOT NULL CHECK (x BETWEEN 22 AND 96),
  rest double precision NOT NULL CHECK (rest BETWEEN 68 AND 93),
  size integer NOT NULL CHECK (size BETWEEN 34 AND 48),
  sway double precision NOT NULL CHECK (sway BETWEEN 4 AND 6),
  delay double precision NOT NULL DEFAULT 0 CHECK (delay BETWEEN -3 AND 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lantern_wishes ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.lantern_wishes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.lantern_wishes_id_seq TO service_role;

-- Realtime subscribers use the public/anon role, so permit read-only visibility
-- of wishes. Inserts still go through the server API using its private secret key.
GRANT SELECT ON TABLE public.lantern_wishes TO anon;
DROP POLICY IF EXISTS "Anyone can read lantern wishes" ON public.lantern_wishes;
CREATE POLICY "Anyone can read lantern wishes"
  ON public.lantern_wishes FOR SELECT TO anon USING (true);

-- Enable live INSERT events for this table. This is safe to run more than once.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'lantern_wishes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lantern_wishes;
  END IF;
END
$$;
