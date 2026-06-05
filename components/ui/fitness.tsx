import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export function ScreenCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: "#141414",
          borderColor: "#262626",
          borderWidth: 1,
          borderRadius: 18,
          padding: 16,
          marginBottom: 14,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ marginBottom: 14, flexDirection: "row", alignItems: "flex-end" }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>{title}</Text>
        {!!subtitle && <Text style={{ color: "#9ca3af", marginTop: 4 }}>{subtitle}</Text>}
      </View>
      {!!actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: "#60a5fa", fontWeight: "600" }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  tint = "#007AFF",
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: "47%",
        backgroundColor: "#151515",
        borderColor: "#272727",
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <View
          style={{
            backgroundColor: `${tint}22`,
            borderRadius: 10,
            padding: 8,
            marginRight: 10,
          }}
        >
          <Ionicons name={icon} size={18} color={tint} />
        </View>
        <Text style={{ color: "#9ca3af", fontSize: 12, flex: 1 }}>{label}</Text>
      </View>
      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

export function ActionCard({
  title,
  description,
  icon,
  tint = "#007AFF",
  onPress,
}: {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.86}>
      <ScreenCard style={{ borderColor: `${tint}50` }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              backgroundColor: `${tint}20`,
              borderRadius: 12,
              padding: 12,
              marginRight: 14,
            }}
          >
            <Ionicons name={icon} size={22} color={tint} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>{title}</Text>
            <Text style={{ color: "#9ca3af", marginTop: 4, lineHeight: 20 }}>{description}</Text>
          </View>
        </View>
      </ScreenCard>
    </TouchableOpacity>
  );
}

export function StatusBadge({
  label,
  color = "#34C759",
}: {
  label: string;
  color?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}55`,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color, fontWeight: "700", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={{ color: "#fff", marginTop: 14 }}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", padding: 24 }}>
      <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center" }}>
        {title}
      </Text>
      <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 10, lineHeight: 22 }}>
        {description}
      </Text>
      {!!actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{
            backgroundColor: "#007AFF",
            borderRadius: 14,
            paddingVertical: 14,
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function InlineLabel({ text, style }: { text: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[{ color: "#9ca3af", fontSize: 13 }, style]}>
      {text}
    </Text>
  );
}
