import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Button, Divider, TextInput } from "react-native-paper";
import {
  DisplayTitle,
  ErrorText,
  Muted,
  Screen,
  Wordmark,
} from "../../components/ui";
import { useAuth } from "../../lib/auth-context";
import { isLocal } from "../../lib/is-local";
import { colors, INPUT_FONT_SIZE, TOUCH_TARGET } from "../../theme/tokens";

/** Replaces app/login/page.tsx and login-form.tsx. */
export default function LoginScreen() {
  const { signIn, signInWithGitHub } = useAuth();
  const showGitHub = !isLocal();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    setPending(true);
    const result = await signIn(email, password);
    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.replace("/homes");
  };

  const github = async () => {
    setError(null);
    setPending(true);
    const result = await signInWithGitHub();
    setPending(false);

    if ("error" in result) {
      setError(result.error);
    }
    // On success the auth listener swaps the session and (auth)/_layout
    // redirects; no navigation call needed here.
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen scroll style={styles.screen}>
        <View style={styles.header}>
          <Wordmark size={34} />
          <Muted>Everything for the house, in one place.</Muted>
        </View>

        <View style={styles.block}>
          <DisplayTitle size={24}>Sign in</DisplayTitle>
          <Muted>
            {showGitHub
              ? "Email and password, or continue with GitHub."
              : "Email and password."}
          </Muted>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            placeholder="At least 8 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={submit}
            returnKeyType="go"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((value) => !value)}
              />
            }
          />

          <ErrorText>{error}</ErrorText>

          <Button
            mode="contained"
            onPress={submit}
            loading={pending}
            disabled={pending}
            style={styles.button}
          >
            Sign in
          </Button>
        </View>

        <Link href="/sign-up" asChild>
          <Button mode="contained-tonal" style={styles.button}>
            Create account
          </Button>
        </Link>

        {showGitHub ? (
          <>
            <View style={styles.dividerRow}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerLabel}>or</Text>
              <Divider style={styles.divider} />
            </View>

            <Button
              mode="outlined"
              onPress={github}
              disabled={pending}
              style={styles.button}
              icon={() => (
                <MaterialCommunityIcons
                  name="github"
                  size={18}
                  color={colors.ink}
                />
              )}
            >
              Continue with GitHub
            </Button>
          </>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    justifyContent: "center",
    gap: 20,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  header: { gap: 4 },
  block: { gap: 4 },
  form: { gap: 12 },
  input: {
    // 16px is what stops iOS zooming the viewport on focus.
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: { flex: 1 },
  dividerLabel: {
    color: colors.muted,
    fontSize: 13,
  },
});
