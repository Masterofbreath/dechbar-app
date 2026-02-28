-- ============================================================
-- Feedback: sekvenční číslo podnětu (#1, #2, #3...)
--
-- Každý podnět dostane unikátní pořadové číslo.
-- Existující záznamy se očíslují chronologicky.
-- Nové záznamy dostanou číslo automaticky ze sekvence.
--
-- @since 2026-02-28
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'user_feedback'
      AND column_name  = 'feedback_number'
  ) THEN
    -- Přidej sloupec (nullable pro teď — backfill níže)
    ALTER TABLE public.user_feedback
      ADD COLUMN feedback_number INTEGER;

    -- Očísluj existující záznamy chronologicky
    WITH numbered AS (
      SELECT id,
             ROW_NUMBER() OVER (ORDER BY created_at ASC)::INTEGER AS rn
      FROM public.user_feedback
    )
    UPDATE public.user_feedback f
       SET feedback_number = n.rn
      FROM numbered n
     WHERE f.id = n.id;

    -- Vytvoř sekvenci navazující za posledním číslem
    EXECUTE format(
      'CREATE SEQUENCE public.feedback_number_seq START %s',
      COALESCE((SELECT MAX(feedback_number) FROM public.user_feedback), 0) + 1
    );

    -- Nastav DEFAULT pro nové řádky
    ALTER TABLE public.user_feedback
      ALTER COLUMN feedback_number
      SET DEFAULT nextval('public.feedback_number_seq');

    -- Unikátní + NOT NULL
    UPDATE public.user_feedback SET feedback_number = nextval('public.feedback_number_seq')
    WHERE feedback_number IS NULL;

    ALTER TABLE public.user_feedback
      ALTER COLUMN feedback_number SET NOT NULL;

    ALTER TABLE public.user_feedback
      ADD CONSTRAINT user_feedback_number_unique UNIQUE (feedback_number);
  END IF;
END $$;
