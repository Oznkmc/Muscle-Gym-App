import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../../lib/firebase';
import { Ionicons } from '@expo/vector-icons';

import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

/**
 * DynamicHomeScreen: Ana dashboard.
 * Çıkış yaparken oluşan "permission-denied" hatası için optimize edildi.
 */
export default function DynamicHomeScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [dailyKcal, setDailyKcal] = useState(0);
  const [dailyProtein, setDailyProtein] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Dinleyicileri temizlemek için referanslar
  const dietUnsubRef = useRef<Unsubscribe | null>(null);
  const workoutUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Diet Listener
    const qDiet = query(collection(db, "userDiets"), where("userId", "==", user.uid));
    dietUnsubRef.current = onSnapshot(qDiet, (snapshot) => {
      let totalKcal = 0; let totalProtein = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt >= startOfToday) {
          totalKcal += parseFloat(data.kcal || 0);
          totalProtein += parseFloat(data.protein || 0);
        }
      });
      setDailyKcal(totalKcal);
      setDailyProtein(totalProtein);
    }, (error) => {
      // Çıkış anındaki yetki hatasını konsola basma
      if (error.code !== 'permission-denied') console.error("Diet Listener Error:", error);
    });

    // 2. Workout Listener
    const qWorkout = query(collection(db, "userWorkouts"), where("userId", "==", user.uid));
    workoutUnsubRef.current = onSnapshot(qWorkout, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const createdAt = doc.data().createdAt?.toDate();
        if (createdAt >= startOfToday) count++;
      });
      setWorkoutCount(count);
      setLoading(false);
    }, (error) => {
      if (error.code !== 'permission-denied') console.error("Workout Listener Error:", error);
    });

    return () => {
      dietUnsubRef.current?.();
      workoutUnsubRef.current?.();
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      // Önce dinleyicileri durdur ve referansları boşa çıkar
      if (dietUnsubRef.current) {
        dietUnsubRef.current();
        dietUnsubRef.current = null;
      }
      if (workoutUnsubRef.current) {
        workoutUnsubRef.current();
        workoutUnsubRef.current = null;
      }

      // Yarış durumunu (race condition) önlemek için çok kısa bekleme
      await new Promise(resolve => setTimeout(resolve, 150));

      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#e10600" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Bugün Durumun Nedir? ⚡</Text>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Şampiyon'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color="#e10600" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={28} color="#FF9500" />
          <Text style={styles.statNum}>{dailyKcal.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Alınan Kcal</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="fitness" size={28} color="#e10600" />
          <Text style={styles.statNum}>{workoutCount}</Text>
          <Text style={styles.statLabel}>Antrenman</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="egg" size={28} color="#34C759" />
          <Text style={[styles.statNum, { color: '#34C759' }]}>{dailyProtein.toFixed(1)}g</Text>
          <Text style={styles.statLabel}>Protein</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {dailyKcal === 0
            ? "Henüz bir şey yemedin mi? Enerji toplamalısın! 🍎"
            : workoutCount === 0
              ? "Beslenmen güzel, ama bugün henüz antrenman yapmadın! 💪"
              : "Harika gidiyorsun, disiplin seni şampiyon yapar! 🔥"}
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.mainAction} onPress={() => router.push('/diet')}>
          <View style={styles.actionIcon}><Ionicons name="nutrition" size={26} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Beslenme Kaydı</Text>
            <Text style={styles.actionSub}>Hemen bir şeyler ekle</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mainAction, { marginTop: 15 }]} onPress={() => router.push('/measurements')}>
          <View style={[styles.actionIcon, { backgroundColor: '#5856D6' }]}><Ionicons name="body" size={26} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Gelişim Takibi</Text>
            <Text style={styles.actionSub}>Ölçülerini güncelle</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mainAction, { marginTop: 15 }]} onPress={() => router.push('/workout')}>
          <View style={[styles.actionIcon, { backgroundColor: '#34C759' }]}><Ionicons name="barbell" size={26} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Antrenmana Başla</Text>
            <Text style={styles.actionSub}>Disiplinini seç ve basmaya başla!</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.mainAction, { marginTop: 15 }]} onPress={() => router.push('/ai_coach')}>
          <View style={[styles.actionIcon, { backgroundColor: '#FF9500' }]}><Ionicons name="sparkles" size={26} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>AI Fitness Coach</Text>
            <Text style={styles.actionSub}>Yapay zekaya danış ve tavsiye al!</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DDD" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: { padding: 25, paddingTop: 60, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
  greet: { fontSize: 13, color: '#8e8e93', fontWeight: '600' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e', textTransform: 'capitalize' },
  logoutBtn: { padding: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15 },
  statCard: { width: '31%', padding: 15, backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  statNum: { fontSize: 18, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  infoBox: { margin: 15, padding: 20, backgroundColor: '#1c1c1e', borderRadius: 20 },
  infoText: { color: '#fff', textAlign: 'center', fontWeight: '500', lineHeight: 22 },
  section: { padding: 15 },
  mainAction: { backgroundColor: '#fff', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  actionIcon: { width: 48, height: 48, backgroundColor: '#e10600', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e' },
  actionSub: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
});