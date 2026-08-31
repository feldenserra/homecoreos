import { Link, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import {
  Card,
  DisplayTitle,
  ErrorText,
  Muted,
  Screen,
  Wordmark,
} from "../../components/ui";
import { useAuth } from "../../lib/auth-context";
import { validateSignup } from "../../lib/signup";
import { colors, INPUT_FONT_SIZE, TOUCH_TARGET } from "../../theme/tokens";

/**
 * Replaces app/signup/page.tsx and signup-form.tsx.
 *
 * One state the web version never needed: with email confirmations enabled,
 * Supabase's signUp succeeds but returns no session. Navigating to /homes then
 * would bounce straight back to the login screen, so the "check your email"
 * panel below is the terminal state for that path.
 */
export default function SignUpScreen() {
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const submit = async () => {
    setError(null);

    // The same shared validator the server action used, so the messages match.
    const invalid = validateSignup({ name, email, password, confirmPassword });
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);
    const result = await signUp(name, email, password);
    setPending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    if ("pending" in result) {
      setAwaitingConfirmation(true);
      return;
    }
    router.replace("/homes");
  };

  if (awaitingConfirmation) {
    return (
      <Screen style={styles.screen}>
        <Wordmark size={34} />
        <Card>
          <DisplayTitle size={22}>Check your email</DisplayTitle>
          <Muted>
            We sent a confirmation link to {email.trim().toLowerCase()}. Open it
            on this device to finish signing in.
          </Muted>
        </Card>
        <Link href="/login" asChild>
          <Button mode="contained-tonal" style={styles.button}>
            Back to sign in
          </Button>
        </Link>
      </Screen>
    );
  }

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
          <DisplayTitle size={24}>Create account</DisplayTitle>
          <Muted>Name, email, and password to get started.</Muted>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            placeholder="Alex Serra"
            autoComplete="name"
            textContentType="name"
            maxLength={64}
            style={styles.input}
          />
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
            autoComplete="new-password"
            textContentType="newPassword"
            style={styles.input}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((value) => !value)}
              />
            }
          />
          <TextInput
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            placeholder="Repeat your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            onSubmitEditing={submit}
            returnKeyType="go"
            style={styles.input}
          />

          <ErrorText>{error}</ErrorText>

          <Button
            mode="contained"
            onPress={submit}
            loading={pending}
            disabled={pending}
            style={styles.button}
          >
            Create account
          </Button>
        </View>

        <View style={styles.footerRow}>
          <Muted>Already have an account?</Muted>
          <Link href="/login" asChild>
            <Button mode="text" compact>
              Sign in
            </Button>
          </Link>
        </View>
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
    fontSize: INPUT_FONT_SIZE,
    backgroundColor: colors.surface,
  },
  button: {
    minHeight: TOUCH_TARGET,
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
