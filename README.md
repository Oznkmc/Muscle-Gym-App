# 🏋️ Yapay Zeka Destekli Fitness Koçu Uygulaması

Android ve iOS platformlarında çalışan, yapay zeka destekli fitness ve beslenme takip mobil uygulaması.

## 🚀 Proje Hakkında

Bu uygulama, kullanıcıların:

- Günlük antrenmanlarını kaydetmesini  
- Set × tekrar × ağırlık üzerinden antrenman hacmini (training volume) hesaplamasını  
- Kalori ve makro takibi yapmasını  
- BMI değişimini izlemesini  
- Yapay zeka destekli kişiselleştirilmiş öneriler almasını  

sağlamak amacıyla geliştirilmiştir.

Uygulama, kullanıcı verilerini analiz eden LLM tabanlı bir **AI Koç** modülü içerir.

---

## 🧠 AI Koç (Groq API – Llama 3.3)

- Groq API entegrasyonu  
- Llama 3.3 modeli ile bağlamsal veri analizi  
- Dinamik prompt oluşturma  
- Kullanıcı hedeflerine göre kişiselleştirilmiş antrenman ve beslenme önerileri  
- Mesajlaşma tabanlı gerçek zamanlı yanıt sistemi  

---

## 🏗️ Kullanılan Teknolojiler

- React Native (Expo)
- Expo Router
- Firebase Authentication
- Firebase Firestore (Gerçek zamanlı veri senkronizasyonu)
- Groq API (Llama 3.3)
- React Hooks (useState, useEffect)
- Lottie Animations

---

## 📊 Temel Özellikler

### 🏋️ Antrenman Takibi
- Set × tekrar × ağırlık hesaplama
- Günlük antrenman hacmi ölçümü
- Performans takibi ve gelişim analizi

### 🥗 Beslenme Takibi
- Kalori ve makro hesaplama
- Özelleştirilmiş besin veritabanı
- BMI hesaplama ve değişim analizi

### 🤖 Yapay Zeka Destekli Analiz
- Kullanıcı verilerine göre öneri üretme
- Diyet ve antrenman optimizasyonu
- Veri odaklı geri bildirim sistemi

### 🎨 Kullanıcı Deneyimi (UI/UX)
- Lottie animasyonları
- Dinamik ilerleme çubukları (progress bar)
- Anlık form doğrulama
- Modern ve akıcı mobil arayüz

---

## 🔐 Mimari Yapı

- Firebase Auth ile güvenli kullanıcı doğrulama
- Firestore ile kullanıcı bazlı gerçek zamanlı veri yönetimi
- Groq API ile asenkron REST entegrasyonu
- Component-based mimari ve optimize edilmiş state yönetimi
