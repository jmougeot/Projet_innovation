import React, { useEffect, useState } from "react";
import { View, Text } from "react-native-web";
import { getDoc, doc } from "firebase/firestore";
import app from "../firebase/firebaseConfig";

const db = getFirestore(app);

const EmployeeDashboardScreen = ({ userId }) => {
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setPoints(userDoc.data().points);
      }
    };

    fetchPoints();
  }, [userId]);

  return (
    <View>
      <Text>Tableau de bord du salarié</Text>
      <Text>Vos points : {points}</Text>
    </View>
  );
};

export default EmployeeDashboardScreen;
