import { router, Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  DisplayTitle,
  ErrorText,
  Muted,
  Screen,
} from "../../../components/ui";
import { createHome } from "../../../lib/api/homes";
import { colors, INPUT_FONT_SIZE, TOUCH_TARGET } from "../../../theme/tokens";

/**
 * Create a home. Was the first inline section of home-gate.tsx.
 *
 * No quota pre-check here, unlike the web version which called getHomeQuota
 * before attempting the insert. `create_home` enforces the limit and raises
 * PT409 with the message to show, so a pre-check would only add a round trip
 * and a second place for the rule to drift.
 */
export default function NewHomeScreen() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    setPending(true);

    try {
      const home = await createHome(name);
      // dismissTo keeps the picker underneath rather than stacking a third
      // screen the user has to back out of twice.
      router.replace(`/home/${home.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a home.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Create a home" }} />
      <Screen scroll style={styles.screen}>
        <View style={styles.header}>
          <DisplayTitle size={26}>Create a home</DisplayTitle>
          <Muted>
            Start a shared space. You&apos;ll get a 12-character code to invite
            others. You can only create one home.
          </Muted>
        </View>

        <TextInput
          label="Home name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          placeholder="Serra household"
          maxLength={64}
          autoFocus
          onSubmitEditing={submit}
          returnKeyType="go"
          style={styles.input}
        />

        <ErrorText>{error}</ErrorText>

        <Button
          mode="contained"
          onPress={submit}
          loading={pending}
          disabled={pending || name.trim().length < 2}
          style={styles.button}
        >
          Create home
        </Button>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  header: { gap: 6 },
  input: {
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
});
