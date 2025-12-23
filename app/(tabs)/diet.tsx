import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Dimensions, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../lib/firebase';
import {
    collection, addDoc, query, where, onSnapshot,
    deleteDoc, doc, serverTimestamp, orderBy, updateDoc
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

const foodDatabase: any = {
    "Yumurta": { protein: 6, fat: 5, carb: 0.6, kcal: 75, unit: 'Adet', category: 'protein', icon: 'egg' },
    "Tavuk Göğsü": { protein: 31, fat: 3.6, carb: 0, kcal: 165, unit: '100g', category: 'protein', icon: 'nutrition' },
    "Hindi Göğsü": { protein: 29, fat: 1.5, carb: 0, kcal: 135, unit: '100g', category: 'protein', icon: 'nutrition' },
    "Izgara Somon": { protein: 25, fat: 13, carb: 0, kcal: 206, unit: '100g', category: 'protein', icon: 'fish' },
    "Ton Balığı": { protein: 30, fat: 1, carb: 0, kcal: 130, unit: '100g', category: 'protein', icon: 'fish' },
    "Lor Peyniri": { protein: 13, fat: 1.5, carb: 3, kcal: 85, unit: '100g', category: 'protein', icon: 'cube' },
    "Whey Protein": { protein: 24, fat: 1, carb: 3, kcal: 120, unit: '1 Scoop', category: 'protein', icon: 'flask' },
    "Dana Eti": { protein: 26, fat: 15, carb: 0, kcal: 250, unit: '100g', category: 'protein', icon: 'nutrition' },
    "Yulaf": { protein: 13, fat: 7, carb: 66, kcal: 390, unit: '100g', category: 'carb', icon: 'leaf' },
    "Beyaz Pirinç": { protein: 2.7, fat: 0.3, carb: 28, kcal: 130, unit: '100g', category: 'carb', icon: 'restaurant' },
    "Tam Buğday Ekmeği": { protein: 9, fat: 3, carb: 41, kcal: 247, unit: '100g', category: 'carb', icon: 'pizza' },
    "Patates": { protein: 2, fat: 0.1, carb: 17, kcal: 77, unit: '100g', category: 'carb', icon: 'leaf' },
    "Makarna": { protein: 5, fat: 0.9, carb: 25, kcal: 131, unit: '100g', category: 'carb', icon: 'pizza' },
    "Muz": { protein: 1.1, fat: 0.3, carb: 23, kcal: 89, unit: 'Adet', category: 'carb', icon: 'leaf' },
    "Avokado": { protein: 2, fat: 15, carb: 9, kcal: 160, unit: '100g', category: 'fat', icon: 'leaf' },
    "Zeytinyağı": { protein: 0, fat: 14, carb: 0, kcal: 120, unit: '1 Yemek Kaşığı', category: 'fat', icon: 'water' },
    "Fındık": { protein: 15, fat: 60, carb: 17, kcal: 628, unit: '100g', category: 'fat', icon: 'nutrition' },
    "Brokoli": { protein: 2.8, fat: 0.4, carb: 7, kcal: 34, unit: '100g', category: 'vegetable', icon: 'leaf' },
    "Ispanak": { protein: 2.9, fat: 0.4, carb: 3.6, kcal: 23, unit: '100g', category: 'vegetable', icon: 'leaf' },
    "Elma": { protein: 0.3, fat: 0.2, carb: 14, kcal: 52, unit: 'Adet', category: 'fruit', icon: 'leaf' },
};

const categories = [
    { key: 'all', label: 'Tümü', icon: 'grid', color: '#666' },
    { key: 'protein', label: 'Protein', icon: 'fitness', color: '#e10600' },
    { key: 'carb', label: 'Karbonhidrat', icon: 'flame', color: '#007AFF' },
    { key: 'fat', label: 'Yağ', icon: 'water', color: '#FF9500' },
    { key: 'vegetable', label: 'Sebze', icon: 'leaf', color: '#34C759' },
    { key: 'fruit', label: 'Meyve', icon: 'nutrition', color: '#FF6B9D' },
];

export default function DietScreen() {
    const [selectedFood, setSelectedFood] = useState("Tavuk Göğsü");
    const [quantity, setQuantity] = useState("1");
    const [myMeals, setMyMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const [editingMeal, setEditingMeal] = useState<any>(null);
    const [dailyGoals, setDailyGoals] = useState({ kcal: 2000, protein: 150, fat: 65, carb: 250 });

    const user = auth.currentUser;

    const filteredFoods = useMemo(() => {
        let foods = Object.keys(foodDatabase);
        if (selectedCategory !== 'all') foods = foods.filter(f => foodDatabase[f].category === selectedCategory);
        if (searchQuery.trim()) foods = foods.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
        return foods;
    }, [selectedCategory, searchQuery]);

    const dailyTotals = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayMeals = myMeals.filter(meal => {
            const createdAt = meal.createdAt ? meal.createdAt.toDate() : new Date();
            return createdAt >= startOfToday;
        });
        return todayMeals.reduce((acc, meal) => ({
            protein: acc.protein + parseFloat(meal.protein || 0),
            fat: acc.fat + parseFloat(meal.fat || 0),
            carb: acc.carb + parseFloat(meal.carb || 0),
            kcal: acc.kcal + parseFloat(meal.kcal || 0),
        }), { protein: 0, fat: 0, carb: 0, kcal: 0 });
    }, [myMeals]);

    const progressPercentages = useMemo(() => ({
        kcal: Math.min((dailyTotals.kcal / dailyGoals.kcal) * 100, 100),
        protein: Math.min((dailyTotals.protein / dailyGoals.protein) * 100, 100),
        fat: Math.min((dailyTotals.fat / dailyGoals.fat) * 100, 100),
        carb: Math.min((dailyTotals.carb / dailyGoals.carb) * 100, 100),
    }), [dailyTotals, dailyGoals]);

    const macros = useMemo(() => {
        const food = foodDatabase[selectedFood];
        const qty = parseFloat(quantity) || 0;
        return {
            protein: (food.protein * qty).toFixed(1),
            fat: (food.fat * qty).toFixed(1),
            carb: (food.carb * qty).toFixed(1),
            kcal: (food.kcal * qty).toFixed(0),
        };
    }, [selectedFood, quantity]);

    const formatTime = (timestamp: any) => {
        if (!timestamp) return "Az önce";
        try { return timestamp.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); } catch { return "Az önce"; }
    };

    useEffect(() => {
        // Kullanıcı yoksa dinleyiciyi hiç başlatma veya kapat
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "userDiets"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const mealsArr: any[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    mealsArr.push({ ...data, id: doc.id });
                });
                setMyMeals(mealsArr);
                setLoading(false);
            },
            (error) => {
                // KRİTİK DÜZELTME: Çıkış yaparken veya yetki değişirken oluşan hatayı susturur.
                if (error.code === 'permission-denied' || !auth.currentUser) {
                    return;
                }
                console.error("Firestore Error:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    const handleAddMeal = async () => {
        if (!user) return;
        if (!quantity || parseFloat(quantity) <= 0) {
            Alert.alert("Hata", "Geçerli bir miktar girin.");
            return;
        }
        try {
            const food = foodDatabase[selectedFood];
            const mealData = {
                userId: user.uid,
                title: selectedFood,
                quantity: quantity,
                protein: macros.protein,
                fat: macros.fat,
                carb: macros.carb,
                kcal: macros.kcal,
                unit: food.unit,
                category: food.category,
            };
            if (editingMeal) {
                await updateDoc(doc(db, "userDiets", editingMeal.id), mealData);
                setEditingMeal(null);
            } else {
                await addDoc(collection(db, "userDiets"), {
                    ...mealData,
                    createdAt: serverTimestamp()
                });
            }
            setQuantity("1");
        } catch (e: any) {
            Alert.alert("Hata", "İşlem başarısız.");
        }
    };

    const confirmDelete = (id: string, title: string) => {
        Alert.alert("Kaydı Sil", `${title} öğesini silmek istediğine emin misin?`, [
            { text: "Vazgeç", style: "cancel" },
            { text: "Sil", style: "destructive", onPress: () => deleteDoc(doc(db, "userDiets", id)) }
        ]);
    };

    const handleEditMeal = (meal: any) => {
        setEditingMeal(meal);
        setSelectedFood(meal.title);
        setQuantity(meal.quantity);
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSubtitle}>Hoş geldin,</Text>
                        <Text style={styles.mainTitle}>Beslenme Takibi 🍎</Text>
                    </View>
                    <TouchableOpacity style={styles.goalsBtn} onPress={() => setShowGoalsModal(true)}>
                        <Ionicons name="settings-outline" size={22} color="#e10600" />
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Bugünkü İlerleme</Text>
                    <View style={styles.mainProgress}>
                        <View style={styles.progressHeader}>
                            <View style={styles.progressInfo}>
                                <Ionicons name="flame" size={24} color="#FF6B6B" />
                                <Text style={styles.progressValue}>{dailyTotals.kcal.toFixed(0)} / {dailyGoals.kcal} kcal</Text>
                            </View>
                            <Text style={styles.progressPercent}>{progressPercentages.kcal.toFixed(0)}%</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${progressPercentages.kcal}%`, backgroundColor: '#FF6B6B' }]} />
                        </View>
                    </View>
                    <View style={styles.summaryRow}>
                        {['protein', 'fat', 'carb'].map((m) => (
                            <View key={m} style={styles.summaryItem}>
                                <Text style={styles.macroValue}>{dailyTotals[m as keyof typeof dailyTotals].toFixed(0)}g</Text>
                                <View style={styles.miniProgressBar}>
                                    <View style={[styles.miniProgressFill, {
                                        width: `${progressPercentages[m as keyof typeof progressPercentages]}%`,
                                        backgroundColor: m === 'protein' ? '#e10600' : m === 'fat' ? '#FF9500' : '#007AFF'
                                    }]} />
                                </View>
                                <Text style={styles.summaryLabel}>{m === 'protein' ? 'P' : m === 'fat' ? 'Y' : 'K'}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity key={cat.key} style={[styles.categoryChip, selectedCategory === cat.key && { backgroundColor: cat.color }]} onPress={() => setSelectedCategory(cat.key)}>
                            <Ionicons name={cat.icon as any} size={18} color={selectedCategory === cat.key ? '#fff' : cat.color} />
                            <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>{cat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput style={styles.searchInput} placeholder="Besin ara..." value={searchQuery} onChangeText={setSearchQuery} />
                </View>

                <View style={styles.calculatorCard}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodSelector}>
                        {filteredFoods.map(food => (
                            <TouchableOpacity key={food} style={[styles.foodChip, selectedFood === food && styles.foodChipActive]} onPress={() => setSelectedFood(food)}>
                                <Ionicons name={foodDatabase[food].icon} size={20} color={selectedFood === food ? '#fff' : '#666'} />
                                <Text style={[styles.foodChipText, selectedFood === food && styles.foodChipTextActive]}>{food}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.quantityControl}>
                        <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(q => Math.max(0.5, parseFloat(q) - 0.5).toString())}>
                            <Ionicons name="remove" size={24} color="#e10600" />
                        </TouchableOpacity>
                        <TextInput style={styles.qtyInput} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                        <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity(q => (parseFloat(q) + 0.5).toString())}>
                            <Ionicons name="add" size={24} color="#e10600" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.addBtn, editingMeal && { backgroundColor: '#FF9500' }]} onPress={handleAddMeal}>
                        <Text style={styles.btnText}>{editingMeal ? 'Öğünü Güncelle' : 'Listeme Ekle'}</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.listTitle}>Bugün Neler Yedin?</Text>
                {myMeals.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Henüz bir kayıt yok.</Text>
                ) : (
                    myMeals.map((item) => (
                        <View key={item.id} style={styles.mealItem}>
                            <View style={styles.mealIcon}>
                                <Ionicons name={foodDatabase[item.title]?.icon || 'nutrition'} size={24} color="#e10600" />
                            </View>
                            <View style={styles.mealInfo}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.itemSub}>{item.quantity} {item.unit} • {formatTime(item.createdAt)}</Text>
                                <View style={styles.macroTags}>
                                    <View style={[styles.macroTag, { backgroundColor: '#FFE8E8' }]}><Text style={styles.macroTagText}>{item.kcal} kcal</Text></View>
                                    <View style={[styles.macroTag, { backgroundColor: '#F0F0F0' }]}><Text style={styles.macroTagText}>P: {item.protein}g</Text></View>
                                </View>
                            </View>
                            <View style={styles.mealActions}>
                                <TouchableOpacity onPress={() => handleEditMeal(item)} style={styles.actionBtn}><Ionicons name="pencil-outline" size={18} color="#007AFF" /></TouchableOpacity>
                                <TouchableOpacity onPress={() => confirmDelete(item.id, item.title)} style={styles.actionBtn}><Ionicons name="trash-outline" size={18} color="#FF3B30" /></TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal visible={showGoalsModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Günlük Hedefler</Text>
                            <TouchableOpacity onPress={() => setShowGoalsModal(false)}><Ionicons name="close" size={24} /></TouchableOpacity>
                        </View>
                        <Text style={styles.label}>Kalori Hedefi (kcal)</Text>
                        <TextInput style={styles.goalInput} keyboardType="numeric" value={dailyGoals.kcal.toString()} onChangeText={(v) => setDailyGoals({ ...dailyGoals, kcal: parseInt(v) || 0 })} />
                        <TouchableOpacity style={styles.saveGoalsBtn} onPress={() => setShowGoalsModal(false)}><Text style={styles.saveGoalsBtnText}>Kaydet</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { padding: 25, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between' },
    headerSubtitle: { color: '#666', fontSize: 14 },
    mainTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
    goalsBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 15, elevation: 2 },
    summaryCard: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 25, elevation: 5 },
    summaryTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
    mainProgress: { marginBottom: 20 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    progressInfo: { flexDirection: 'row', alignItems: 'center' },
    progressValue: { fontSize: 16, fontWeight: 'bold', marginLeft: 5 },
    progressPercent: { fontWeight: '800', color: '#FF6B6B' },
    progressBarContainer: { height: 10, backgroundColor: '#EEE', borderRadius: 5, overflow: 'hidden', marginTop: 8 },
    progressBarFill: { height: '100%' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryItem: { flex: 1, alignItems: 'center' },
    macroValue: { fontWeight: 'bold', fontSize: 14 },
    miniProgressBar: { width: '60%', height: 4, backgroundColor: '#EEE', marginVertical: 5 },
    miniProgressFill: { height: '100%' },
    summaryLabel: { fontSize: 10, color: '#999', fontWeight: 'bold' },
    categoryScroll: { paddingLeft: 20, marginBottom: 10 },
    categoryChip: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderRadius: 20, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
    categoryText: { marginLeft: 5, color: '#666', fontWeight: '600' },
    categoryTextActive: { color: '#fff' },
    searchContainer: { flexDirection: 'row', margin: 20, backgroundColor: '#fff', padding: 12, borderRadius: 15, alignItems: 'center' },
    searchInput: { flex: 1, marginLeft: 10 },
    calculatorCard: { margin: 20, backgroundColor: '#fff', padding: 20, borderRadius: 20 },
    foodSelector: { marginBottom: 15 },
    foodChip: { flexDirection: 'row', padding: 10, backgroundColor: '#F0F0F0', borderRadius: 15, marginRight: 10, alignItems: 'center' },
    foodChipActive: { backgroundColor: '#e10600' },
    foodChipText: { marginLeft: 5, fontWeight: '500' },
    foodChipTextActive: { color: '#fff' },
    quantityControl: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 15, padding: 5 },
    quantityBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 12, elevation: 1 },
    qtyInput: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', width: 60 },
    addBtn: { backgroundColor: '#e10600', padding: 15, borderRadius: 15, marginTop: 15, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    listTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 25, marginBottom: 10 },
    mealItem: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, padding: 15, borderRadius: 20, alignItems: 'center' },
    mealIcon: { width: 45, height: 45, backgroundColor: '#FFF0F0', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    mealInfo: { flex: 1, marginLeft: 15 },
    itemTitle: { fontWeight: '700', fontSize: 15 },
    itemSub: { fontSize: 12, color: '#999', marginTop: 2 },
    macroTags: { flexDirection: 'row', marginTop: 5 },
    macroTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginRight: 5 },
    macroTagText: { fontSize: 10, fontWeight: 'bold', color: '#444' },
    mealActions: { flexDirection: 'row' },
    actionBtn: { padding: 8, marginLeft: 5, backgroundColor: '#F8F9FA', borderRadius: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', padding: 25, borderRadius: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    label: { fontSize: 14, color: '#666', marginBottom: 8 },
    goalInput: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16, fontWeight: 'bold' },
    saveGoalsBtn: { backgroundColor: '#e10600', padding: 15, borderRadius: 15, alignItems: 'center' },
    saveGoalsBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});