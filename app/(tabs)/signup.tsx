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
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [validations, setValidations] = useState({
    email: true,
    phone: true,
    password: true,
    confirmPassword: true,
  });

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '#ddd' };

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 1) return { strength: 20, label: 'Çok Zayıf', color: '#ff4444' };
    if (strength === 2) return { strength: 40, label: 'Zayıf', color: '#ff9500' };
    if (strength === 3) return { strength: 60, label: 'Orta', color: '#ffcc00' };
    if (strength === 4) return { strength: 80, label: 'İyi', color: '#64dd17' };
    return { strength: 100, label: 'Mükemmel', color: '#00c853' };
  };

  const passwordStrength = getPasswordStrength(form.password);

  const validateEmail = (email: string) => {
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(String(email).toLowerCase());
  };

  const validatePhone = (phone: string) => {
    return phone.length >= 10;
  };

  const validateForm = () => {
    const newValidations = {
      email: validateEmail(form.email.trim()),
      phone: validatePhone(form.phone),
      password: form.password.length >= 6,
      confirmPassword: form.password === form.confirmPassword && form.confirmPassword.length > 0,
    };

    setValidations(newValidations);

    if (!form.name.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen adınızı girin.');
      return false;
    }

    if (!newValidations.email) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi girin.');
      return false;
    }

    if (!newValidations.phone) {
      Alert.alert('Geçersiz Telefon', 'Lütfen geçerli bir telefon numarası girin (10 haneli).');
      return false;
    }

    if (!newValidations.password) {
      Alert.alert('Zayıf Şifre', 'Şifre en az 6 karakter olmalıdır.');
      return false;
    }

    if (!newValidations.confirmPassword) {
      Alert.alert('Şifre Uyuşmazlığı', 'Şifreler birbiriyle eşleşmiyor.');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      await sendEmailVerification(userCredential.user);

      Alert.alert(
        'Başarılı! 🎉',
        `Hoş geldin ${form.name}! ${form.email.trim()} adresine bir doğrulama linki gönderdik. Lütfen e-postanı kontrol et ve linke tıkladıktan sonra giriş yap.`,
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/'),
          }
        ]
      );

    } catch (error: any) {
      let msg = 'Kayıt yapılamadı. Lütfen tekrar dene.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Bu e-posta adresi zaten kayıtlı.';
      }
      if (error.code === 'auth/invalid-email') {
        msg = 'Geçersiz e-posta formatı.';
      }
      if (error.code === 'auth/weak-password') {
        msg = 'Şifre çok zayıf. Daha güçlü bir şifre seç.';
      }
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>Fitness yolculuğuna bugün başla</Text>
          </View>

          <View style={styles.form}>

            <View style={[
              styles.inputWrapper,
              focusedField === 'name' && styles.inputWrapperFocused,
              form.name.trim() && styles.inputWrapperValid
            ]}>
              <Ionicons
                name="person"
                size={18}
                color={focusedField === 'name' ? '#e10600' : '#e10600'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputControl}
                placeholder="Ad Soyad"
                placeholderTextColor="#999"
                value={form.name}
                onChangeText={name => setForm({ ...form, name })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
              {form.name.trim() && (
                <Ionicons name="checkmark-circle" size={20} color="#00c853" />
              )}
            </View>

            <View style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputWrapperFocused,
              !validations.email && form.email && styles.inputWrapperError,
              validations.email && form.email && styles.inputWrapperValid
            ]}>
              <Ionicons
                name="mail"
                size={18}
                color={focusedField === 'email' ? '#e10600' : '#e10600'}
                style={styles.inputIcon}
              />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.inputControl}
                placeholder="E-posta adresiniz"
                placeholderTextColor="#999"
                value={form.email}
                onChangeText={email => {
                  setForm({ ...form, email });
                  setValidations({ ...validations, email: true });
                }}
                onFocus={() => setFocusedField('email')}
                onBlur={() => {
                  setFocusedField(null);
                  if (form.email) {
                    setValidations({ ...validations, email: validateEmail(form.email) });
                  }
                }}
              />
              {validations.email && form.email && (
                <Ionicons name="checkmark-circle" size={20} color="#00c853" />
              )}
              {!validations.email && form.email && (
                <Ionicons name="close-circle" size={20} color="#ff4444" />
              )}
            </View>
            {!validations.email && form.email && (
              <Text style={styles.errorText}>Geçerli bir e-posta adresi girin</Text>
            )}

            <View style={[
              styles.inputWrapper,
              focusedField === 'phone' && styles.inputWrapperFocused,
              !validations.phone && form.phone && styles.inputWrapperError,
              validations.phone && form.phone && styles.inputWrapperValid
            ]}>
              <Ionicons
                name="call"
                size={18}
                color={focusedField === 'phone' ? '#e10600' : '#e10600'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputControl}
                placeholder="Telefon numaranız"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={11}
                value={form.phone}
                onChangeText={phone => {
                  setForm({ ...form, phone });
                  setValidations({ ...validations, phone: true });
                }}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => {
                  setFocusedField(null);
                  if (form.phone) {
                    setValidations({ ...validations, phone: validatePhone(form.phone) });
                  }
                }}
              />
              {validations.phone && form.phone && (
                <Ionicons name="checkmark-circle" size={20} color="#00c853" />
              )}
              {!validations.phone && form.phone && (
                <Ionicons name="close-circle" size={20} color="#ff4444" />
              )}
            </View>
            {!validations.phone && form.phone && (
              <Text style={styles.errorText}>En az 10 haneli telefon numarası girin</Text>
            )}

            <View style={[
              styles.inputWrapper,
              focusedField === 'password' && styles.inputWrapperFocused,
              !validations.password && form.password && styles.inputWrapperError
            ]}>
              <Ionicons
                name="lock-closed"
                size={18}
                color={focusedField === 'password' ? '#e10600' : '#e10600'}
                style={styles.inputIcon}
              />
              <TextInput
                secureTextEntry={!showPassword}
                style={styles.inputControl}
                placeholder="Şifreniz"
                placeholderTextColor="#999"
                value={form.password}
                onChangeText={password => {
                  setForm({ ...form, password });
                  setValidations({ ...validations, password: true });
                }}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {form.password.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.strengthBarBackground}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: `${passwordStrength.strength}%`,
                        backgroundColor: passwordStrength.color
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <View style={styles.passwordRequirements}>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={form.password.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={form.password.length >= 6 ? "#00c853" : "#ccc"}
                />
                <Text style={[
                  styles.requirementText,
                  form.password.length >= 6 && styles.requirementTextMet
                ]}>
                  En az 6 karakter
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/\d/.test(form.password) ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={/\d/.test(form.password) ? "#00c853" : "#ccc"}
                />
                <Text style={[
                  styles.requirementText,
                  /\d/.test(form.password) && styles.requirementTextMet
                ]}>
                  En az bir rakam
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/[A-Z]/.test(form.password) ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={/[A-Z]/.test(form.password) ? "#00c853" : "#ccc"}
                />
                <Text style={[
                  styles.requirementText,
                  /[A-Z]/.test(form.password) && styles.requirementTextMet
                ]}>
                  Büyük harf
                </Text>
              </View>
            </View>

            <View style={[
              styles.inputWrapper,
              focusedField === 'confirmPassword' && styles.inputWrapperFocused,
              !validations.confirmPassword && form.confirmPassword && styles.inputWrapperError,
              validations.confirmPassword && form.confirmPassword && styles.inputWrapperValid
            ]}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={focusedField === 'confirmPassword' ? '#e10600' : '#e10600'}
                style={styles.inputIcon}
              />
              <TextInput
                secureTextEntry={!showConfirmPassword}
                style={styles.inputControl}
                placeholder="Şifre tekrar"
                placeholderTextColor="#999"
                value={form.confirmPassword}
                onChangeText={confirmPassword => {
                  setForm({ ...form, confirmPassword });
                  setValidations({ ...validations, confirmPassword: true });
                }}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => {
                  setFocusedField(null);
                  if (form.confirmPassword) {
                    setValidations({
                      ...validations,
                      confirmPassword: form.password === form.confirmPassword
                    });
                  }
                }}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {!validations.confirmPassword && form.confirmPassword && (
              <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
            )}
            {validations.confirmPassword && form.confirmPassword && (
              <View style={styles.successMessage}>
                <Ionicons name="checkmark-circle" size={16} color="#00c853" />
                <Text style={styles.successText}>Şifreler eşleşiyor!</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              <View style={[styles.btn, loading && { opacity: 0.8 }]}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnContent}>
                    <Text style={styles.btnText}>Kayıt Ol</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#e10600" />
              <Text style={styles.infoText}>
                Kaydını tamamladıktan sonra e-posta adresine gönderilen doğrulama linkine tıklaman gerekiyor.
              </Text>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => router.back()}>
              <View style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Zaten hesabım var, giriş yap</Text>
                <Ionicons name="arrow-forward" size={18} color="#1A1A1A" />
              </View>
            </TouchableOpacity>
          </View>

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
    position: 'relative',
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
  logoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#e10600',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF'
  },
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputWrapperFocused: {
    borderColor: '#e10600',
    backgroundColor: '#FFF',
  },
  inputWrapperError: {
    borderColor: '#ff4444',
    backgroundColor: '#FFF5F5',
  },
  inputWrapperValid: {
    borderColor: '#00c853',
    backgroundColor: '#F1F8F4',
  },
  inputIcon: { marginRight: 14 },
  inputControl: { flex: 1, color: '#1A1A1A', fontSize: 15, fontWeight: '600' },
  eyeBtn: { padding: 4 },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '600'
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
    gap: 6
  },
  successText: {
    fontSize: 12,
    color: '#00c853',
    fontWeight: '600'
  },
  passwordStrengthContainer: {
    marginTop: -8,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  strengthBarBackground: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden'
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right'
  },
  passwordRequirements: {
    marginTop: -4,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    gap: 8,
    marginHorizontal: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  requirementText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500'
  },
  requirementTextMet: {
    color: '#00c853',
    fontWeight: '600'
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderRadius: 20,
    marginTop: 8,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e10600'
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#e10600',
    lineHeight: 18,
    fontWeight: '600'
  },
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
    marginTop: 8,
  },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  footerContainer: {
    marginTop: 24
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0'
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '600'
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 22,
    height: 64,
    gap: 8
  },
  secondaryBtnText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '800'
  },
});