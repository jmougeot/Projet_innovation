import React, { useState, useEffect } from 'react';
import { 

  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Pressable, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import Header from '@/app/components/Header'; 
import { 
  getAuth, 
  getFirestore, 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  doc, 
  getDoc,
  updateDoc,
  setDoc,
  signOut
} from '@/app/firebase/firebaseConfig'; // Correction: suppression de initializeFirebase qui n'est pas exporté

// Initialisation de Firebase
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

interface ProfileData {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  poste: string;
  dateEmbauche: string;
  horaires: string;
  chiffreAffaire: number;
  objectifMensuel: number;
  performanceScore: number;
  imageUrl: string;
}

interface InfoFieldProps {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
}

const ProfileAvatar = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    id: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
    dateEmbauche: '',
    horaires: '',
    chiffreAffaire: 0,
    objectifMensuel: 0,
    performanceScore: 0,
    imageUrl: ''
  });

  // Charger les données du profil
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          router.replace('../connexion/connexion');
          return;
        }
        
        setUser(currentUser);
        
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileData({
            id: currentUser.uid,
            nom: userData.nom || '',
            prenom: userData.prenom || '',
            email: userData.email || currentUser.email || '',
            telephone: userData.telephone || '',
            poste: userData.poste || '',
            dateEmbauche: userData.dateEmbauche || '',
            horaires: userData.horaires || '',
            chiffreAffaire: userData.chiffreAffaire || 0,
            objectifMensuel: userData.objectifMensuel || 0,
            performanceScore: userData.performanceScore || 0,
            imageUrl: userData.imageUrl || ''
          });
        } else {
          // Créer un document utilisateur par défaut s'il n'existe pas
          const defaultUserData = {
            nom: '',
            prenom: '',
            email: currentUser.email || '',
            telephone: '',
            poste: 'Serveur', // Valeur par défaut
            dateEmbauche: new Date().toISOString().split('T')[0],
            horaires: '9h-17h',
            chiffreAffaire: 0,
            objectifMensuel: 5000,
            performanceScore: 0,
            imageUrl: ''
          };
          
          await setDoc(doc(db, 'users', currentUser.uid), defaultUserData); // Correction: updateDoc -> setDoc pour le document initial
          setProfileData({
            id: currentUser.uid,
            ...defaultUserData
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
        Alert.alert("Erreur", "Impossible de charger les données du profil");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fonction pour mettre à jour le profil
  const updateProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        nom: profileData.nom,
        prenom: profileData.prenom,
        email: profileData.email,
        telephone: profileData.telephone,
        poste: profileData.poste,
        horaires: profileData.horaires
      });
      
      setEditing(false);
      Alert.alert("Succès", "Profil mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    } finally {
      setSaving(false);
    }
  };

  // Fonction pour sélectionner et télécharger une image
  const pickImage = async () => {
    if (!user) return;
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert("Permission refusée", "Nous avons besoin de l'accès à votre galerie pour changer votre photo de profil");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setLoading(true);
      
      try {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        
        // Télécharger l'image vers Firebase Storage
        const storageRef = ref(storage, `profile_images/${user.uid}`);
        await uploadBytes(storageRef, blob);
        
        // Obtenir l'URL de l'image téléchargée
        const downloadURL = await getDownloadURL(storageRef);
        
        // Mettre à jour l'URL de l'image dans Firestore
        await updateDoc(doc(db, 'users', user.uid), {
          imageUrl: downloadURL
        });
        
        // Mettre à jour l'état local
        setProfileData(prev => ({
          ...prev,
          imageUrl: downloadURL
        }));
        
      } catch (error) {
        console.error("Erreur lors du téléchargement de l'image:", error);
        Alert.alert("Erreur", "Impossible de télécharger l'image");
      } finally {
        setLoading(false);
      }
    }
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('../connexion');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      Alert.alert("Erreur", "Impossible de se déconnecter");
    }
  };

  // Calculer le pourcentage d'atteinte de l'objectif
  const performancePercentage = profileData.objectifMensuel > 0 
    ? Math.min(100, Math.round((profileData.chiffreAffaire / profileData.objectifMensuel) * 100))
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#194A8D" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#194A8D', '#0A2E5C']}
        style={styles.background}
      />
      
      <Header title={editing ? "Modifier le profil" : "Mon Profil"} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Section photo de profil */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageWrapper}>
            {profileData.imageUrl ? (
              <Image source={{ uri: profileData.imageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <FontAwesome5 name="user-alt" size={40} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.cameraIconContainer}>
              <FontAwesome5 name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>
            {profileData.prenom || profileData.nom 
              ? `${profileData.prenom} ${profileData.nom}` 
              : "Profil utilisateur"}
          </Text>
          
          <View style={styles.userIdContainer}>
            <Text style={styles.userIdLabel}>ID: </Text>
            <Text style={styles.userId}>{profileData.id}</Text>
          </View>
        </View>

        {/* Section d'informations personnelles */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={22} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
          </View>
          
          <View style={styles.infoContent}>
            <InfoField 
              label="Prénom" 
              value={profileData.prenom}
              editable={editing}
              onChangeText={(text) => setProfileData({...profileData, prenom: text})}
            />
            
            <InfoField 
              label="Nom" 
              value={profileData.nom}
              editable={editing}
              onChangeText={(text) => setProfileData({...profileData, nom: text})}
            />
            
            <InfoField 
              label="Email" 
              value={profileData.email}
              editable={editing}
              onChangeText={(text) => setProfileData({...profileData, email: text})}
              keyboardType="email-address"
            />
            
            <InfoField 
              label="Téléphone" 
              value={profileData.telephone}
              editable={editing}
              onChangeText={(text) => setProfileData({...profileData, telephone: text})}
              keyboardType="phone-pad"
            />
          </View>
        </View>
        
        {/* Section d'informations professionnelles */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="work" size={22} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Informations professionnelles</Text>
          </View>
          
          <View style={styles.infoContent}>
            <InfoField 
              label="Poste" 
              value={profileData.poste}
              editable={editing}
              onChangeText={(text) => setProfileData({...profileData, poste: text})}
            />
            
            <InfoField 
              label="Date d'embauche" 
              value={profileData.dateEmbauche}
              editable={false}
            />
            
            <InfoField 
              label="Horaires" 
              value={profileData.horaires}
              editable={editing}
              onChangeText={(text) => setProfileData({...profileData, horaires: text})}
            />
          </View>
        </View>
        
        {/* Section de performance */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="trending-up" size={22} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Performance</Text>
          </View>
          
          <View style={styles.infoContent}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Chiffre d'affaire</Text>
              <Text style={styles.performanceValue}>{profileData.chiffreAffaire.toLocaleString()} €</Text>
            </View>
            
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Objectif mensuel</Text>
              <Text style={styles.performanceValue}>{profileData.objectifMensuel.toLocaleString()} €</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${performancePercentage}%` },
                    performancePercentage >= 100 ? styles.progressComplete : null
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{performancePercentage}%</Text>
            </View>
            
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Score de performance</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FontAwesome5 
                    key={star}
                    name="star" 
                    size={18} 
                    color={star <= profileData.performanceScore ? "#FFD700" : "#FFFFFF40"}
                    style={styles.starIcon}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
        
        {/* Boutons d'action */}
        <View style={styles.buttonContainer}>
          {editing ? (
            <>
              <Pressable 
                style={[styles.button, styles.saveButton]} 
                onPress={updateProfile}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={styles.buttonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Enregistrer</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
              
              <Pressable 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setEditing(false)}
                disabled={saving}
              >
                <LinearGradient
                  colors={['#F44336', '#D32F2F']}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="close" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Annuler</Text>
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable 
                style={[styles.button, styles.editButton]} 
                onPress={() => setEditing(true)}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Modifier</Text>
                </LinearGradient>
              </Pressable>
              
              <Pressable 
                style={[styles.button, styles.logoutButton]} 
                onPress={handleLogout}
              >
                <LinearGradient
                  colors={['#9E9E9E', '#757575']}
                  style={styles.buttonGradient}
                >
                  <MaterialIcons name="logout" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Déconnexion</Text>
                </LinearGradient>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Composant pour les champs d'information
const InfoField = ({ label, value, editable = false, onChangeText = () => {}, keyboardType = 'default' }: InfoFieldProps) => {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      {editable ? (
        <TextInput
          style={styles.infoInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholderTextColor="#FFFFFF80"
          placeholder={`Entrez votre ${label.toLowerCase()}`}
        />
      ) : (
        <Text style={styles.infoValue}>{value || "-"}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // ...existing code...
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#194A8D',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#194A8D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#194A8D',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  userIdLabel: {
    fontSize: 14,
    color: '#FFFFFF90',
  },
  userId: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#FFFFFF15',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF10',
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  infoContent: {
    padding: 12,
  },
  infoField: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#FFFFFF90',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF60',
    paddingVertical: 4,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#FFFFFF30',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressComplete: {
    backgroundColor: '#FFD700',
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginHorizontal: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginHorizontal: 5,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    flex: 1,
  },
  logoutButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});

export default ProfileAvatar;
