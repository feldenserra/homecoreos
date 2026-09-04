-- Prepend new tasks at the top of their status column.
--
-- Replaces the previous append (max(position) + 1) so advanced kanban and
-- simple checklist both land new rows at the head of the list.

CREATE OR REPLACE FUNCTION public.create_task(
  p_home_id uuid,
  p_title text,
  p_status text DEFAULT 'not_started',
  p_description text DEFAULT NULL
)
RETURNS public.task
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
SET search_path = ''
AS $$
DECLARE
  v_status text := coalesce(nullif(btrim(coalesce(p_status, '')), ''), 'not_started');
  v_task public.task;
BEGIN
  -- Unknown status falls back rather than erroring, matching createTask.
  IF v_status NOT IN ('not_started', 'in_progress', 'stuck', 'complete') THEN
    v_status := 'not_started';
  END IF;

  UPDATE public.task
  SET position = position + 1
  WHERE "homeId" = p_home_id AND status = v_status;

  INSERT INTO public.task ("homeId", title, description, status, position)
  VALUES (
    p_home_id,
    btrim(coalesce(p_title, '')),
    nullif(btrim(coalesce(p_description, '')), ''),
    v_status,
    0
  )
  RETURNING * INTO v_task;

  RETURN v_task;
END;
$$;
