import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Dimensions, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../lib/firebase';
import {
    collection, addDoc, query, where, onSnapshot,
    orderBy, serverTimestamp, deleteDoc, doc
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function MeasurementsScreen() {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]);

    const [weight, setWeight] = useState('');
    const [arm, setArm] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [neck, setNeck] = useState('');
    const [thigh, setThigh] = useState('');
    const [calf, setCalf] = useState('');

    const [showAdvanced, setShowAdvanced] = useState(false);

    const user = auth.currentUser;
    const currentStats = history[0] || null;
    const previousStats = history[1] || null;

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, "userMeasurements"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const dataArr: any[] = [];
            snapshot.forEach((doc) => dataArr.push({ ...doc.data(), id: doc.id }));
            setHistory(dataArr);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    const getProgress = (field: string) => {
        if (!currentStats || !previousStats) return { value: 0, icon: 'remove', color: '#8E8E93' };
        const current = parseFloat(currentStats[field] || 0);
        const previous = parseFloat(previousStats[field] || 0);
        const diff = current - previous;
        const isGood = field === 'waist' || field === 'bodyFat' ? diff < 0 : diff > 0;

        return {
            value: Math.abs(diff).toFixed(1),
            icon: diff > 0 ? 'trending-up' : diff < 0 ? 'trending-down' : 'remove',
            color: isGood ? '#34C759' : diff === 0 ? '#8E8E93' : '#FF3B30'
        };
    };

    const handleSave = async () => {
        if (!weight || !arm) {
            Alert.alert("Eksik Bilgi", "Kilo ve Kol ölçüsü zorunludur.");
            return;
        }
        try {
            await addDoc(collection(db, "userMeasurements"), {
                userId: user?.uid, weight, arm, chest: chest || "-", waist: waist || "-",
                bodyFat: bodyFat || "-", neck: neck || "-", thigh: thigh || "-", calf: calf || "-",
                createdAt: serverTimestamp()
            });
            setWeight(''); setArm(''); setChest(''); setWaist('');
            setBodyFat(''); setNeck(''); setThigh(''); setCalf('');
            setShowAdvanced(false);
            Alert.alert("Başarılı! 🎉", "Ölçülerin kaydedildi.");
        } catch (e) {
            Alert.alert("Hata", "Kaydedilemedi.");
        }
    };

    const confirmDelete = (id: string) => {
        Alert.alert("Kaydı Sil", "Bu ölçüm verisini silmek istediğine emin misin?", [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => deleteDoc(doc(db, "userMeasurements", id)) }
        ]);
    };

    const calculateBMI = () => {
        if (!currentStats?.weight) return null;
        const heightInMeters = 1.75;
        const bmi = parseFloat(currentStats.weight) / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
    };

    const getBMIStatus = () => {
        const bmi = calculateBMI();
        if (!bmi) return { text: '--', color: '#8E8E93' };
        const val = parseFloat(bmi);
        if (val < 18.5) return { text: 'Zayıf', color: '#FF9500' };
        if (val < 25) return { text: 'Normal', color: '#34C759' };
        if (val < 30) return { text: 'Kilolu', color: '#FF9500' };
        return { text: 'Obez', color: '#FF3B30' };
    };

    const bmiStatus = getBMIStatus();

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.headerArea}>
                <Text style={styles.headerTitle}>Gelişim Takibi</Text>
                <Text style={styles.headerSub}>Fiziğindeki değişimi takip et</Text>
            </View>

            <View style={styles.summaryCard}>
                <View style={styles.summaryHeader}>
                    <View style={styles.badge}><Text style={styles.badgeText}>GÜNCEL DURUM</Text></View>
                    <Text style={styles.dateText}>{currentStats?.createdAt?.toDate().toLocaleDateString('tr-TR') || '--'}</Text>
                </View>

                <View style={styles.statsGrid}>
                    {[
                        { label: 'Kilo', field: 'weight', unit: 'kg' },
                        { label: 'Kol', field: 'arm', unit: 'cm' },
                        { label: 'Göğüs', field: 'chest', unit: 'cm' },
                        { label: 'Bel', field: 'waist', unit: 'cm' }
                    ].map((item, idx) => (
                        <View key={idx} style={styles.statItem}>
                            <Text style={styles.statLabel}>{item.label}</Text>
                            <Text style={styles.statValue}>{currentStats?.[item.field] || '--'}<Text style={styles.unitText}>{item.unit}</Text></Text>
                            {previousStats && (
                                <View style={styles.changeRow}>
                                    <Ionicons name={getProgress(item.field).icon as any} size={12} color={getProgress(item.field).color} />
                                    <Text style={[styles.changeText, { color: getProgress(item.field).color }]}>
                                        {getProgress(item.field).value}{item.unit}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                <View style={styles.bmiSection}>
                    <View style={styles.bmiInfo}>
                        <Text style={styles.bmiTitle}>Vücut Kitle Endeksi (BMI)</Text>
                        <Text style={styles.bmiNote}>Boy 1.75m üzerinden hesaplanır</Text>
                    </View>
                    <View style={[styles.bmiBadge, { backgroundColor: bmiStatus.color }]}>
                        <Text style={styles.bmiVal}>{calculateBMI() || '--'}</Text>
                        <Text style={styles.bmiStatusLabel}>{bmiStatus.text}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.inputCard}>
                <Text style={styles.inputCardTitle}>Yeni Veri Girişi</Text>
                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>Kilo (kg)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} placeholder="0.0" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>Kol (cm)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={arm} onChangeText={setArm} placeholder="0.0" />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>Göğüs (cm)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={chest} onChangeText={setChest} placeholder="0.0" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.fieldLabel}>Bel (cm)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={waist} onChangeText={setWaist} placeholder="0.0" />
                    </View>
                </View>

                {showAdvanced && (
                    <View style={styles.row}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.fieldLabel}>Yağ %</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={bodyFat} onChangeText={setBodyFat} placeholder="0.0" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.fieldLabel}>Boyun (cm)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" value={neck} onChangeText={setNeck} placeholder="0.0" />
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowAdvanced(!showAdvanced)}>
                    <Text style={styles.toggleBtnText}>{showAdvanced ? "Basit Görünüm" : "Detaylı Ölçüm Ekle"}</Text>
                    <Ionicons name={showAdvanced ? "chevron-up" : "chevron-down"} size={16} color="#e10600" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Kaydı Tamamla</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            <Text style={styles.historyTitle}>Geçmiş Kayıtlar</Text>
            {loading ? (
                <ActivityIndicator color="#e10600" style={{ marginTop: 20 }} />
            ) : history.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="document-text-outline" size={40} color="#CCC" />
                    <Text style={styles.emptyText}>Henüz kayıt bulunmuyor.</Text>
                </View>
            ) : (
                history.map((item, idx) => (
                    <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyHeader}>
                            <View style={styles.historyDateRow}>
                                <Ionicons name="calendar-clear-outline" size={14} color="#8E8E93" />
                                <Text style={styles.historyDateText}>{item.createdAt?.toDate().toLocaleDateString('tr-TR')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.historyDataRow}>
                            <View style={styles.hStat}><Text style={styles.hLabel}>Kilo</Text><Text style={styles.hVal}>{item.weight}kg</Text></View>
                            <View style={styles.hStat}><Text style={styles.hLabel}>Kol</Text><Text style={styles.hVal}>{item.arm}cm</Text></View>
                            <View style={styles.hStat}><Text style={styles.hLabel}>Bel</Text><Text style={styles.hVal}>{item.waist}cm</Text></View>
                            <View style={styles.hStat}><Text style={styles.hLabel}>Yağ</Text><Text style={styles.hVal}>%{item.bodyFat}</Text></View>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB', paddingHorizontal: 20 },
    headerArea: { marginTop: 60, marginBottom: 25 },
    headerTitle: { fontSize: 32, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1 },
    headerSub: { fontSize: 15, color: '#8E8E93', fontWeight: '500', marginTop: 4 },
    summaryCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 15, elevation: 3 },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    badge: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '800', color: '#e10600' },
    dateText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    statItem: { width: '48%', marginBottom: 16 },
    statLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 2 },
    statValue: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
    unitText: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginLeft: 2 },
    changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    changeText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
    bmiSection: { marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F2F2F7', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bmiInfo: { flex: 1 },
    bmiTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
    bmiNote: { fontSize: 10, color: '#8E8E93', marginTop: 2 },
    bmiBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, alignItems: 'center', minWidth: 60 },
    bmiVal: { fontSize: 18, fontWeight: '900', color: '#FFF' },
    bmiStatusLabel: { fontSize: 9, fontWeight: '800', color: '#FFF' },
    inputCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 24, marginTop: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
    inputCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    inputGroup: { width: '47%' },
    fieldLabel: { fontSize: 12, fontWeight: '700', color: '#8E8E93', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#F2F2F7', height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
    toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
    toggleBtnText: { fontSize: 13, fontWeight: '700', color: '#e10600', marginRight: 5 },
    saveBtn: { backgroundColor: '#e10600', height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    historyTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginTop: 30, marginBottom: 15 },
    historyItem: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e10600' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    historyDateRow: { flexDirection: 'row', alignItems: 'center' },
    historyDateText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginLeft: 6 },
    historyDataRow: { flexDirection: 'row', justifyContent: 'space-between' },
    hStat: { alignItems: 'flex-start' },
    hLabel: { fontSize: 10, color: '#8E8E93', fontWeight: '600' },
    hVal: { fontSize: 14, fontWeight: '800', color: '#1A1A1A', marginTop: 2 },
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: '#8E8E93', fontWeight: '600', marginTop: 10 }
});