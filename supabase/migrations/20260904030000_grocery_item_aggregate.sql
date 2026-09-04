-- Grocery aggregation: link items to ingredients and store quantity separately
-- so "Add to Grocery List" from recipes can merge instead of duplicating lines.

ALTER TABLE "grocery_item"
  ADD COLUMN "ingredientId" uuid,
  ADD COLUMN "quantity" numeric DEFAULT '1' NOT NULL;
--> statement-breakpoint

ALTER TABLE "grocery_item"
  ADD CONSTRAINT "grocery_item_quantity_check" CHECK ("quantity" > 0);
--> statement-breakpoint

-- MATCH SIMPLE: a null ingredientId skips the check so manual rows stay valid.
ALTER TABLE "grocery_item" ADD CONSTRAINT "grocery_item_ingredient_home_fk"
  FOREIGN KEY ("ingredientId","homeId") REFERENCES "public"."ingredient"("id","homeId")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Best-effort backfill: peel a trailing " × N" / " x N" from pre-migration
-- display names and move that count into quantity.
UPDATE public.grocery_item
SET
  "quantity" = substring("name" from '(?i)\s*[×x]\s*([0-9]+(?:\.[0-9]+)?)\s*$')::numeric,
  "name" = btrim(regexp_replace("name", '(?i)\s*[×x]\s*[0-9]+(?:\.[0-9]+)?\s*$', ''))
WHERE "name" ~ '(?i)\s*[×x]\s*[0-9]+(?:\.[0-9]+)?\s*$'
  AND btrim(regexp_replace("name", '(?i)\s*[×x]\s*[0-9]+(?:\.[0-9]+)?\s*$', '')) <> ''
  AND substring("name" from '(?i)\s*[×x]\s*([0-9]+(?:\.[0-9]+)?)\s*$')::numeric > 0;
--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
