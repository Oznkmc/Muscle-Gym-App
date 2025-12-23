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
// 1. DÜZELTME: SafeAreaView artık buradan gelmeli
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

        await signOut(auth); // Burada çıkış yapıldığında diğer ekranlardaki dinleyiciler hata verebilir.
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
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.inputControl}
                placeholder="E-posta adresiniz"
                value={form.email}
                onChangeText={email => setForm({ ...form, email })}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                secureTextEntry={!isPasswordVisible}
                style={styles.inputControl}
                placeholder="Şifreniz"
                value={form.password}
                onChangeText={password => setForm({ ...form, password })}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPass}>
              <Text style={styles.forgotPassText}>Şifremi Unuttum?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <View style={[styles.btn, loading && { opacity: 0.8 }]}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Giriş Yap</Text>
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
  safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e10600',
    elevation: 5,
  },
  headerImg: { width: '100%', height: '100%' },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  form: { marginBottom: 10 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#E1E6EF',
  },
  inputIcon: { marginRight: 12 },
  inputControl: { flex: 1, color: '#1A1A1A', fontSize: 16 },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPassText: { color: '#e10600', fontWeight: '600', fontSize: 14 },
  btn: {
    backgroundColor: '#e10600',
    borderRadius: 16,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  footer: { marginTop: 20, marginBottom: 20 },
  footerText: { textAlign: 'center', color: '#666', fontSize: 16 },
  footerAction: { color: '#e10600', fontWeight: '700', textDecorationLine: 'underline' },
});