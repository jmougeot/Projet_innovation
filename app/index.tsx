import { Text, View } from "react-native";
import { Link } from "react-router-native";


export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Link to="/service/pland_de_salle">Go to service</Link>

    </View>
  );
}
