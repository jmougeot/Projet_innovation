import { View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Link href="/service/plan_de_salle">Go to service</Link>
      <Link href="/service/commande/change_plan">Modifier le plan</Link>
      <Link href="/service/commande/test">Test</Link>
    </View>
  );
}
