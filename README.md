# PaddyDoc - Rice Disease Diagnosis App

<div align="center">
  <img src="./assets/icon.png" alt="PaddyDoc Logo" width="120" />
</div>

## 🌾 About PaddyDoc

PaddyDoc is a mobile application that helps farmers and agricultural specialists diagnose diseases in rice (paddy) plants. By leveraging AI-powered image analysis through Google's Gemini API, the app provides quick and accurate identification of common rice plant diseases, along with treatment recommendations.

## ✨ Features

- **Disease Detection**: Take photos or upload images of rice plants to identify diseases
- **Detailed Analysis**: Get comprehensive information about detected diseases
- **Treatment Recommendations**: Receive actionable advice on how to treat identified issues
- **User Authentication**: Secure login with Supabase authentication
- **Offline Compatibility**: Store previous diagnoses for reference in low-connectivity areas

## 📱 Download the App

### Android APK

You can download the latest version of the PaddyDoc app using the link below:

[Download PaddyDoc APK v1.0.0](https://github.com/Axdityxa/paddydoc/releases/download/v1.0.0/application-21d7395b-e43c-4a0d-9acf-a3abef945c78.apk)

*Note: When installing, you might need to allow installation from unknown sources in your device settings.*

## 🛠️ Development Setup

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/paddydoc_app.git
   cd paddydoc_app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

## 📲 Building the App

### Android

```bash
npx expo prebuild --clean
eas build -p android --profile preview
```

### iOS

```bash
npx expo prebuild --clean
eas build -p ios --profile preview
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


---

<div align="center">
  Made with ❤️ for paddy farmers
</div> 