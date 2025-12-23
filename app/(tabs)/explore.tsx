import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../lib/firebase';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function DynamicHomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [dailyKcal, setDailyKcal] = useState(0);
  const [dailyProtein, setDailyProtein] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const dietUnsubRef = useRef<Unsubscribe | null>(null);
  const workoutUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const qDiet = query(collection(db, "userDiets"), where("userId", "==", user.uid));
    dietUnsubRef.current = onSnapshot(qDiet, (snapshot) => {
      let totalKcal = 0;
      let totalProtein = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt >= startOfToday) {
          totalKcal += parseFloat(data.kcal || 0);
          totalProtein += parseFloat(data.protein || 0);
        }
      });
      setDailyKcal(totalKcal);
      setDailyProtein(totalProtein);
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });

    const qWorkout = query(collection(db, "userWorkouts"), where("userId", "==", user.uid));
    workoutUnsubRef.current = onSnapshot(qWorkout, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt >= startOfToday) count++;
      });
      setWorkoutCount(count);
      setLoading(false);
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });

    return () => {
      if (dietUnsubRef.current) dietUnsubRef.current();
      if (workoutUnsubRef.current) workoutUnsubRef.current();
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      if (dietUnsubRef.current) {
        dietUnsubRef.current();
        dietUnsubRef.current = null;
      }
      if (workoutUnsubRef.current) {
        workoutUnsubRef.current();
        workoutUnsubRef.current = null;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e10600" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greetText}>GÜNLÜK ÖZET ⚡</Text>
          <Text style={styles.userNameText}>{user?.email?.split('@')[0] || 'Şampiyon'}</Text>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e10600" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF9F0' }]}>
            <Ionicons name="flame" size={22} color="#FF9500" />
          </View>
          <Text style={styles.statValue}>{dailyKcal.toFixed(0)}</Text>
          <Text style={styles.statTitle}>Kcal</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF5F5' }]}>
            <Ionicons name="fitness" size={22} color="#e10600" />
          </View>
          <Text style={styles.statValue}>{workoutCount}</Text>
          <Text style={styles.statTitle}>Antrenman</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.iconCircle, { backgroundColor: '#F2FFF5' }]}>
            <Ionicons name="egg" size={22} color="#34C759" />
          </View>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{dailyProtein.toFixed(1)}g</Text>
          <Text style={styles.statTitle}>Protein</Text>
        </View>
      </View>

      <View style={styles.messageBanner}>
        <Text style={styles.bannerText}>
          {dailyKcal === 0
            ? "Vücudunu yakıtsız bırakma, bugün henüz veri girmedin. 🍎"
            : workoutCount === 0
              ? "Enerji harika, şimdi bu gücü demirlerle paylaşma vakti! 💪"
              : "Hedefine odaklı kal, bugün harika bir disiplin sergiliyorsun! 🔥"}
        </Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/diet')}>
          <View style={[styles.menuIcon, { backgroundColor: '#e10600' }]}><Ionicons name="nutrition" size={22} color="#fff" /></View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Beslenme Kaydı</Text>
            <Text style={styles.menuSub}>Öğünlerini yönet</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/measurements')}>
          <View style={[styles.menuIcon, { backgroundColor: '#5856D6' }]}><Ionicons name="body" size={22} color="#fff" /></View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Vücut Ölçüleri</Text>
            <Text style={styles.menuSub}>Gelişimini takip et</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/workout')}>
          <View style={[styles.menuIcon, { backgroundColor: '#34C759' }]}><Ionicons name="barbell" size={22} color="#fff" /></View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Antrenman Paneli</Text>
            <Text style={styles.menuSub}>Sınırlarını zorla</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/ai_coach')}>
          <View style={[styles.menuIcon, { backgroundColor: '#FF9500' }]}><Ionicons name="sparkles" size={22} color="#fff" /></View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Coach AI</Text>
            <Text style={styles.menuSub}>Yapay zekadan taktik al</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  loadingContainer: { flex: 1, backgroundColor: '#F8F9FB', justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  greetText: { fontSize: 11, color: '#e10600', fontWeight: '800', letterSpacing: 1.5 },
  userNameText: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', textTransform: 'capitalize', marginTop: 4 },
  exitBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFE0E0' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 15 },
  statBox: {
    width: '31%', paddingVertical: 18, backgroundColor: '#FFF',
    borderRadius: 24, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2
  },
  iconCircle: { width: 44, height: 44, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 19, fontWeight: '800', color: '#1A1A1A' },
  statTitle: { fontSize: 10, color: '#999', fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  messageBanner: { margin: 16, padding: 18, backgroundColor: '#1A1A1A', borderRadius: 22 },
  bannerText: { color: '#FFF', fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 21 },
  menuSection: { paddingHorizontal: 16, gap: 10 },
  menuItem: {
    backgroundColor: '#FFF', padding: 14, borderRadius: 22,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 1
  },
  menuIcon: { width: 46, height: 46, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  menuSub: { fontSize: 12, color: '#999', marginTop: 1 },
});