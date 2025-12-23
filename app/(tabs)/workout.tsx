import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../lib/firebase';
import {
    collection, addDoc, query, where, onSnapshot,
    deleteDoc, doc, serverTimestamp, orderBy
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

const workoutData: any = {
    Bodybuilding: [
        { name: 'Bench Press', icon: 'barbell-outline', target: 'Göğüs', diff: 'Orta' },
        { name: 'Incline Press', icon: 'fitness-outline', target: 'Üst Göğüs', diff: 'Orta' },
        { name: 'Lat Pulldown', icon: 'arrow-down-circle-outline', target: 'Sırt', diff: 'Başlangıç' },
        { name: 'Seated Row', icon: 'reorder-four-outline', target: 'Sırt', diff: 'Başlangıç' },
        { name: 'Shoulder Press', icon: 'fitness-outline', target: 'Omuz', diff: 'Orta' },
        { name: 'Lateral Raise', icon: 'move-outline', target: 'Yan Omuz', diff: 'Başlangıç' },
        { name: 'Leg Press', icon: 'body-outline', target: 'Bacak', diff: 'Başlangıç' },
        { name: 'Leg Extension', icon: 'body-outline', target: 'Ön Bacak', diff: 'Başlangıç' },
        { name: 'Bicep Curl', icon: 'fitness-outline', target: 'Pazu', diff: 'Başlangıç' },
        { name: 'Triceps Pushdown', icon: 'arrow-down-outline', target: 'Arka Kol', diff: 'Başlangıç' },
    ],
    Powerlifting: [
        { name: 'Squat (Low Bar)', icon: 'speedometer-outline', target: 'Tüm Vücut', diff: 'İleri' },
        { name: 'Bench Press', icon: 'barbell-outline', target: 'Göğüs', diff: 'Orta' },
        { name: 'Deadlift', icon: 'trending-up-outline', target: 'Arka Zincir', diff: 'İleri' },
        { name: 'Sumo Deadlift', icon: 'add-outline', target: 'Bacak/Bel', diff: 'İleri' },
        { name: 'Overhead Press', icon: 'arrow-up-outline', target: 'Omuz/Core', diff: 'Orta' },
    ],
    Calisthenics: [
        { name: 'Pull-up', icon: 'reorder-four-outline', target: 'Sırt/Pazu', diff: 'Orta' },
        { name: 'Push-up', icon: 'remove-outline', target: 'Göğüs/Kol', diff: 'Başlangıç' },
        { name: 'Dip', icon: 'unfold-more-outline', target: 'Alt Göğüs/Triceps', diff: 'Orta' },
        { name: 'Muscle-up', icon: 'flash-outline', target: 'Tüm Üst Vücut', diff: 'İleri' },
        { name: 'Handstand', icon: 'hand-left-outline', target: 'Omuz/Denge', diff: 'İleri' },
        { name: 'Plank', icon: 'stopwatch-outline', target: 'Core', diff: 'Başlangıç' },
    ],
};

export default function WorkoutScreen() {
    const [discipline, setDiscipline] = useState<null | string>(null);
    const [selectedEx, setSelectedEx] = useState<null | string>(null);
    const [sets, setSets] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const user = auth.currentUser;

    const formatTime = (timestamp: any) => {
        if (!timestamp) return "Az önce";
        try {
            const date = timestamp.toDate();
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return "Az önce";
        }
    };

    const isToday = (timestamp: any) => {
        if (!timestamp) return true;
        try {
            const date = timestamp.toDate();
            const today = new Date();
            return date.toDateString() === today.toDateString();
        } catch (error) {
            return true;
        }
    };

    const totalVolume = useMemo(() => {
        return history
            .filter(item => isToday(item.createdAt))
            .reduce((acc, item) => acc + (Number(item.sets || 0) * Number(item.weight || 0)), 0);
    }, [history]);

    const todayWorkouts = useMemo(() => {
        return history.filter(item => isToday(item.createdAt)).length;
    }, [history]);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "userWorkouts"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const arr: any[] = [];
            snapshot.forEach((doc) => arr.push({ ...doc.data(), id: doc.id }));
            setHistory(arr);
            setLoading(false);
        }, (error) => {
            if (error.code !== 'permission-denied') {
                console.error(error);
            }
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const handleSave = async () => {
        if (!selectedEx || !sets) {
            return Alert.alert("Hata", "Gereken alanları doldurun.");
        }

        try {
            const exDetail = workoutData[discipline!].find((e: any) => e.name === selectedEx);

            await addDoc(collection(db, "userWorkouts"), {
                userId: user?.uid,
                discipline,
                exercise: selectedEx,
                target: exDetail?.target || "",
                sets,
                reps: reps || "0",
                weight: weight || "0",
                createdAt: serverTimestamp()
            });

            Alert.alert("Başarılı! 💪", "Antrenman kaydedildi.");
            setSelectedEx(null);
            setSets('');
            setReps('');
            setWeight('');
        } catch (e) {
            Alert.alert("Hata", "İşlem başarısız.");
        }
    };

    const confirmDelete = (id: string) => {
        Alert.alert("Kaydı Sil", "Emin misiniz?", [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => deleteDoc(doc(db, "userWorkouts", id)) }
        ]);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.mainTitle}>Antrenman Planla 💪</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statsCard}>
                    <View style={styles.statsInfo}>
                        <Ionicons name="flash" size={28} color="#e10600" />
                        <View style={{ marginLeft: 12 }}>
                            <Text style={styles.statsLabel}>Bugünkü Toplam Hacim</Text>
                            <Text style={styles.statsValue}>{totalVolume} <Text style={{ fontSize: 16 }}>kg</Text></Text>
                        </View>
                    </View>
                </View>

                <View style={styles.miniStatCard}>
                    <Ionicons name="trophy" size={20} color="#FF9500" />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={styles.miniStatLabel}>Bugün</Text>
                        <Text style={styles.miniStatValue}>{todayWorkouts} Hareket</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Disiplin Seç</Text>
            <View style={styles.cardContainer}>
                {['Bodybuilding', 'Powerlifting', 'Calisthenics'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.typeCard, discipline === type && styles.activeCard]}
                        onPress={() => { setDiscipline(type); setSelectedEx(null); }}
                    >
                        <Ionicons
                            name={type === 'Bodybuilding' ? 'body' : type === 'Powerlifting' ? 'barbell' : 'fitness'}
                            size={28}
                            color={discipline === type ? '#fff' : '#e10600'}
                        />
                        <Text style={[styles.cardText, discipline === type && styles.activeText]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {discipline && (
                <View style={styles.section}>
                    <Text style={styles.subTitle}>{discipline} Hareketleri</Text>
                    <View style={styles.exerciseGrid}>
                        {workoutData[discipline].map((ex: any) => (
                            <TouchableOpacity
                                key={ex.name}
                                style={[styles.exChip, selectedEx === ex.name && styles.activeChip]}
                                onPress={() => setSelectedEx(ex.name)}
                            >
                                <Text style={[styles.exText, selectedEx === ex.name && styles.activeChipText]}>{ex.name}</Text>
                                <Text style={[styles.targetText, selectedEx === ex.name && styles.activeTargetText]}>{ex.target}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {selectedEx && (
                <View style={styles.formCard}>
                    <View style={styles.formHeaderRow}>
                        <Text style={styles.formTitle}>📝 {selectedEx}</Text>
                        <View style={styles.diffBadge}>
                            <Text style={styles.diffText}>{workoutData[discipline!]?.find((e: any) => e.name === selectedEx)?.diff}</Text>
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Set</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={sets}
                                onChangeText={setSets}
                                placeholder="3"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Tekrar</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={reps}
                                onChangeText={setReps}
                                placeholder="10"
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Ağırlık (kg)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="0"
                        />
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.saveBtnText}>Kaydet</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Text style={styles.listTitle}>📋 Geçmiş</Text>
            {loading ? (
                <ActivityIndicator color="#e10600" size="large" />
            ) : (
                history.map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#e10600" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.itemEx}>{item.exercise}</Text>
                                {item.target && <Text style={styles.targetTag}>{item.target}</Text>}
                            </View>
                            <Text style={styles.itemDetails}>
                                {item.sets} Set • {item.reps} Tekrar
                                {item.weight !== "0" && ` • ${item.weight}kg`}
                                {` • ${formatTime(item.createdAt)}`}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                            <Ionicons name="trash-outline" size={20} color="#ff4444" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB', paddingHorizontal: 20 },
    header: { marginTop: 50, marginBottom: 20 },
    mainTitle: { fontSize: 24, fontWeight: '800' },
    statsContainer: { marginBottom: 20 },
    statsCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 2 },
    statsInfo: { flexDirection: 'row', alignItems: 'center' },
    statsLabel: { color: '#888', fontSize: 12 },
    statsValue: { fontSize: 24, fontWeight: '800' },
    miniStatCard: { backgroundColor: '#FFF8E1', padding: 12, borderRadius: 15, flexDirection: 'row', marginTop: 10 },
    miniStatLabel: { fontSize: 10, color: '#888' },
    miniStatValue: { fontSize: 14, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
    cardContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    typeCard: { width: (width - 60) / 3, backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center' },
    activeCard: { backgroundColor: '#e10600' },
    cardText: { fontSize: 10, fontWeight: '700', marginTop: 5 },
    activeText: { color: '#fff' },
    section: { marginBottom: 20 },
    subTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
    exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    exChip: { backgroundColor: '#fff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#EEE' },
    activeChip: { backgroundColor: '#333' },
    exText: { fontSize: 12, fontWeight: '700' },
    targetText: { fontSize: 9, color: '#e10600' },
    activeChipText: { color: '#fff' },
    activeTargetText: { color: '#FF9500' },
    formCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 3 },
    formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    formTitle: { fontSize: 18, fontWeight: '800', color: '#e10600' },
    diffBadge: { backgroundColor: '#F5F5F5', padding: 4, borderRadius: 5 },
    diffText: { fontSize: 9, fontWeight: '700' },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
    inputWrapper: { flex: 1, marginRight: 5, marginBottom: 10 },
    inputLabel: { fontSize: 11, color: '#888', marginBottom: 5 },
    input: { backgroundColor: '#F5F6F8', padding: 12, borderRadius: 10, fontSize: 14 },
    saveBtn: { backgroundColor: '#e10600', padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
    saveBtnText: { color: '#fff', fontWeight: '800', marginLeft: 5 },
    listTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
    historyItem: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    historyIcon: { width: 40, height: 40, backgroundColor: '#FFF0F0', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    itemEx: { fontSize: 15, fontWeight: '700' },
    targetTag: { fontSize: 8, backgroundColor: '#F0F0F0', padding: 3, borderRadius: 4, marginLeft: 5 },
    itemDetails: { fontSize: 11, color: '#888', marginTop: 3 }
});