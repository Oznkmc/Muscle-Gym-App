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
            .reduce((acc, item) => acc + (Number(item.sets) * Number(item.weight)), 0);
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
        });
        return () => unsubscribe();
    }, [user?.uid]);

    const handleSave = async () => {
        if (!selectedEx || !sets) {
            return Alert.alert("Hata", "En azından hareket ve set sayısı girmelisin.");
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

            Alert.alert("Başarılı! 💪", `${selectedEx} kaydedildi!`);
            setSelectedEx(null);
            setSets('');
            setReps('');
            setWeight('');
        } catch (e) {
            Alert.alert("Hata", "Kaydedilemedi.");
        }
    };

    const confirmDelete = (id: string) => {
        Alert.alert("Kaydı Sil", "Bu antrenmanı silmek istediğine emin misin?", [
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
                            <Text style={styles.inputLabel}>Set Sayısı</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={sets}
                                onChangeText={setSets}
                                placeholder="3"
                                placeholderTextColor="#999"
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
                                placeholderTextColor="#999"
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
                            placeholder="Ağırlık girin"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.saveBtnText}>Kaydet ve Bitir</Text>
                    </TouchableOpacity>
                </View>
            )}

            <Text style={styles.listTitle}>📋 Antrenman Geçmişi</Text>
            {loading ? (
                <ActivityIndicator color="#e10600" size="large" style={{ marginTop: 20 }} />
            ) : history.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="barbell-outline" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>Henüz antrenman kaydın yok</Text>
                    <Text style={styles.emptySubText}>Yukarıdan bir disiplin seçerek başla!</Text>
                </View>
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
                            <Text style={styles.itemDiscipline}>{item.discipline}</Text>
                            <Text style={styles.itemDetails}>
                                {item.sets} Set
                                {item.reps && ` • ${item.reps} Tekrar`}
                                {item.weight && item.weight !== "0" && ` • ${item.weight}kg`}
                                {' • '}{formatTime(item.createdAt)}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={20} color="#ff4444" />
                        </TouchableOpacity>
                    </View>
                ))
            )}
            <View style={{ height: 120 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB', paddingHorizontal: 20 },
    header: { marginTop: 60, marginBottom: 20 },
    mainTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },

    statsContainer: { marginBottom: 25 },
    statsCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3
    },
    statsInfo: { flexDirection: 'row', alignItems: 'center' },
    statsLabel: { color: '#888', fontSize: 13, fontWeight: '500' },
    statsValue: { color: '#1A1A1A', fontSize: 26, fontWeight: '800', marginTop: 4 },

    miniStatCard: {
        backgroundColor: '#FFF8E1',
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFE082'
    },
    miniStatLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
    miniStatValue: { fontSize: 16, color: '#1A1A1A', fontWeight: '700' },

    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1A1A1A' },
    cardContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    typeCard: {
        width: (width - 60) / 3,
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 18,
        alignItems: 'center',
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent'
    },
    activeCard: { backgroundColor: '#e10600', borderColor: '#e10600' },
    cardText: { fontSize: 11, fontWeight: '700', marginTop: 10, color: '#444' },
    activeText: { color: '#fff' },

    section: { marginBottom: 25 },
    subTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, color: '#333' },
    exerciseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    exChip: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#EEE',
        alignItems: 'center'
    },
    activeChip: { backgroundColor: '#333', borderColor: '#333' },
    exText: { fontSize: 13, fontWeight: '700', color: '#333' },
    targetText: { fontSize: 10, color: '#e10600', fontWeight: '600', marginTop: 2 },
    activeChipText: { color: '#fff' },
    activeTargetText: { color: '#FF9500' },

    formCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0'
    },
    formHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    formTitle: { fontSize: 19, fontWeight: '800', color: '#e10600' },
    diffBadge: { backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    diffText: { fontSize: 10, fontWeight: '700', color: '#666' },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    inputWrapper: { flex: 1, marginRight: 10 },
    inputLabel: { fontSize: 12, color: '#888', marginBottom: 8, fontWeight: '600' },
    input: {
        backgroundColor: '#F5F6F8',
        padding: 15,
        borderRadius: 12,
        fontSize: 15,
        fontWeight: '600',
        borderWidth: 1,
        borderColor: '#E8E9EB'
    },
    saveBtn: {
        backgroundColor: '#e10600',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10
    },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 8 },

    listTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, color: '#333' },
    historyItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f5f5f5'
    },
    historyIcon: {
        width: 42,
        height: 42,
        backgroundColor: '#FFF0F0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    itemEx: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    targetTag: { fontSize: 9, backgroundColor: '#F0F0F0', color: '#666', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8, fontWeight: '700', overflow: 'hidden' },
    itemDiscipline: { fontSize: 11, color: '#e10600', fontWeight: '600', marginTop: 2 },
    itemDetails: { fontSize: 12, color: '#888', marginTop: 4 },
    deleteBtn: {
        padding: 8,
        backgroundColor: '#FFF0F0',
        borderRadius: 10
    },
    emptyBox: {
        padding: 50,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        marginVertical: 20
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
        marginTop: 15
    },
    emptySubText: {
        fontSize: 13,
        color: '#999',
        marginTop: 5
    }
});