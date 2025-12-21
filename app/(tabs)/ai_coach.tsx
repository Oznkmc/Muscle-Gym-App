import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit } from 'firebase/firestore';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";


interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

interface UserStats {
    protein: number;
    fat: number;
    carb: number;
    kcal: number;
    workoutCount: number;
    weeklyGoal: number;
    weeklyWorkoutCount: number;
}

interface MealItem {
    title: string;
    quantity: string;
    protein: string;
    kcal: string;
    fat?: string;
    carb?: string;
    time: string;
}

interface WorkoutItem {
    discipline: string;
    exercise: string;
    sets: string;
    weight: string;
    time: string;
}

interface MeasurementItem {
    weight: string;
    arm?: string;
    chest?: string;
    waist?: string;
    bodyFat?: string;
    neck?: string;
    thigh?: string;
    calf?: string;
    date: string;
}

export default function AICoachScreen() {
    const [input, setInput] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    const [userStats, setUserStats] = useState<UserStats>({
        kcal: 0,
        protein: 0,
        fat: 0,
        carb: 0,
        workoutCount: 0,
        weeklyGoal: 4,
        weeklyWorkoutCount: 0
    });

    const [todayMeals, setTodayMeals] = useState<MealItem[]>([]);
    const [recentWorkouts, setRecentWorkouts] = useState<WorkoutItem[]>([]);
    const [latestMeasurement, setLatestMeasurement] = useState<MeasurementItem | null>(null);
    const [previousMeasurement, setPreviousMeasurement] = useState<MeasurementItem | null>(null);
    const [weeklyMeals, setWeeklyMeals] = useState<MealItem[]>([]);

    const scrollViewRef = useRef<ScrollView>(null);
    const user = auth.currentUser;
    const userDisplayName = user?.email?.split('@')[0] || "Şampiyon";

    useEffect(() => {
        if (!user) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);


        const qDiet = query(
            collection(db, "userDiets"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubDiet = onSnapshot(qDiet, (snapshot) => {
            let p = 0, k = 0, f = 0, c = 0;
            const todayItems: MealItem[] = [];
            const weekItems: MealItem[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate();

                if (createdAt >= startOfToday) {
                    p += parseFloat(data.protein || 0);
                    k += parseFloat(data.kcal || 0);
                    f += parseFloat(data.fat || 0);
                    c += parseFloat(data.carb || 0);

                    todayItems.push({
                        title: data.title,
                        quantity: data.quantity,
                        protein: data.protein,
                        kcal: data.kcal,
                        fat: data.fat,
                        carb: data.carb,
                        time: createdAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    });
                }

                if (createdAt >= startOfWeek) {
                    weekItems.push({
                        title: data.title,
                        quantity: data.quantity,
                        protein: data.protein,
                        kcal: data.kcal,
                        time: createdAt.toLocaleDateString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
                    });
                }
            });

            setUserStats(prev => ({ ...prev, protein: p, kcal: k, fat: f, carb: c }));
            setTodayMeals(todayItems);
            setWeeklyMeals(weekItems);
        });


        const qWorkouts = query(
            collection(db, "userWorkouts"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        const unsubWorkouts = onSnapshot(qWorkouts, (snapshot) => {
            let todayCount = 0;
            let weekCount = 0;
            const workoutItems: WorkoutItem[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate();

                if (createdAt >= startOfToday) todayCount++;
                if (createdAt >= startOfWeek) weekCount++;

                workoutItems.push({
                    discipline: data.discipline,
                    exercise: data.exercise,
                    sets: data.sets,
                    weight: data.weight,
                    time: createdAt.toLocaleDateString('tr-TR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
                });
            });

            setUserStats(prev => ({ ...prev, workoutCount: todayCount, weeklyWorkoutCount: weekCount }));
            setRecentWorkouts(workoutItems);
        });
        const qMeasurements = query(
            collection(db, "userMeasurements"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(2)
        );

        const unsubMeasurements = onSnapshot(qMeasurements, (snapshot) => {
            const measurements = snapshot.docs.map(doc => doc.data());

            if (measurements.length > 0) {
                const latest = measurements[0];
                setLatestMeasurement({
                    weight: latest.weight,
                    arm: latest.arm,
                    chest: latest.chest,
                    waist: latest.waist,
                    bodyFat: latest.bodyFat,
                    neck: latest.neck,
                    thigh: latest.thigh,
                    calf: latest.calf,
                    date: latest.createdAt?.toDate().toLocaleDateString('tr-TR') || 'Bilinmiyor'
                });
            }

            if (measurements.length > 1) {
                const previous = measurements[1];
                setPreviousMeasurement({
                    weight: previous.weight,
                    arm: previous.arm,
                    chest: previous.chest,
                    waist: previous.waist,
                    bodyFat: previous.bodyFat,
                    date: previous.createdAt?.toDate().toLocaleDateString('tr-TR') || 'Bilinmiyor'
                });
            }

            setDataLoading(false);
        });

        return () => {
            unsubDiet();
            unsubWorkouts();
            unsubMeasurements();
        };
    }, [user?.uid]);

    const saveChatHistory = async (messages: Message[]) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "chatHistory"), {
                userId: user.uid,
                messages: messages.slice(-10),
                timestamp: new Date()
            });
        } catch (error) {
            console.log("Chat kaydetme hatası:", error);
        }
    };


    const getSystemPrompt = () => {
        const progressPercent = ((userStats.weeklyWorkoutCount / userStats.weeklyGoal) * 100).toFixed(0);

        const mealsSummary = todayMeals.length > 0
            ? todayMeals.map(m => `- ${m.quantity} ${m.title} (${m.protein}g protein, ${m.kcal} kcal) - ${m.time}`).join('\n')
            : "Henüz hiçbir şey yemedi.";

        const workoutSummary = recentWorkouts.length > 0
            ? recentWorkouts.slice(0, 5).map(w => `- ${w.exercise} (${w.sets} set, ${w.weight}kg) [${w.discipline}] - ${w.time}`).join('\n')
            : "Henüz antrenman yapmadı.";


        let measurementInfo = "";
        if (latestMeasurement) {
            measurementInfo = `📏 GÜNCEL VÜCUT ÖLÇÜLERİ (${latestMeasurement.date}):
- Kilo: ${latestMeasurement.weight}kg
- Kol: ${latestMeasurement.arm || '-'} cm
- Göğüs: ${latestMeasurement.chest || '-'} cm
- Bel: ${latestMeasurement.waist || '-'} cm
- Boyun: ${latestMeasurement.neck || '-'} cm
- Bacak: ${latestMeasurement.thigh || '-'} cm
- Baldır: ${latestMeasurement.calf || '-'} cm
- Yağ Oranı: ${latestMeasurement.bodyFat || '-'}%`;


            if (previousMeasurement) {
                const weightDiffNum = parseFloat(latestMeasurement.weight) - parseFloat(previousMeasurement.weight);
                const weightDiff = weightDiffNum.toFixed(1);

                const armDiff = latestMeasurement.arm && previousMeasurement.arm
                    ? (parseFloat(latestMeasurement.arm) - parseFloat(previousMeasurement.arm)).toFixed(1)
                    : null;
                const waistDiff = latestMeasurement.waist && previousMeasurement.waist
                    ? (parseFloat(latestMeasurement.waist) - parseFloat(previousMeasurement.waist)).toFixed(1)
                    : null;

                measurementInfo += `\n\n🔄 GELİŞİM KARŞILAŞTIRMASI (Önceki ölçüm: ${previousMeasurement.date}):
- Kilo: ${weightDiffNum > 0 ? '+' : ''}${weightDiff}kg
${armDiff ? `- Kol: ${parseFloat(armDiff) > 0 ? '+' : ''}${armDiff}cm` : ''}
${waistDiff ? `- Bel: ${parseFloat(waistDiff) > 0 ? '+' : ''}${waistDiff}cm` : ''}`;
            }
        } else {
            measurementInfo = "⚠️ Henüz vücut ölçümü kaydı yok. Gelişimini takip edebilmem için lütfen ilk ölçümlerini ekle!";
        }

        return `Sen Muscle Gym uygulamasının kişisel fitness koçu olan "Coach AI"sin. Motivasyonel, samimi, bilgili ve destekleyici bir yaklaşımın var.

👤 KULLANICI PROFİLİ:
- İsim: ${userDisplayName}

${measurementInfo}

🍽️ BUGÜNKÜ BESLENME DURUMU:
- Toplam Kalori: ${userStats.kcal.toFixed(0)} kcal
- Protein: ${userStats.protein.toFixed(1)}g
- Yağ: ${userStats.fat.toFixed(1)}g
- Karbonhidrat: ${userStats.carb.toFixed(1)}g

Bugün Yedikleri:
${mealsSummary}

💪 ANTRENMAN DURUMU:
- Bu Hafta: ${userStats.weeklyWorkoutCount}/${userStats.weeklyGoal} antrenman (%${progressPercent} tamamlandı)
- Bugünkü Antrenman: ${userStats.workoutCount > 0 ? 'Yapıldı ✅' : 'Henüz yapılmadı ⏳'}

Son Antrenmanlar:
${workoutSummary}

🎯 GÖREVLERİN:
1. Kullanıcının TÜM verilerini (beslenme, antrenman, vücut ölçüleri) analiz ederek kişiselleştirilmiş öneriler sun
2. Vücut ölçümlerindeki değişimleri yorumla ve gelişim hakkında yorum yap
3. Beslenme, antrenman ve vücut gelişimi arasında bağlantı kur
4. Eksiklikleri nazikçe belirt, başarıları coşkuyla kutla
5. Spor bilimi ve beslenme bilgisine dayalı pratik tavsiyeler ver
6. Kısa, net ve uygulanabilir cevaplar ver (2-5 cümle ideal)
7. Emoji kullanarak samimi ol ama abartma 💪

⚠️ ÖNEMLİ KURALLAR:
- Tıbbi tavsiye verme, genel fitness önerileri sun
- Her cevabı kullanıcının mevcut verilerine göre özelleştir
- Gerçekçi ve sürdürülebilir öneriler yap
- Kullanıcıyı motive et, ancak baskı yapma
- Türkçe konuş ve samimi ol
- Vücut ölçümlerindeki değişimleri pozitif bir şekilde yorumla

📌 ÖRNEK YAKLAŞIMLAR:
- Eğer kol ölçüsü artmışsa: "Kol kasların 0.5cm büyümüş! Antrenmanların meyve veriyor 💪 Bu gelişim harika!"
- Eğer bel ölçüsü azalmışsa: "Bel bölgesi incelmişken kas kütlesi artıyor. Tam istediğimiz şey! 🔥"
- Eğer kilo değişmezken kas artıyorsa: "Kilo sabit ama vücut kompozisyonun değişiyor. Yağ azalıp kas artıyor! 🎯"
- Eğer protein düşükse: "Protein alımın bugün biraz düşük kalmış. Akşam yemeğinde tavuk veya yumurta eklersen hedefine ulaşırsın! 🥚"
- Eğer antrenman yapmadıysa: "Bugün henüz antrenman yapmadın ama gün henüz bitmedi! Kısa bir egzersiz bile fark yaratır 💪"`;
    };

    const handleChat = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg: Message = {
            role: "user",
            content: input,
            timestamp: new Date()
        };

        setChatHistory(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const messages: Message[] = [
                { role: "system", content: getSystemPrompt() },
                ...chatHistory.slice(-8).map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                { role: "user", content: input }
            ];

            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    temperature: 0.8,
                    max_tokens: 600,
                    top_p: 0.95,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            const assistantMsg: Message = {
                role: "assistant",
                content: aiResponse,
                timestamp: new Date()
            };

            setChatHistory(prev => [...prev, assistantMsg]);
            await saveChatHistory([...chatHistory, userMsg, assistantMsg]);

        } catch (error: any) {
            console.log("AI Bağlantı Hatası:", error.message);
            const errorMsg: Message = {
                role: "assistant",
                content: "Üzgünüm, şu an bağlantı kuramıyorum. Lütfen tekrar dene! 🔄",
                timestamp: new Date()
            };
            setChatHistory(prev => [...prev, errorMsg]);
            Alert.alert("Bağlantı Hatası", "Yapay zeka servisine ulaşılamadı. İnternet bağlantını kontrol et.");
        } finally {
            setIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const quickQuestions = [
        latestMeasurement && previousMeasurement ? "Gelişimimi analiz eder misin?" : "Ölçülerimi nasıl kaydederim?",
        userStats.protein < 50 ? "Proteinimi nasıl artırırım?" : "Protein alımım yeterli mi?",
        userStats.workoutCount === 0 ? "Bugün hangi antrenmanı yapmalıyım?" : "Antrenmanımı değerlendirir misin?",
        "Motivasyona ihtiyacım var"
    ];

    const handleQuickQuestion = (question: string) => {
        setInput(question);
    };

    if (dataLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#e10600" />
                <Text style={{ marginTop: 10, color: '#888' }}>Verileriniz yükleniyor...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.header}>
                    <Ionicons name="fitness" size={24} color="#e10600" />
                    <Text style={styles.headerTitle}>AI Fitness Coach</Text>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Groq ⚡</Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScrollContainer}>
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Ionicons name="flame" size={20} color="#FF9500" />
                            <Text style={styles.statValue}>{userStats.kcal.toFixed(0)}</Text>
                            <Text style={styles.statLabel}>Kalori</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="egg" size={20} color="#e10600" />
                            <Text style={styles.statValue}>{userStats.protein.toFixed(0)}g</Text>
                            <Text style={styles.statLabel}>Protein</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="barbell" size={20} color="#34C759" />
                            <Text style={styles.statValue}>{userStats.weeklyWorkoutCount}/{userStats.weeklyGoal}</Text>
                            <Text style={styles.statLabel}>Antrenman</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="body" size={20} color="#5856D6" />
                            <Text style={styles.statValue}>{latestMeasurement?.weight || '--'}kg</Text>
                            <Text style={styles.statLabel}>Kilo</Text>
                        </View>
                    </View>
                </ScrollView>

                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.chatArea}
                    showsVerticalScrollIndicator={false}
                >
                    {chatHistory.length === 0 ? (
                        <View style={styles.welcomeBox}>
                            <Text style={styles.welcomeEmoji}>💪</Text>
                            <Text style={styles.welcomeText}>Merhaba {userDisplayName}!</Text>
                            <Text style={styles.welcomeSub}>
                                Tüm beslenme, antrenman ve vücut ölçüm verilerini analiz ediyorum. Hedeflerine ulaşman için buradayım!
                            </Text>


                            <View style={styles.summaryCard}>
                                {latestMeasurement && (
                                    <View style={styles.summaryRow}>
                                        <Ionicons name="body" size={20} color="#5856D6" />
                                        <Text style={styles.summaryText}>
                                            Son ölçüm: {latestMeasurement.weight}kg{latestMeasurement.arm ? `, Kol: ${latestMeasurement.arm}cm` : ''} 📏
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.summaryRow}>
                                    <Ionicons name={userStats.protein >= 80 ? "checkmark-circle" : "alert-circle"} size={20} color={userStats.protein >= 80 ? "#34C759" : "#FF9500"} />
                                    <Text style={styles.summaryText}>
                                        {userStats.protein >= 80 ? "Protein hedefine ulaştın! 🎯" : "Protein alımını artırmalısın 💪"}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Ionicons name={userStats.workoutCount > 0 ? "checkmark-circle" : "time"} size={20} color={userStats.workoutCount > 0 ? "#34C759" : "#888"} />
                                    <Text style={styles.summaryText}>
                                        {userStats.workoutCount > 0 ? "Bugün antrenman yaptın! 🔥" : "Bugün henüz antrenman yapmadın ⏳"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.quickQuestions}>
                                <Text style={styles.quickTitle}>Hızlı Sorular:</Text>
                                {quickQuestions.map((q, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.quickBtn}
                                        onPress={() => handleQuickQuestion(q)}
                                    >
                                        <Text style={styles.quickBtnText}>{q}</Text>
                                        <Ionicons name="arrow-forward" size={14} color="#e10600" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ) : (
                        chatHistory.map((msg, index) => (
                            <View key={index} style={[
                                styles.msgWrapper,
                                msg.role === 'user' ? styles.userWrapper : styles.assistantWrapper
                            ]}>
                                {msg.role === 'assistant' && (
                                    <View style={styles.coachAvatar}>
                                        <Ionicons name="fitness" size={16} color="#fff" />
                                    </View>
                                )}
                                <View style={[
                                    styles.msgBubble,
                                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                                ]}>
                                    <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>
                                        {msg.content}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                    {isTyping && (
                        <View style={styles.typingIndicator}>
                            <ActivityIndicator color="#e10600" size="small" />
                            <Text style={styles.typingText}>Coach AI analiz ediyor...</Text>
                        </View>
                    )}
                </ScrollView>


                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Sorunu yaz..."
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleChat}
                        placeholderTextColor="#999"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        onPress={handleChat}
                        style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
                        disabled={!input.trim() || isTyping}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginLeft: 10, flex: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: '600', color: '#666' },
    statsScrollContainer: { maxHeight: 100, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
    statsCard: { flexDirection: 'row', padding: 16, gap: 12 },
    statItem: { alignItems: 'center', minWidth: 70 },
    statValue: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 6 },
    statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
    statDivider: { width: 1, backgroundColor: '#eee' },
    chatArea: { padding: 16, paddingBottom: 100 },
    welcomeBox: { alignItems: 'center', paddingVertical: 30 },
    welcomeEmoji: { fontSize: 64 },
    welcomeText: { fontSize: 24, fontWeight: '700', color: '#333', marginTop: 16 },
    welcomeSub: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    summaryCard: { marginTop: 24, backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    summaryText: { fontSize: 14, color: '#333', marginLeft: 12, flex: 1 },
    quickQuestions: { marginTop: 24, width: '100%' },
    quickTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
    quickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e0e0e0' },
    quickBtnText: { fontSize: 13, color: '#333', fontWeight: '500' },
    msgWrapper: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
    userWrapper: { alignSelf: 'flex-end' },
    assistantWrapper: { alignSelf: 'flex-start' },
    coachAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e10600', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    msgBubble: { padding: 12, borderRadius: 16, maxWidth: '100%' },
    userBubble: { backgroundColor: '#e10600', borderBottomRightRadius: 4 },
    assistantBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    userText: { fontSize: 14, color: '#fff', lineHeight: 20 },
    assistantText: { fontSize: 14, color: '#333', lineHeight: 20 },
    typingIndicator: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0f0f0', borderRadius: 16, alignSelf: 'flex-start', maxWidth: '60%' },
    typingText: { fontSize: 13, color: '#666', marginLeft: 8 },
    inputContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: Platform.OS === 'ios' ? 32 : 12 },
    textInput: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#333', maxHeight: 100 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e10600', justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
    sendBtnDisabled: { opacity: 0.5 }
});