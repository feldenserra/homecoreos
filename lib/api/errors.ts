import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Turns a PostgREST error into something worth showing a user.
 *
 * Validation that used to live in server actions is now CHECK constraints, and
 * PostgREST reports a 23514 with only the constraint name in the message — so
 * the constraint names are effectively part of the UI contract. Renaming one
 * without updating this map silently downgrades the error to the fallback.
 *
 * RPC errors need no mapping: create_home, join_home and friends raise with
 * `USING ERRCODE = 'PT4xx'`, which PostgREST maps straight to that HTTP status
 * and passes the message through verbatim. Those messages were written to be
 * read by users.
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  home_name_length_check: "Home name must be between 2 and 64 characters.",
  home_code_format_check: "That home code is not valid.",
  home_one_per_creator: "You can only create one home.",
  home_code_key: "Could not create a home. Try again.",
  home_member_role_check: "Invalid member role.",
  task_title_length_check: "Title must be between 1 and 200 characters.",
  task_status_check: "Invalid status.",
  task_position_check: "Invalid position.",
  task_assignee_home_member_fk: "That person is not in this home.",
  task_assignedToUserId_user_id_fk: "That person is not in this home.",
  chat_message_role_check: "Invalid message role.",
  chat_message_content_length_check: "Message is too long.",
  chat_message_content_encrypted_check:
    "Messages must be sent through the chat service.",
  user_ai_key_source_check: "Invalid AI provider.",
  user_ai_key_url_encrypted_check:
    "AI settings must be saved through the AI settings service.",
  user_ai_key_api_key_encrypted_check:
    "AI settings must be saved through the AI settings service.",
  ingredient_name_length_check:
    "Ingredient name must be between 1 and 80 characters.",
  ingredient_serving_size_check: "Serving size cannot be negative.",
  ingredient_calories_check: "Calories cannot be negative.",
  ingredient_carbs_check: "Carbs cannot be negative.",
  ingredient_fats_check: "Fats cannot be negative.",
  ingredient_protein_check: "Protein cannot be negative.",
  recipe_name_length_check: "Recipe name must be between 1 and 120 characters.",
  recipe_ingredient_quantity_check: "Quantity must be greater than zero.",
  recipe_ingredient_recipe_ingredient_key:
    "That ingredient is already on this recipe.",
  grocery_item_name_length_check:
    "Grocery item must be between 1 and 120 characters.",
  grocery_item_quantity_check: "Quantity must be greater than zero.",
  meal_plan_entry_meal_type_check: "Invalid meal type.",
  meal_plan_entry_has_meal_check:
    "Pick a recipe or enter a custom meal name.",
  meal_plan_entry_custom_name_length_check:
    "Meal name must be between 1 and 120 characters.",
};

function constraintName(error: PostgrestError): string | null {
  // PostgREST puts the name in `details` on some versions and inside `message`
  // on others; both forms quote it.
  const haystack = `${error.message ?? ""} ${error.details ?? ""}`;
  const match = haystack.match(/"([a-z0-9_]+)"/gi);
  if (!match) {
    return null;
  }

  for (const quoted of match) {
    const name = quoted.slice(1, -1);
    if (name in CONSTRAINT_MESSAGES) {
      return name;
    }
  }
  return null;
}

export function messageFromError(
  error: PostgrestError | Error | null,
  fallback: string,
): string {
  if (!error) {
    return fallback;
  }

  if ("code" in error && typeof error.code === "string") {
    const postgrest = error as PostgrestError;

    // Our own raises are already user-facing.
    if (postgrest.code.startsWith("PT")) {
      return postgrest.message || fallback;
    }

    if (
      postgrest.code === "23514" ||
      postgrest.code === "23505" ||
      postgrest.code === "23503"
    ) {
      const name = constraintName(postgrest);
      if (name) {
        return CONSTRAINT_MESSAGES[name];
      }
    }

    // Every RLS refusal is 42501, and they are indistinguishable from each
    // other, so it can only ever get a generic message. That is why the RPCs
    // raise PT4xx instead of leaning on RLS for anything a user must read.
    if (postgrest.code === "42501") {
      return "You do not have permission to do that.";
    }
  }

  return fallback;
}
