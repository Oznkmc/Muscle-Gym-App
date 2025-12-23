import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function LoginScreen() {
  const router = useRouter();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleLogin = async () => {
    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        Alert.alert(
          'Hesap Doğrulanmadı ⚠️',
          'Lütfen e-postanıza gelen doğrulama linkine tıklayın.',
          [
            { text: 'Tekrar Gönder', onPress: () => sendEmailVerification(user) },
            { text: 'Tamam' },
          ]
        );

        await signOut(auth);
        setLoading(false);
        return;
      }

      router.replace('/explore');
    } catch (error: any) {
      let msg = 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
      if (error.code === 'auth/invalid-credential') msg = 'E-posta veya şifre hatalı.';
      else if (error.code === 'auth/too-many-requests') msg = 'Çok fazla hatalı deneme. Lütfen biraz bekleyin.';

      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!form.email) {
      Alert.alert('E-posta Gerekli', 'Şifre sıfırlama linki için önce e-posta adresinizi yazın.');
      return;
    }
    Alert.alert(
      'Şifre Sıfırlama',
      `${form.email} adresine sıfırlama linki gönderilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, form.email);
              Alert.alert('Başarılı', 'Sıfırlama linki e-postanıza gönderildi.');
            } catch (e) {
              Alert.alert('Hata', 'İşlem sırasında bir sorun oluştu.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/logo.jpeg')}
                style={styles.headerImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Muscle Gym</Text>
            <Text style={styles.subtitle}>Gelişimine kaldığın yerden devam et</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={18} color="#e10600" style={styles.inputIcon} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.inputControl}
                placeholder="E-posta adresiniz"
                placeholderTextColor="#999"
                value={form.email}
                onChangeText={email => setForm({ ...form, email })}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={18} color="#e10600" style={styles.inputIcon} />
              <TextInput
                secureTextEntry={!isPasswordVisible}
                style={styles.inputControl}
                placeholder="Şifreniz"
                placeholderTextColor="#999"
                value={form.password}
                onChangeText={password => setForm({ ...form, password })}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeBtn}>
                <Ionicons
                  name={isPasswordVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPass}>
              <Text style={styles.forgotPassText}>Şifremi Unuttum?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
              <View style={[styles.btn, loading && { opacity: 0.8 }]}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>Giriş Yap</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/signup')}
            style={styles.footer}>
            <Text style={styles.footerText}>
              Hesabınız yok mu? {' '}
              <Text style={styles.footerAction}>Kayıt Ol</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 24 },
  header: { alignItems: 'center', marginTop: 50, marginBottom: 40 },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#e10600',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  headerImg: { width: '100%', height: '100%' },
  title: { fontSize: 34, fontWeight: '900', color: '#1A1A1A', letterSpacing: -1 },
  subtitle: { fontSize: 15, color: '#888', marginTop: 6, fontWeight: '500' },
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 16,
    height: 64,
  },
  inputIcon: { marginRight: 14 },
  inputControl: { flex: 1, color: '#1A1A1A', fontSize: 15, fontWeight: '600' },
  eyeBtn: { padding: 4 },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 28, marginRight: 4 },
  forgotPassText: { color: '#e10600', fontWeight: '700', fontSize: 13 },
  btn: {
    backgroundColor: '#e10600',
    borderRadius: 22,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e10600',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  footer: { marginTop: 32, paddingBottom: 20 },
  footerText: { textAlign: 'center', color: '#999', fontSize: 15, fontWeight: '500' },
  footerAction: { color: '#1A1A1A', fontWeight: '800' },
});