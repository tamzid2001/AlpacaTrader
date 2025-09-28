# MarketDifferentials Mobile App

This is the React Native mobile application for the MarketDifferentials LMS platform, built with Expo.

## Features

- **Authentication**: Login and registration screens with session management
- **Dashboard**: View course progress and recent activity
- **Course Listing**: Browse and enroll in available courses  
- **Market Data**: Real-time financial market data visualization
- **AI Chat**: Interactive AI assistant for financial education
- **Profile Management**: View and edit user profile

## Tech Stack

- **Expo SDK**: Cross-platform React Native framework
- **React Navigation**: Navigation between screens
- **React Hook Form**: Form validation and management
- **Axios**: HTTP client for API requests
- **Expo Secure Store**: Secure storage for authentication tokens
- **Material Icons**: Icon library

## Project Structure

```
apps/mobile/
├── app/                  # Screen components (Expo Router)
│   ├── (tabs)/          # Tab navigation screens
│   ├── auth/            # Authentication screens
│   └── _layout.js       # Root layout with auth provider
├── assets/              # Images, fonts, and other assets
├── utils/               # Utility functions and API client
├── app.json            # Expo configuration
└── package.json        # Dependencies
```

## Development Setup

1. Install dependencies:
```bash
cd apps/mobile
npm install
```

2. Create environment configuration:
```bash
cp .env.example .env
```

3. Update the `.env` file with your API URL:
```
EXPO_PUBLIC_API_URL=http://localhost:5000
```

## Running the App

### Development Mode

From the project root:
```bash
cd apps/mobile
npm start
```

Or use the provided script:
```bash
./apps/mobile/run-mobile.sh
```

### Running with Backend

To run both the backend and mobile app simultaneously:
1. Start the backend server (from root): `npm run dev`
2. In a new terminal, start the mobile app: `cd apps/mobile && npm start`

### Platform-specific commands:
- iOS Simulator: `npm run ios`
- Android Emulator: `npm run android`
- Web Browser: `npm run web`

## API Integration

The mobile app connects to the same backend API as the web application. The API client is configured in `utils/api.js` and includes:

- Authentication endpoints (login, register, logout)
- Course management APIs
- Market data endpoints
- User profile APIs
- Quiz and assessment APIs
- AI chat integration

## Authentication Flow

1. User enters credentials on login screen
2. API validates and returns session token
3. Token is securely stored using Expo Secure Store
4. Token is included in all subsequent API requests
5. App navigates to main tab navigation upon successful auth

## Build & Deployment

### Build for Production

For iOS:
```bash
expo build:ios
```

For Android:
```bash
expo build:android
```

### Environment Configuration

Production API URLs are configured in `app.json` under the `extra` field:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.production.com",
      "wsUrl": "wss://api.production.com"
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Metro bundler errors**: Clear cache with `npx expo start -c`
2. **Dependency issues**: Delete `node_modules` and reinstall
3. **API connection errors**: Verify backend is running and API URL is correct
4. **Authentication errors**: Check token storage and API endpoint configuration

## Contributing

When adding new features:
1. Follow the existing file structure
2. Use TypeScript types from the shared folder
3. Add proper error handling for API calls
4. Include data-testid attributes for testing
5. Ensure screens work on both iOS and Android

## License

© 2025 MarketDifferentials. All rights reserved.