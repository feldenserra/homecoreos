import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { DisplayTitle, Muted } from "../components/ui";
import { colors } from "../theme/tokens";

/** The web app had no 404 page; a deep link to a stale route needs one. */
export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <DisplayTitle>This page does not exist.</DisplayTitle>
        <Muted>The link may be out of date.</Muted>
        <Link href="/" asChild>
          <Button mode="contained">Go home</Button>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: colors.paper,
  },
});
