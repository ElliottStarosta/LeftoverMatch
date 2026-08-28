# ReSwipe

> **Connect Food with People** - Swipe → Claim → Pick up. Find free ready-to-eat food near you using an intelligent matching algorithm.

[Read my Reflection](https://docs.google.com/document/d/1u7GfcnSsI0-oWNcdulXcQLQhvdtJE-arqqp7uREcfQQ/edit?usp=sharing)

## Features

### Smart Food Matching

* **Personalized Feed Algorithm**: Matches food posts based on dietary preferences, allergies, cuisines, distance, and poster reputation
* **Real-time Scoring**: Compatibility percentages and match reasons for every post
* **Freshness Priority**: Newer posts ranked higher with decay over time
* **Distance Filtering**: Customizable search radius (1-25 miles)

### Core Functionality

* **Swipe Cards**: Tinder-style interface for browsing food posts
* **Smart Claims**: Lock system prevents race conditions
* **Direct Messaging**: Real-time chat between poster and claimer
* **Address Reveal**: Pickup address only shared after claim acceptance
* **Rating System**: 5-star ratings for both posters and claimers
* **Trust Score**: Dynamic reputation system with level progression

### User Profiles

* Dietary restrictions & food preferences
* Allergy management
* Cooking skill levels
* Location-based discovery
* Trust badges and reputation levels

### Real-time Notifications

* Claim confirmations
* New matches nearby
* Level-ups and achievements
* Direct messages

## Tech Stack

### Frontend

* Next.js 15 - React framework with App Router
* TypeScript - Type-safe development
* Tailwind CSS - Utility-first styling
* Framer Motion - Smooth animations
* GSAP - Advanced animation library
* Heroicons - SVG icons

### Backend & Services

* Firebase Firestore - Real-time database
* Firebase Authentication - Google & email/password auth
* Firebase Storage - Image hosting
* OpenStreetMap API - Geocoding & directions
* ImgBB API - Image upload service
* OSRM - Turn-by-turn routing

### Key Libraries

* `framer-motion` - Card swipe animations
* `gsap` - UI animations
* `next-image` - Optimized images
* `lucide-react` - Additional icons

## Prerequisites

* Node.js 18+
* npm or yarn
* Firebase project
* ImgBB API key

## Environment Setup

Create a `.env.local` file:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Image Upload
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_key
```

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/reswipe.git
cd reswipe

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── page.tsx
│   ├── auth/
│   ├── create/
│   ├── messages/
│   ├── profile/
│   └── profile-setup/
├── components/
│   ├── SwipeDeck.tsx
│   ├── FoodCard.tsx
│   ├── ClaimModal.tsx
│   ├── RatingModal.tsx
│   ├── Navbar.tsx
│   └── ...
├── lib/
│   ├── algorithm.ts
│   ├── claims.ts
│   ├── firebase-utils.ts
│   ├── useAuth.ts
│   └── ...
└── types/
    └── index.ts
```

## Algorithm Overview

### Scoring System (0-100 points)

1. Distance (25 pts) - Proximity to user
2. Dietary Compatibility (20 pts) - Dietary restrictions match
3. Allergen Safety (20 pts) - No allergen conflicts
4. Cuisine Preference (15 pts) - User's favorite cuisines
5. Freshness (10 pts) - How recently posted
6. Poster Reputation (10 pts) - Trust score + ratings
7. Time Availability (5 pts) - Pickup window convenience
8. Quality Indicators (5 pts) - Homemade, refrigerated, quantity

### Smart Filtering

* Geo-bounding box for efficient queries
* Real-time availability checks
* Allergen conflict detection
* Dietary restriction validation

## How to Use

### For Claimers (Food Seekers)

1. Sign in with Google or email
2. Set up profile (dietary preferences, allergies, cuisines)
3. Browse feed and swipe left/right
4. Claim food and message poster
5. Get address after acceptance
6. Pick up and rate experience

### For Posters (Food Sharers)

1. Create post with photo and description
2. Set location and pickup time
3. Wait for claims
4. Accept claim and confirm details
5. Complete pickup and rate claimer

## User Levels

| Level          | Requirements                     |
| -------------- | -------------------------------- |
| Rookie Rescuer | Just started                     |
| Food Hero      | 5+ ratings, 3.5+ avg, 5+ posts   |
| Food Legend    | 20+ ratings, 4.0+ avg, 20+ posts |

## Database Schema

### Collections

* users - User profiles and preferences
* posts - Food listings
* claims - Claim transactions
* messages - Chat messages
* conversations - Chat threads
* ratings - User ratings
* notifications - Real-time alerts

## Security Features

* Firebase Authentication (Google OAuth + Email)
* User trust verification system
* Reporting and moderation tools
* Allergen safety checks
* Real-time data validation

## Performance Optimizations

* Lazy loading with React Suspense
* Image optimization with Next.js Image
* Efficient Firestore queries with pagination
* Bounding box geo-filtering
* Debounced search inputs
* Local caching of excluded posts

## Known Limitations

* Geolocation requires HTTPS in production
* Daily claim limit: 10 per user
* Pickup window: 30-minute lock on claim
* Location auto-detect may require permission grant
