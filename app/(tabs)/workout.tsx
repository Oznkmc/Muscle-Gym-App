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
                <Text style={styles.mainTitle}>Antrenman Planla</Text>
                <Text style={styles.subtitle}>Hedeflerine ulaşmak için hadi başla!</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <View style={styles.statIconWrapper}>
                        <Ionicons name="barbell" size={24} color="#e10600" />
                    </View>
                    <Text style={styles.statValue}>{totalVolume}</Text>
                    <Text style={styles.statLabel}>kg Toplam</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={styles.statIconWrapper}>
                        <Ionicons name="fitness" size={24} color="#FF9500" />
                    </View>
                    <Text style={styles.statValue}>{todayWorkouts}</Text>
                    <Text style={styles.statLabel}>Hareket</Text>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Disiplin Seç</Text>
                <View style={styles.dividerLine} />
            </View>

            <View style={styles.disciplineContainer}>
                {['Bodybuilding', 'Powerlifting', 'Calisthenics'].map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.disciplineCard, discipline === type && styles.disciplineCardActive]}
                        onPress={() => { setDiscipline(type); setSelectedEx(null); }}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.disciplineIconBox, discipline === type && styles.disciplineIconBoxActive]}>
                            <Ionicons
                                name={type === 'Bodybuilding' ? 'body' : type === 'Powerlifting' ? 'barbell' : 'fitness'}
                                size={32}
                                color={discipline === type ? '#fff' : '#e10600'}
                            />
                        </View>
                        <Text style={[styles.disciplineText, discipline === type && styles.disciplineTextActive]}>
                            {type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {discipline && (
                <View style={styles.exerciseSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Hareketler</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.exerciseList}>
                        {workoutData[discipline].map((ex: any) => (
                            <TouchableOpacity
                                key={ex.name}
                                style={[styles.exerciseCard, selectedEx === ex.name && styles.exerciseCardActive]}
                                onPress={() => setSelectedEx(ex.name)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.exerciseContent}>
                                    <Text style={[styles.exerciseName, selectedEx === ex.name && styles.exerciseNameActive]}>
                                        {ex.name}
                                    </Text>
                                    <View style={styles.exerciseMeta}>
                                        <View style={[styles.targetBadge, selectedEx === ex.name && styles.targetBadgeActive]}>
                                            <Text style={[styles.targetText, selectedEx === ex.name && styles.targetTextActive]}>
                                                {ex.target}
                                            </Text>
                                        </View>
                                        <View style={styles.diffBadge}>
                                            <Text style={styles.diffText}>{ex.diff}</Text>
                                        </View>
                                    </View>
                                </View>
                                {selectedEx === ex.name && (
                                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {selectedEx && (
                <View style={styles.inputSection}>
                    <View style={styles.inputHeader}>
                        <Ionicons name="create" size={20} color="#e10600" />
                        <Text style={styles.inputTitle}>{selectedEx}</Text>
                    </View>

                    <View style={styles.inputGrid}>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputLabel}>Set</Text>
                            <TextInput
                                style={styles.inputField}
                                keyboardType="numeric"
                                value={sets}
                                onChangeText={setSets}
                                placeholder="3"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputLabel}>Tekrar</Text>
                            <TextInput
                                style={styles.inputField}
                                keyboardType="numeric"
                                value={reps}
                                onChangeText={setReps}
                                placeholder="10"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.inputLabel}>Ağırlık (kg)</Text>
                            <TextInput
                                style={styles.inputField}
                                keyboardType="numeric"
                                value={weight}
                                onChangeText={setWeight}
                                placeholder="0"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.9}>
                        <Ionicons name="checkmark-circle" size={22} color="#fff" />
                        <Text style={styles.saveButtonText}>Antrenmanı Kaydet</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Geçmiş Antrenmanlar</Text>
                <View style={styles.dividerLine} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#e10600" size="large" />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="fitness-outline" size={64} color="#DDD" />
                    <Text style={styles.emptyText}>Henüz antrenman kaydın yok</Text>
                    <Text style={styles.emptySubtext}>İlk antrenmanını ekleyerek başla!</Text>
                </View>
            ) : (
                history.map((item) => (
                    <View key={item.id} style={styles.historyCard}>
                        <View style={styles.historyLeft}>
                            <View style={styles.historyIconBox}>
                                <Ionicons name="barbell" size={20} color="#e10600" />
                            </View>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyExercise}>{item.exercise}</Text>
                                <View style={styles.historyDetails}>
                                    <Text style={styles.historyDetailText}>
                                        {item.sets}×{item.reps}
                                    </Text>
                                    {item.weight !== "0" && (
                                        <>
                                            <View style={styles.dot} />
                                            <Text style={styles.historyDetailText}>{item.weight}kg</Text>
                                        </>
                                    )}
                                    <View style={styles.dot} />
                                    <Text style={styles.historyDetailText}>{formatTime(item.createdAt)}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteButton}>
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
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24
    },
    header: {
        marginTop: 60,
        marginBottom: 30
    },
    mainTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1A1A1A',
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 15,
        color: '#888',
        marginTop: 6,
        fontWeight: '500'
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center'
    },
    statIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A1A1A',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600'
    },
    sectionHeader: {
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 8
    },
    dividerLine: {
        height: 3,
        width: 40,
        backgroundColor: '#e10600',
        borderRadius: 2
    },
    disciplineContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32
    },
    disciplineCard: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    disciplineCardActive: {
        backgroundColor: '#e10600',
        borderColor: '#e10600'
    },
    disciplineIconBox: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    disciplineIconBoxActive: {
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    disciplineText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center'
    },
    disciplineTextActive: {
        color: '#FFF'
    },
    exerciseSection: {
        marginBottom: 32
    },
    exerciseList: {
        gap: 10
    },
    exerciseCard: {
        backgroundColor: '#F7F8FA',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: 'transparent'
    },
    exerciseCardActive: {
        backgroundColor: '#e10600',
        borderColor: '#e10600'
    },
    exerciseContent: {
        flex: 1
    },
    exerciseName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8
    },
    exerciseNameActive: {
        color: '#FFF'
    },
    exerciseMeta: {
        flexDirection: 'row',
        gap: 8
    },
    targetBadge: {
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    targetBadgeActive: {
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    targetText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#e10600'
    },
    targetTextActive: {
        color: '#FFF'
    },
    diffBadge: {
        backgroundColor: '#FFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    diffText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#888'
    },
    inputSection: {
        backgroundColor: '#F7F8FA',
        borderRadius: 20,
        padding: 20,
        marginBottom: 32
    },
    inputHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8
    },
    inputTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A'
    },
    inputGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16
    },
    inputBox: {
        flex: 1
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        marginBottom: 8
    },
    inputField: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center'
    },
    saveButton: {
        backgroundColor: '#e10600',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#e10600',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800'
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#888',
        marginTop: 16
    },
    emptySubtext: {
        fontSize: 14,
        color: '#AAA',
        marginTop: 4
    },
    historyCard: {
        backgroundColor: '#F7F8FA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    historyLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    historyIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center'
    },
    historyInfo: {
        flex: 1
    },
    historyExercise: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4
    },
    historyDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    historyDetailText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600'
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CCC'
    },
    deleteButton: {
        padding: 8
    }
});