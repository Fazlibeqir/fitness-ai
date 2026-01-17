import { TextInput } from "react-native";

export function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#999"
      style={[
        {
          borderWidth: 1,
          borderColor: "#ccc",
          backgroundColor: "#fff",
          color: "#000",
          padding: 12,
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 16,
        },
        props.style,
      ]}
    />
  );
}
