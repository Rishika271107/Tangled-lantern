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
