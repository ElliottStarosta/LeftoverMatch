# LeftoverMatch - Tinder for Food Sharing 🍽️

A modern, responsive food sharing app that connects people with leftover food in their area. Built with Next.js, Firebase, and Tailwind CSS.

## Features ✨

- **Tinder-like Swipe Interface**: Swipe through food posts with smooth animations
- **Smart Algorithm**: Personalized food suggestions based on preferences and location
- **Real-time Claims**: When someone claims food, it disappears from other users' feeds
- **User Profiles**: Comprehensive profile setup with dietary preferences and restrictions
- **Firebase Integration**: Authentication, Firestore, Storage, and real-time updates
- **Responsive Design**: Works perfectly on all screen sizes without scrolling
- **Location Services**: GPS-based food discovery and directions
- **Image Upload**: Easy food photo sharing with Firebase Storage

## Tech Stack 🛠️

- **Frontend**: Next.js 16, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Icons**: Heroicons
- **State Management**: React Hooks

## Getting Started 🚀

### Prerequisites

- Node.js 18+ 
- Firebase project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leftovermatch-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Storage
   - Get your Firebase configuration

4. **Configure environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your Firebase configuration in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Set up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Posts are readable by authenticated users
       match /posts/{postId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
       
       // Claims are readable by involved parties
       match /claims/{claimId} {
         allow read, write: if request.auth != null && 
           (request.auth.uid == resource.data.claimerId || 
            request.auth.uid == resource.data.posterId);
       }
     }
   }
   ```

6. **Set up Storage Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /posts/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure 📁

```
src/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── create/            # Food post creation
│   ├── profile-setup/     # User profile setup
│   └── page.tsx           # Main swipe interface
├── components/            # React components
│   ├── FoodCard.tsx       # Individual food post card
│   ├── SwipeDeck.tsx      # Main swipe interface
│   ├── ClaimModal.tsx     # Claim confirmation modal
│   └── Navbar.tsx         # Navigation bar
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── algorithm.ts       # Food recommendation algorithm
│   └── claims.ts          # Claim management
└── types/                 # TypeScript type definitions
    └── index.ts           # Main type definitions
```

## Key Features Explained 🔍

### Smart Algorithm
The app uses a sophisticated algorithm that considers:
- User location and maximum distance preferences
- Dietary restrictions and allergies
- Food preferences and cuisine types
- Post freshness and trust scores
- User cooking level and preferences

### Real-time Updates
- When someone claims food, it's immediately removed from other users' feeds
- Real-time synchronization using Firebase Firestore
- Automatic post expiration handling

### Responsive Design
- Mobile-first approach
- No scrolling required on any screen size
- Touch-friendly swipe gestures
- Optimized for both mobile and desktop

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

If you have any questions or need help, please open an issue or contact the development team.

---

**Happy Food Sharing! 🍽️✨**