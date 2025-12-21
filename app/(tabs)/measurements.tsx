import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Dimensions
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

    // Form State'leri
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

    // İlerleme Hesaplama
    const getProgress = (field: string) => {
        if (!currentStats || !previousStats) return { value: 0, icon: 'remove', color: '#888' };

        const current = parseFloat(currentStats[field] || 0);
        const previous = parseFloat(previousStats[field] || 0);
        const diff = current - previous;

        // Kilo için azalma iyi, diğerleri için artış iyi
        const isGood = field === 'waist' || field === 'bodyFat'
            ? diff < 0
            : diff > 0;

        return {
            value: Math.abs(diff).toFixed(1),
            icon: diff > 0 ? 'trending-up' : diff < 0 ? 'trending-down' : 'remove',
            color: isGood ? '#34C759' : diff === 0 ? '#888' : '#FF3B30'
        };
    };

    const handleSave = async () => {
        if (!weight || !arm) {
            Alert.alert("Hata", "Kilo ve Kol ölçüsünü girmelisin.");
            return;
        }

        try {
            await addDoc(collection(db, "userMeasurements"), {
                userId: user?.uid,
                weight,
                arm,
                chest: chest || "-",
                waist: waist || "-",
                bodyFat: bodyFat || "-",
                neck: neck || "-",
                thigh: thigh || "-",
                calf: calf || "-",
                createdAt: serverTimestamp()
            });

            // Formu temizle
            setWeight(''); setArm(''); setChest(''); setWaist('');
            setBodyFat(''); setNeck(''); setThigh(''); setCalf('');
            setShowAdvanced(false);

            Alert.alert("Başarılı! 🎉", "Ölçülerin kaydedildi. AI Coach'a danışarak gelişimini analiz edebilirsin!");
        } catch (e) {
            Alert.alert("Hata", "Kaydedilemedi.");
        }
    };

    const confirmDelete = (id: string) => {
        Alert.alert("Sil", "Bu ölçüm kaydını silmek istiyor musun?", [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => deleteDoc(doc(db, "userMeasurements", id)) }
        ]);
    };

    // BMI Hesaplama (örnek boy: 175cm)
    const calculateBMI = () => {
        if (!currentStats?.weight) return null;
        const heightInMeters = 1.75; // Kullanıcıdan alınabilir
        const bmi = parseFloat(currentStats.weight) / (heightInMeters * heightInMeters);
        return bmi.toFixed(1);
    };

    const getBMIStatus = () => {
        const bmi = calculateBMI();
        if (!bmi) return { text: '--', color: '#888' };
        const val = parseFloat(bmi);

        if (val < 18.5) return { text: 'Zayıf', color: '#FF9500' };
        if (val < 25) return { text: 'Normal', color: '#34C759' };
        if (val < 30) return { text: 'Fazla Kilolu', color: '#FF9500' };
        return { text: 'Obez', color: '#FF3B30' };
    };

    const bmiStatus = getBMIStatus();

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.mainTitle}>Vücut Takibi 📏</Text>

            {/* GÜNCEL DURUM KARTI */}
            <View style={styles.currentCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardHeaderTitle}>Güncel Formun</Text>
                    {currentStats && (
                        <Text style={styles.lastUpdate}>
                            {currentStats.createdAt?.toDate().toLocaleDateString('tr-TR')}
                        </Text>
                    )}
                </View>

                <View style={styles.statGrid}>
                    <View style={styles.statBox}>
                        <View style={styles.statTop}>
                            <Text style={styles.statVal}>{currentStats?.weight || '--'}</Text>
                            {previousStats && (
                                <Ionicons
                                    name={getProgress('weight').icon as any}
                                    size={16}
                                    color={getProgress('weight').color}
                                />
                            )}
                        </View>
                        <Text style={styles.statLab}>Kilo (kg)</Text>
                        {previousStats && (
                            <Text style={[styles.statChange, { color: getProgress('weight').color }]}>
                                {getProgress('weight').icon !== 'remove' &&
                                    (getProgress('weight').icon === 'trending-up' ? '+' : '-')
                                }
                                {getProgress('weight').value}kg
                            </Text>
                        )}
                    </View>

                    <View style={styles.statBox}>
                        <View style={styles.statTop}>
                            <Text style={styles.statVal}>{currentStats?.arm || '--'}</Text>
                            {previousStats && (
                                <Ionicons
                                    name={getProgress('arm').icon as any}
                                    size={16}
                                    color={getProgress('arm').color}
                                />
                            )}
                        </View>
                        <Text style={styles.statLab}>Kol (cm)</Text>
                        {previousStats && (
                            <Text style={[styles.statChange, { color: getProgress('arm').color }]}>
                                {getProgress('arm').icon !== 'remove' &&
                                    (getProgress('arm').icon === 'trending-up' ? '+' : '-')
                                }
                                {getProgress('arm').value}cm
                            </Text>
                        )}
                    </View>

                    <View style={styles.statBox}>
                        <View style={styles.statTop}>
                            <Text style={styles.statVal}>{currentStats?.chest || '--'}</Text>
                            {previousStats && (
                                <Ionicons
                                    name={getProgress('chest').icon as any}
                                    size={16}
                                    color={getProgress('chest').color}
                                />
                            )}
                        </View>
                        <Text style={styles.statLab}>Göğüs (cm)</Text>
                        {previousStats && (
                            <Text style={[styles.statChange, { color: getProgress('chest').color }]}>
                                {getProgress('chest').icon !== 'remove' &&
                                    (getProgress('chest').icon === 'trending-up' ? '+' : '-')
                                }
                                {getProgress('chest').value}cm
                            </Text>
                        )}
                    </View>

                    <View style={styles.statBox}>
                        <View style={styles.statTop}>
                            <Text style={styles.statVal}>{currentStats?.waist || '--'}</Text>
                            {previousStats && (
                                <Ionicons
                                    name={getProgress('waist').icon as any}
                                    size={16}
                                    color={getProgress('waist').color}
                                />
                            )}
                        </View>
                        <Text style={styles.statLab}>Bel (cm)</Text>
                        {previousStats && (
                            <Text style={[styles.statChange, { color: getProgress('waist').color }]}>
                                {getProgress('waist').icon !== 'remove' &&
                                    (getProgress('waist').icon === 'trending-up' ? '+' : '-')
                                }
                                {getProgress('waist').value}cm
                            </Text>
                        )}
                    </View>
                </View>

                {/* BMI Göstergesi */}
                {currentStats && (
                    <View style={styles.bmiContainer}>
                        <View style={styles.bmiBox}>
                            <Text style={styles.bmiLabel}>BMI (Örnek)</Text>
                            <Text style={styles.bmiValue}>{calculateBMI() || '--'}</Text>
                        </View>
                        <View style={[styles.bmiStatus, { backgroundColor: bmiStatus.color + '20' }]}>
                            <Text style={[styles.bmiStatusText, { color: bmiStatus.color }]}>
                                {bmiStatus.text}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* FORM KARTI */}
            <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Yeni Ölçü Ekle</Text>

                {/* Temel Ölçüler */}
                <View style={styles.inputGrid}>
                    <View style={styles.inputBox}>
                        <Text style={styles.label}>Kilo (kg) *</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
                            placeholder="75.5"
                        />
                    </View>
                    <View style={styles.inputBox}>
                        <Text style={styles.label}>Kol (cm) *</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={arm}
                            onChangeText={setArm}
                            placeholder="38"
                        />
                    </View>
                    <View style={styles.inputBox}>
                        <Text style={styles.label}>Göğüs (cm)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={chest}
                            onChangeText={setChest}
                            placeholder="105"
                        />
                    </View>
                    <View style={styles.inputBox}>
                        <Text style={styles.label}>Bel (cm)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={waist}
                            onChangeText={setWaist}
                            placeholder="85"
                        />
                    </View>
                </View>

                {/* Gelişmiş Ölçüler Toggle */}
                <TouchableOpacity
                    style={styles.advancedToggle}
                    onPress={() => setShowAdvanced(!showAdvanced)}
                >
                    <Text style={styles.advancedToggleText}>
                        {showAdvanced ? 'Daha Az Göster' : 'Daha Fazla Ölçü Ekle'}
                    </Text>
                    <Ionicons
                        name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#e10600"
                    />
                </TouchableOpacity>

                {/* Gelişmiş Ölçüler */}
                {showAdvanced && (
                    <View style={styles.inputGrid}>
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Boyun (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={neck}
                                onChangeText={setNeck}
                                placeholder="37"
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Bacak (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={thigh}
                                onChangeText={setThigh}
                                placeholder="60"
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Baldır (cm)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={calf}
                                onChangeText={setCalf}
                                placeholder="38"
                            />
                        </View>
                        <View style={styles.inputBox}>
                            <Text style={styles.label}>Yağ Oranı (%)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={bodyFat}
                                onChangeText={setBodyFat}
                                placeholder="15"
                            />
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.saveBtnText}>Ölçüleri Kaydet</Text>
                </TouchableOpacity>
            </View>

            {/* GEÇMİŞ */}
            <Text style={styles.listTitle}>Gelişim Geçmişi ({history.length})</Text>
            {loading ? (
                <ActivityIndicator color="#e10600" style={{ marginTop: 20 }} />
            ) : history.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="stats-chart-outline" size={60} color="#ddd" />
                    <Text style={styles.emptyText}>Henüz ölçüm kaydın yok</Text>
                    <Text style={styles.emptySubtext}>İlk ölçünü ekleyerek başla!</Text>
                </View>
            ) : (
                history.map((item, index) => (
                    <View key={item.id} style={styles.historyCard}>
                        <View style={styles.historyHeader}>
                            <View style={styles.historyBadge}>
                                <Text style={styles.historyBadgeText}>#{history.length - index}</Text>
                            </View>
                            <Ionicons name="calendar-outline" size={14} color="#888" />
                            <Text style={styles.historyDate}>
                                {item.createdAt?.toDate().toLocaleDateString('tr-TR')}
                            </Text>
                            <TouchableOpacity
                                style={{ marginLeft: 'auto' }}
                                onPress={() => confirmDelete(item.id)}
                            >
                                <Ionicons name="trash-outline" size={18} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.historyStatItem}>
                                <Ionicons name="fitness-outline" size={16} color="#e10600" />
                                <Text style={styles.statItemText}>{item.weight}kg</Text>
                            </View>
                            <View style={styles.historyStatItem}>
                                <Ionicons name="body-outline" size={16} color="#34C759" />
                                <Text style={styles.statItemText}>{item.arm}cm</Text>
                            </View>
                            <View style={styles.historyStatItem}>
                                <Ionicons name="shirt-outline" size={16} color="#5856D6" />
                                <Text style={styles.statItemText}>{item.chest}cm</Text>
                            </View>
                            <View style={styles.historyStatItem}>
                                <Ionicons name="ellipse-outline" size={16} color="#FF9500" />
                                <Text style={styles.statItemText}>{item.waist}cm</Text>
                            </View>
                        </View>
                    </View>
                ))
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fb', paddingHorizontal: 20 },
    mainTitle: { fontSize: 28, fontWeight: '800', marginTop: 60, marginBottom: 20, color: '#1a1a1a' },

    currentCard: {
        backgroundColor: '#e10600',
        padding: 20,
        borderRadius: 25,
        marginBottom: 25,
        elevation: 5,
        shadowColor: '#e10600',
        shadowOpacity: 0.3,
        shadowRadius: 10
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    cardHeaderTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700'
    },
    lastUpdate: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12
    },
    statGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 15
    },
    statBox: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 10
    },
    statTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    statVal: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800'
    },
    statLab: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600'
    },
    statChange: {
        fontSize: 9,
        fontWeight: '600',
        marginTop: 2
    },
    bmiContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 12,
        borderRadius: 12,
        marginTop: 10
    },
    bmiBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    bmiLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600'
    },
    bmiValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800'
    },
    bmiStatus: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12
    },
    bmiStatusText: {
        fontSize: 12,
        fontWeight: '700'
    },

    formCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 2,
        marginBottom: 25
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 15,
        color: '#1a1a1a'
    },
    inputGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    inputBox: {
        width: '47%',
        marginBottom: 15
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
        fontWeight: '600'
    },
    input: {
        backgroundColor: '#f5f6f8',
        padding: 12,
        borderRadius: 12,
        fontSize: 15,
        fontWeight: '600'
    },
    advancedToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#f5f6f8',
        borderRadius: 12,
        marginVertical: 10
    },
    advancedToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e10600'
    },
    saveBtn: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 5,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15
    },

    listTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 15,
        color: '#1a1a1a'
    },
    emptyState: {
        alignItems: 'center',
        padding: 40
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
        marginTop: 15
    },
    emptySubtext: {
        fontSize: 13,
        color: '#aaa',
        marginTop: 5
    },
    historyCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 18,
        marginBottom: 12,
        elevation: 1
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10
    },
    historyBadge: {
        backgroundColor: '#e10600',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: 8
    },
    historyBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700'
    },
    historyDate: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        marginLeft: 5
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    historyStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    statItemText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#444'
    }
});