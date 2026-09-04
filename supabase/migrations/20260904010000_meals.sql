-- Meals: ingredients, recipes, grocery list, and weekly meal plan.
--
-- Mirrors src/db/schema.ts. Conventions match the rest of the schema:
-- singular table names, quoted camelCase columns, is_home_member() for RLS,
-- composite FKs so a junction/plan row cannot claim the wrong home.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE "ingredient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"homeId" uuid NOT NULL,
	"name" text NOT NULL,
	"servingSizeGrams" numeric,
	"calories" numeric,
	"carbsGrams" numeric,
	"fatsGrams" numeric,
	"proteinGrams" numeric,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ingredient_id_home_key" UNIQUE("id","homeId"),
	CONSTRAINT "ingredient_name_length_check" CHECK (char_length("name") BETWEEN 1 AND 80),
	CONSTRAINT "ingredient_serving_size_check" CHECK ("servingSizeGrams" IS NULL OR "servingSizeGrams" >= 0),
	CONSTRAINT "ingredient_calories_check" CHECK ("calories" IS NULL OR "calories" >= 0),
	CONSTRAINT "ingredient_carbs_check" CHECK ("carbsGrams" IS NULL OR "carbsGrams" >= 0),
	CONSTRAINT "ingredient_fats_check" CHECK ("fatsGrams" IS NULL OR "fatsGrams" >= 0),
	CONSTRAINT "ingredient_protein_check" CHECK ("proteinGrams" IS NULL OR "proteinGrams" >= 0)
);
--> statement-breakpoint

CREATE TABLE "recipe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"homeId" uuid NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_id_home_key" UNIQUE("id","homeId"),
	CONSTRAINT "recipe_name_length_check" CHECK (char_length("name") BETWEEN 1 AND 120)
);
--> statement-breakpoint

CREATE TABLE "recipe_ingredient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipeId" uuid NOT NULL,
	"ingredientId" uuid NOT NULL,
	"homeId" uuid NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_ingredient_recipe_ingredient_key" UNIQUE("recipeId","ingredientId"),
	CONSTRAINT "recipe_ingredient_quantity_check" CHECK ("quantity" > 0)
);
--> statement-breakpoint

CREATE TABLE "grocery_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"homeId" uuid NOT NULL,
	"name" text NOT NULL,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"weekStartDate" date NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grocery_item_name_length_check" CHECK (char_length("name") BETWEEN 1 AND 120)
);
--> statement-breakpoint

CREATE TABLE "meal_plan_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"homeId" uuid NOT NULL,
	"recipeId" uuid,
	"customName" text,
	"date" date NOT NULL,
	"mealType" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meal_plan_entry_meal_type_check" CHECK ("mealType" IN ('breakfast', 'lunch', 'dinner', 'snack')),
	CONSTRAINT "meal_plan_entry_has_meal_check" CHECK ("recipeId" IS NOT NULL OR "customName" IS NOT NULL),
	CONSTRAINT "meal_plan_entry_custom_name_length_check" CHECK ("customName" IS NULL OR char_length("customName") BETWEEN 1 AND 120)
);
--> statement-breakpoint

ALTER TABLE "ingredient" ADD CONSTRAINT "ingredient_homeId_home_id_fk"
  FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_homeId_home_id_fk"
  FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "grocery_item" ADD CONSTRAINT "grocery_item_homeId_home_id_fk"
  FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_homeId_home_id_fk"
  FOREIGN KEY ("homeId") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Composite FKs keep recipe_ingredient / meal_plan_entry homeId honest.
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_recipe_home_fk"
  FOREIGN KEY ("recipeId","homeId") REFERENCES "public"."recipe"("id","homeId")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_ingredient_home_fk"
  FOREIGN KEY ("ingredientId","homeId") REFERENCES "public"."ingredient"("id","homeId")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- MATCH SIMPLE: a null recipeId skips the check so custom-name-only rows work.
ALTER TABLE "meal_plan_entry" ADD CONSTRAINT "meal_plan_entry_recipe_home_fk"
  FOREIGN KEY ("recipeId","homeId") REFERENCES "public"."recipe"("id","homeId")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

CREATE INDEX "ingredient_home_name_idx" ON "ingredient" USING btree ("homeId","name");
--> statement-breakpoint
CREATE INDEX "recipe_home_name_idx" ON "recipe" USING btree ("homeId","name");
--> statement-breakpoint
CREATE INDEX "recipe_ingredient_recipe_idx" ON "recipe_ingredient" USING btree ("recipeId");
--> statement-breakpoint
CREATE INDEX "grocery_item_home_week_completed_idx" ON "grocery_item" USING btree ("homeId","weekStartDate","isCompleted");
--> statement-breakpoint
CREATE INDEX "meal_plan_entry_home_date_idx" ON "meal_plan_entry" USING btree ("homeId","date");
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Immutable-column guards
-- ---------------------------------------------------------------------------

CREATE TRIGGER ingredient_guard_immutable BEFORE UPDATE ON public.ingredient
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'homeId', 'createdAt');
--> statement-breakpoint

CREATE TRIGGER recipe_guard_immutable BEFORE UPDATE ON public.recipe
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'homeId', 'createdAt');
--> statement-breakpoint

CREATE TRIGGER recipe_ingredient_guard_immutable BEFORE UPDATE ON public.recipe_ingredient
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'recipeId', 'ingredientId', 'homeId', 'createdAt');
--> statement-breakpoint

CREATE TRIGGER grocery_item_guard_immutable BEFORE UPDATE ON public.grocery_item
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'homeId', 'weekStartDate', 'createdAt');
--> statement-breakpoint

CREATE TRIGGER meal_plan_entry_guard_immutable BEFORE UPDATE ON public.meal_plan_entry
  FOR EACH ROW EXECUTE FUNCTION public.guard_immutable_columns(
    'id', 'homeId', 'createdAt');
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.ingredient ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.recipe ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.recipe_ingredient ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.grocery_item ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.meal_plan_entry ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY ingredient_select ON public.ingredient FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY ingredient_insert ON public.ingredient FOR INSERT TO authenticated
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY ingredient_update ON public.ingredient FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY ingredient_delete ON public.ingredient FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint

CREATE POLICY recipe_select ON public.recipe FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY recipe_insert ON public.recipe FOR INSERT TO authenticated
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY recipe_update ON public.recipe FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY recipe_delete ON public.recipe FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint

CREATE POLICY recipe_ingredient_select ON public.recipe_ingredient FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY recipe_ingredient_insert ON public.recipe_ingredient FOR INSERT TO authenticated
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY recipe_ingredient_update ON public.recipe_ingredient FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY recipe_ingredient_delete ON public.recipe_ingredient FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint

CREATE POLICY grocery_item_select ON public.grocery_item FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY grocery_item_insert ON public.grocery_item FOR INSERT TO authenticated
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY grocery_item_update ON public.grocery_item FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY grocery_item_delete ON public.grocery_item FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint

CREATE POLICY meal_plan_entry_select ON public.meal_plan_entry FOR SELECT TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY meal_plan_entry_insert ON public.meal_plan_entry FOR INSERT TO authenticated
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY meal_plan_entry_update ON public.meal_plan_entry FOR UPDATE TO authenticated
  USING (public.is_home_member("homeId"))
  WITH CHECK (public.is_home_member("homeId"));
--> statement-breakpoint
CREATE POLICY meal_plan_entry_delete ON public.meal_plan_entry FOR DELETE TO authenticated
  USING (public.is_home_member("homeId"));
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
--
-- The init migration granted SELECT/INSERT/UPDATE/DELETE ON ALL TABLES to
-- authenticated and revoked ALL from anon. New tables inherit only if the
-- grants used ALTER DEFAULT PRIVILEGES; they did not, so grant explicitly.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.ingredient,
  public.recipe,
  public.recipe_ingredient,
  public.grocery_item,
  public.meal_plan_entry
TO authenticated;
--> statement-breakpoint

REVOKE ALL ON TABLE
  public.ingredient,
  public.recipe,
  public.recipe_ingredient,
  public.grocery_item,
  public.meal_plan_entry
FROM anon;
--> statement-breakpoint

NOTIFY pgrst, 'reload schema';
