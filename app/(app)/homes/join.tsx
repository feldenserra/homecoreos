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
import { joinHome } from "../../../lib/api/homes";
import {
  HOME_CODE_LENGTH,
  isValidHomeCode,
  normalizeHomeCode,
} from "../../../lib/home-code";
import { colors, INPUT_FONT_SIZE, TOUCH_TARGET } from "../../../theme/tokens";

/**
 * Join a home by code. Was the second inline section of home-gate.tsx.
 *
 * The code is the only capability that grants access to a household — direct
 * INSERT on home_member is revoked, so `join_home` is the sole way in. It
 * re-normalises and re-validates server-side; the same rules run here only to
 * keep the user from making a round trip to be told about a typo.
 */
export default function JoinHomeScreen() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);

    if (!isValidHomeCode(code)) {
      setError(`Enter a valid ${HOME_CODE_LENGTH}-character home code.`);
      return;
    }

    setPending(true);
    try {
      const home = await joinHome(code);
      router.replace(`/home/${home.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join that home.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Join a home" }} />
      <Screen scroll style={styles.screen}>
        <View style={styles.header}>
          <DisplayTitle size={26}>Join a home</DisplayTitle>
          <Muted>
            Enter the {HOME_CODE_LENGTH}-character code shared by someone who
            already has a home.
          </Muted>
        </View>

        <TextInput
          label="Home code"
          value={code}
          // Normalising on every keystroke means a pasted "a7k2-m9qx-3bph"
          // becomes valid without the user having to clean it up.
          onChangeText={(next) =>
            setCode(normalizeHomeCode(next).slice(0, HOME_CODE_LENGTH))
          }
          mode="outlined"
          placeholder="A7K2M9QX3BPH"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={HOME_CODE_LENGTH}
          autoFocus
          onSubmitEditing={submit}
          returnKeyType="go"
          style={[styles.input, styles.codeInput]}
        />

        <ErrorText>{error}</ErrorText>

        <Button
          mode="contained"
          onPress={submit}
          loading={pending}
          disabled={pending || !isValidHomeCode(code)}
          style={styles.button}
        >
          Join home
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
  codeInput: {
    // Matches the tracked-out monospace treatment the web input had.
    fontVariant: ["tabular-nums"],
    letterSpacing: 3,
  },
  button: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
});
