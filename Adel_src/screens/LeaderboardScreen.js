import React, { useEffect, useState } from "react";
import { View, Text } from "react-native-web";
import { getDocs, collection, getFirestore } from "firebase/firestore";
import app from "../firebase/firebaseConfig";  // Import de la configuration Firebase

const db = getFirestore(app);

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const leaderboardData = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.role === "employee") {
          leaderboardData.push({ name: userData.name, points: userData.points });
        }
      });

      leaderboardData.sort((a, b) => b.points - a.points); // Trier par points décroissants
      setLeaderboard(leaderboardData);
    };

    fetchLeaderboard();
  }, []);

  return (
    <View>
      <Text>Classement</Text>
      {leaderboard.map((user, index) => (
        <Text key={index}>
          {index + 1}. {user.name} - {user.points} points
        </Text>
      ))}
    </View>
  );
};

export default LeaderboardScreen;
