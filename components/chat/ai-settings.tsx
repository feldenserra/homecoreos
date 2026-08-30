"use client";

import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { useEffect, useState, useTransition } from "react";
import {
  deleteAiKey,
  getAiKeysForUser,
  saveAiKey,
  type AiKeyListItem,
} from "../../app/app/ai-key-actions";
import {
  AI_KEY_SOURCES,
  type AiKeySource,
} from "../../lib/types";

const SOURCE_LABELS: Record<AiKeySource, string> = {
  ollama: "Ollama",
  cloudflare: "Cloudflare",
};

const SOURCE_OPTIONS = AI_KEY_SOURCES.map((source) => ({
  value: source,
  label: SOURCE_LABELS[source],
}));

export function AiSettings() {
  const [opened, setOpened] = useState(false);
  const [pending, startTransition] = useTransition();
  const [keys, setKeys] = useState<AiKeyListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState<AiKeySource>("ollama");
  const [url, setUrl] = useState("");
  const [model, setModel] = useState("");
  const [accountId, setAccountId] = useState("");
  const [apiKey, setApiKey] = useState("");

  const usedSources = new Set(keys.map((key) => key.source));
  const availableSources = AI_KEY_SOURCES.filter(
    (item) => !usedSources.has(item),
  );
  const canAdd = availableSources.length > 0;

  function resetForm() {
    setSource(availableSources[0] ?? "ollama");
    setUrl("");
    setModel("");
    setAccountId("");
    setApiKey("");
    setEditing(false);
    setMode("list");
  }

  useEffect(() => {
    if (!opened) {
      return;
    }
    setError(null);
    setMode("list");
    setEditing(false);
    setApiKey("");
    startTransition(async () => {
      const result = await getAiKeysForUser();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setKeys(result.keys);
    });
  }, [opened]);

  function openAdd() {
    const next = availableSources[0] ?? "ollama";
    setSource(next);
    setUrl("");
    setModel("");
    setAccountId("");
    setApiKey("");
    setEditing(false);
    setError(null);
    setMode("form");
  }

  function openEdit(key: AiKeyListItem) {
    setSource(key.source);
    setUrl(key.url ?? "");
    setModel(key.model ?? "");
    setAccountId(key.accountId ?? "");
    setApiKey("");
    setEditing(true);
    setError(null);
    setMode("form");
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveAiKey({
        source,
        url,
        model,
        accountId,
        apiKey,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const next = await getAiKeysForUser();
      if ("error" in next) {
        setError(next.error);
        return;
      }
      setKeys(next.keys);
      setMode("list");
      setEditing(false);
      setApiKey("");
    });
  }

  function onDelete(item: AiKeyListItem) {
    if (
      !window.confirm(
        `Remove the ${SOURCE_LABELS[item.source]} setting? You can add it again later.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteAiKey(item.source);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const next = await getAiKeysForUser();
      if ("error" in next) {
        setError(next.error);
        return;
      }
      setKeys(next.keys);
    });
  }

  return (
    <>
      <Button
        fullWidth
        variant="default"
        color="gray"
        onClick={() => setOpened(true)}
      >
        AI setting
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="AI setting"
        centered
      >
        <Stack gap="md">
          {error ? (
            <Text size="sm" c="red">
              {error}
            </Text>
          ) : null}

          {mode === "list" ? (
            <>
              {keys.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No AI providers saved yet. Add Ollama or Cloudflare.
                </Text>
              ) : (
                <Stack gap="sm">
                  {keys.map((key) => (
                    <div key={key.id} className="ai-key-row">
                      <div>
                        <Text size="sm" fw={600}>
                          {SOURCE_LABELS[key.source]}
                        </Text>
                        {key.source === "ollama" ? (
                          <Text size="xs" c="dimmed">
                            {key.model}
                            {key.url ? ` · ${key.url}` : ""}
                          </Text>
                        ) : (
                          <Text size="xs" c="dimmed">
                            {key.accountId}
                            {key.hasApiKey ? " · API key saved" : ""}
                          </Text>
                        )}
                      </div>
                      <Group gap={8} wrap="nowrap">
                        <UnstyledButton
                          disabled={pending}
                          onClick={() => openEdit(key)}
                        >
                          <Text size="sm" c="dimmed">
                            Edit
                          </Text>
                        </UnstyledButton>
                        <UnstyledButton
                          disabled={pending}
                          onClick={() => onDelete(key)}
                        >
                          <Text size="sm" c="dimmed">
                            Remove
                          </Text>
                        </UnstyledButton>
                      </Group>
                    </div>
                  ))}
                </Stack>
              )}
              {canAdd ? (
                <Button
                  variant="default"
                  color="gray"
                  onClick={openAdd}
                  disabled={pending}
                >
                  Add
                </Button>
              ) : null}
            </>
          ) : (
            <Stack gap="sm">
              {editing ? (
                <Text size="sm" fw={600}>
                  {SOURCE_LABELS[source]}
                </Text>
              ) : availableSources.length > 1 ? (
                <Select
                  label="Source"
                  data={SOURCE_OPTIONS.filter((option) =>
                    availableSources.includes(option.value as AiKeySource),
                  )}
                  value={source}
                  onChange={(value) => {
                    if (value && isAiKeySource(value)) {
                      setSource(value);
                    }
                  }}
                />
              ) : (
                <Text size="sm" fw={600}>
                  {SOURCE_LABELS[source]}
                </Text>
              )}

              {source === "ollama" ? (
                <>
                  <TextInput
                    label="URL"
                    placeholder="http://127.0.0.1:11434"
                    value={url}
                    onChange={(e) => setUrl(e.currentTarget.value)}
                    required
                  />
                  <TextInput
                    label="Model"
                    placeholder="llama3.2"
                    value={model}
                    onChange={(e) => setModel(e.currentTarget.value)}
                    required
                  />
                </>
              ) : (
                <>
                  <TextInput
                    label="Account ID"
                    placeholder="Cloudflare account ID"
                    value={accountId}
                    onChange={(e) => setAccountId(e.currentTarget.value)}
                    required
                  />
                  <PasswordInput
                    label="API key"
                    placeholder={
                      editing ? "Leave blank to keep the current key" : ""
                    }
                    description={
                      editing
                        ? "Leave blank to keep the current key"
                        : undefined
                    }
                    value={apiKey}
                    onChange={(e) => setApiKey(e.currentTarget.value)}
                    required={!editing}
                  />
                </>
              )}

              <Group justify="flex-end" gap="xs" mt={4}>
                <Button
                  variant="default"
                  color="gray"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={onSave} loading={pending}>
                  Save
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Modal>
    </>
  );
}

function isAiKeySource(value: string): value is AiKeySource {
  return (AI_KEY_SOURCES as readonly string[]).includes(value);
}
