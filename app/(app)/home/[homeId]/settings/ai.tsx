import { useCallback, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  Card,
  DisplayTitle,
  ErrorText,
  LoadingScreen,
  Muted,
  Screen,
} from "../../../../../components/ui";
import { useAsync } from "../../../../../hooks/use-async";
import {
  deleteAiKey,
  listAiKeys,
  saveAiKey,
  type AiKeyListItem,
} from "../../../../../lib/api/ai-keys";
import {
  AI_KEY_SOURCE_LABELS,
  AI_KEY_SOURCES,
  type AiKeySource,
} from "../../../../../lib/types";
import {
  colors,
  INPUT_FONT_SIZE,
  TOUCH_TARGET,
} from "../../../../../theme/tokens";

/**
 * Per-user AI provider credentials. Replaces components/chat/ai-settings.tsx.
 *
 * A route rather than a Mantine Modal, presented modally by the [homeId] stack.
 * The list/form mode switch is kept — one provider per source, add or edit one
 * at a time.
 *
 * The stored API key is never returned by the Edge Function, only `hasApiKey`.
 * So editing a Cloudflare entry starts with a blank key field, and leaving it
 * blank keeps the existing one.
 */
export default function AiSettingsScreen() {
  const state = useAsync(async () => await listAiKeys(), []);

  const [mode, setMode] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState<AiKeySource>("ollama");
  const [url, setUrl] = useState("");
  const [model, setModel] = useState("");
  const [accountId, setAccountId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const keys = state.data ?? [];
  const usedSources = new Set(keys.map((key) => key.source));
  const availableSources = AI_KEY_SOURCES.filter(
    (candidate) => !usedSources.has(candidate),
  );

  const backToList = useCallback(() => {
    setMode("list");
    setEditing(false);
    setActionError(null);
    setApiKey("");
  }, []);

  const openAdd = useCallback(() => {
    setSource(availableSources[0] ?? "ollama");
    setUrl("");
    setModel("");
    setAccountId("");
    setApiKey("");
    setEditing(false);
    setActionError(null);
    setMode("form");
  }, [availableSources]);

  const openEdit = useCallback((key: AiKeyListItem) => {
    setSource(key.source);
    setUrl(key.url ?? "");
    setModel(key.model ?? "");
    setAccountId(key.accountId ?? "");
    setApiKey("");
    setEditing(true);
    setActionError(null);
    setMode("form");
  }, []);

  const save = useCallback(async () => {
    setActionError(null);
    setPending(true);
    try {
      await saveAiKey({ source, url, model, accountId, apiKey });
      await state.refresh();
      backToList();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not save AI settings.",
      );
    } finally {
      setPending(false);
    }
  }, [accountId, apiKey, backToList, model, source, state, url]);

  const remove = useCallback(
    async (key: AiKeyListItem) => {
      setActionError(null);
      setPending(true);
      try {
        await deleteAiKey(key.source);
        await state.refresh();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Could not remove AI setting.",
        );
      } finally {
        setPending(false);
      }
    },
    [state],
  );

  const confirmRemove = useCallback(
    (key: AiKeyListItem) => {
      const message = `Remove the ${AI_KEY_SOURCE_LABELS[key.source]} setting? You can add it again later.`;

      if (Platform.OS === "web") {
        // eslint-disable-next-line no-alert
        if (globalThis.confirm?.(message)) {
          void remove(key);
        }
        return;
      }

      Alert.alert("Remove AI setting", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void remove(key),
        },
      ]);
    },
    [remove],
  );

  if (state.loading && !state.data) {
    return <LoadingScreen />;
  }

  return (
    <Screen scroll style={styles.screen}>
      <ErrorText>{state.error ?? actionError}</ErrorText>

      {mode === "list" ? (
        <>
          {keys.length === 0 ? (
            <Muted>No AI providers saved yet. Add Ollama or Cloudflare.</Muted>
          ) : (
            keys.map((key) => (
              <Card key={key.id}>
                <Text style={styles.rowTitle}>
                  {AI_KEY_SOURCE_LABELS[key.source]}
                </Text>
                <Muted>
                  {key.source === "ollama"
                    ? `${key.model ?? ""}${key.url ? ` · ${key.url}` : ""}`
                    : `${key.model ?? ""}${key.accountId ? ` · ${key.accountId}` : ""}`}
                </Muted>
                <View style={styles.rowActions}>
                  <Button
                    mode="text"
                    compact
                    textColor={colors.muted}
                    disabled={pending}
                    onPress={() => openEdit(key)}
                  >
                    Edit
                  </Button>
                  <Button
                    mode="text"
                    compact
                    textColor={colors.muted}
                    disabled={pending}
                    onPress={() => confirmRemove(key)}
                  >
                    Remove
                  </Button>
                </View>
              </Card>
            ))
          )}

          {availableSources.length > 0 ? (
            <Button
              mode="contained-tonal"
              disabled={pending}
              onPress={openAdd}
              style={styles.button}
            >
              Add
            </Button>
          ) : null}
        </>
      ) : (
        <View style={styles.form}>
          {editing || availableSources.length <= 1 ? (
            <DisplayTitle size={20}>
              {AI_KEY_SOURCE_LABELS[source]}
            </DisplayTitle>
          ) : (
            <View style={styles.sourceRow}>
              {availableSources.map((candidate) => (
                <Pressable
                  key={candidate}
                  accessibilityRole="button"
                  onPress={() => setSource(candidate)}
                  style={({ pressed }) => [
                    styles.sourceChip,
                    source === candidate && styles.sourceChipActive,
                    pressed && styles.sourceChipPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.sourceChipText,
                      source === candidate && styles.sourceChipTextActive,
                    ]}
                  >
                    {AI_KEY_SOURCE_LABELS[candidate]}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {source === "ollama" ? (
            <>
              <TextInput
                label="URL"
                value={url}
                onChangeText={setUrl}
                mode="outlined"
                placeholder="https://ollama.example.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.input}
              />
              <Muted>
                Must be reachable from the internet over https. A LAN address
                will not work: the chat runs as a Supabase Edge Function, which
                cannot route to your local network.
              </Muted>
              <TextInput
                label="Model"
                value={model}
                onChangeText={setModel}
                mode="outlined"
                placeholder="llama3.2"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </>
          ) : (
            <>
              <TextInput
                label="Account ID"
                value={accountId}
                onChangeText={setAccountId}
                mode="outlined"
                placeholder="Cloudflare account ID"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <TextInput
                label="Model"
                value={model}
                onChangeText={setModel}
                mode="outlined"
                placeholder="@cf/meta/llama-3.1-8b-instruct"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <TextInput
                label="API key"
                value={apiKey}
                onChangeText={setApiKey}
                mode="outlined"
                placeholder={
                  editing ? "Leave blank to keep the current key" : ""
                }
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              {editing ? (
                <Muted>Leave blank to keep the current key.</Muted>
              ) : null}
            </>
          )}

          <View style={styles.formActions}>
            <Button
              mode="text"
              textColor={colors.muted}
              disabled={pending}
              onPress={backToList}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              loading={pending}
              disabled={pending}
              onPress={save}
            >
              Save
            </Button>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
  },
  form: { gap: 12 },
  sourceRow: {
    flexDirection: "row",
    gap: 8,
  },
  sourceChip: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  sourceChipActive: {
    backgroundColor: colors.claySoft,
    borderColor: colors.clay,
  },
  sourceChipPressed: { opacity: 0.7 },
  sourceChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  sourceChipTextActive: { color: colors.ink },
  input: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
  button: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
});
