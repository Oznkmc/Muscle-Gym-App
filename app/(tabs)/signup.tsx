import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  SafeAreaView,
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
  Animated,
} from 'react-native';
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

  // Şifre gücü kontrolü
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
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
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
      Alert.alert('Hata', 'Lütfen adınızı girin.');
      return false;
    }

    if (!newValidations.email) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return false;
    }

    if (!newValidations.phone) {
      Alert.alert('Hata', 'Lütfen geçerli bir telefon numarası girin (10 haneli).');
      return false;
    }

    if (!newValidations.password) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return false;
    }

    if (!newValidations.confirmPassword) {
      Alert.alert('Hata', 'Şifreler birbiriyle eşleşmiyor.');
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
            style: 'default'
          }
        ]
      );

    } catch (error: any) {
      let msg = 'Kayıt yapılamadı. Lütfen tekrar dene.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı dene!';
      }
      if (error.code === 'auth/invalid-email') {
        msg = 'Geçersiz e-posta formatı.';
      }
      if (error.code === 'auth/weak-password') {
        msg = 'Şifre çok zayıf. Daha güçlü bir şifre seç.';
      }
      Alert.alert('Kayıt Hatası', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/images/logo.jpeg')}
                  style={styles.headerImg}
                  resizeMode="contain"
                />
                <View style={styles.logoBadge}>
                  <Ionicons name="fitness" size={20} color="#fff" />
                </View>
              </View>
              <Text style={styles.title}>Hesap Oluştur</Text>
              <Text style={styles.subtitle}>
                Fitness yolculuğuna bugün başla! 💪
              </Text>
            </View>


            <View style={styles.form}>

        
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ad Soyad</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'name' && styles.inputWrapperFocused,
                  form.name.trim() && styles.inputWrapperValid
                ]}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={focusedField === 'name' ? '#e10600' : '#666'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputControl}
                    placeholder="Adın ve soyadın"
                    placeholderTextColor="#aaa"
                    value={form.name}
                    onChangeText={name => setForm({ ...form, name })}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {form.name.trim() && (
                    <Ionicons name="checkmark-circle" size={20} color="#00c853" />
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>E-posta Adresi</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused,
                  !validations.email && form.email && styles.inputWrapperError,
                  validations.email && form.email && styles.inputWrapperValid
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={focusedField === 'email' ? '#e10600' : '#666'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputControl}
                    placeholder="ornek@email.com"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
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
              </View>

              {/* Telefon */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefon Numarası</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'phone' && styles.inputWrapperFocused,
                  !validations.phone && form.phone && styles.inputWrapperError,
                  validations.phone && form.phone && styles.inputWrapperValid
                ]}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={focusedField === 'phone' ? '#e10600' : '#666'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputControl}
                    placeholder="5XX XXX XX XX"
                    placeholderTextColor="#aaa"
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
                </View>
                {!validations.phone && form.phone && (
                  <Text style={styles.errorText}>En az 10 haneli telefon numarası girin</Text>
                )}
              </View>

              {/* Şifre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şifre</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                  !validations.password && form.password && styles.inputWrapperError
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={focusedField === 'password' ? '#e10600' : '#666'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputControl}
                    placeholder="En az 6 karakter"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showPassword}
                    value={form.password}
                    onChangeText={password => {
                      setForm({ ...form, password });
                      setValidations({ ...validations, password: true });
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>

                {/* Şifre Gücü Göstergesi */}
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
              </View>

        
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şifre Tekrar</Text>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                  !validations.confirmPassword && form.confirmPassword && styles.inputWrapperError,
                  validations.confirmPassword && form.confirmPassword && styles.inputWrapperValid
                ]}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={focusedField === 'confirmPassword' ? '#e10600' : '#666'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputControl}
                    placeholder="Şifreni tekrar gir"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showConfirmPassword}
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
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
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
              </View>

              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={[styles.btn, loading && styles.btnDisabled]}>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>Hesabı Oluştur</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </View>
              </TouchableOpacity>

            
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
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
                  <Ionicons name="log-in-outline" size={20} color="#e10600" />
                  <Text style={styles.secondaryBtnText}>Zaten hesabım var, giriş yap</Text>
                </View>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30
  },
  container: {
    padding: 24
  },

  
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20
  },
  headerImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#e10600'
  },
  logoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#e10600',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f9f9f9'
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1d1d1d',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22
  },


  form: {
    marginBottom: 24
  },
  inputGroup: {
    marginBottom: 20
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e8e8e8',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  inputWrapperFocused: {
    borderColor: '#e10600',
    backgroundColor: '#fff',
    shadowOpacity: 0.1,
    elevation: 4
  },
  inputWrapperError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5'
  },
  inputWrapperValid: {
    borderColor: '#00c853',
    backgroundColor: '#f1f8f4'
  },
  inputIcon: {
    marginRight: 12
  },
  inputControl: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500'
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    gap: 6
  },
  successText: {
    fontSize: 12,
    color: '#00c853',
    fontWeight: '600'
  },


  passwordStrengthContainer: {
    marginTop: 12
  },
  strengthBarBackground: {
    height: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    overflow: 'hidden'
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right'
  },


  passwordRequirements: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    gap: 8
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
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF'
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
    fontWeight: '500'
  },


  btn: {
    backgroundColor: '#e10600',
    borderRadius: 14,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#e10600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 56,
    borderWidth: 2,
    borderColor: '#e10600',
    gap: 8
  },
  secondaryBtnText: {
    color: '#e10600',
    fontSize: 16,
    fontWeight: '700'
  },

  footerContainer: {
    marginTop: 20
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0'
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
    fontWeight: '600'
  }
});