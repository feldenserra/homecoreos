import { StyleSheet, Text, View } from "react-native";
import type { HomeMemberProfile } from "../../lib/api/homes";
import { colors } from "../../theme/tokens";

export function memberLabel(member: HomeMemberProfile): string {
  const name = member.name?.trim();
  if (name) {
    return name;
  }
  const emailName = member.email?.split("@")[0]?.trim();
  if (emailName) {
    return emailName;
  }
  return "Member";
}

function initialsFor(label: string): string {
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

export function MemberAvatar({
  member,
  size = 22,
}: {
  member: HomeMemberProfile;
  size?: number;
}) {
  const label = memberLabel(member);
  const fontSize = size <= 22 ? 9 : 11;

  return (
    <View
      accessibilityLabel={label}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initialsFor(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.claySoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  initials: {
    color: colors.ink,
    fontWeight: "700",
  },
});
