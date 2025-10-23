export interface User {
  uid: string
  name: string
  email: string
  photoURL?: string
  joinedAt: Date
  activeClaimsCount: number
  totalClaims: number
  completedClaims: number
  expiredClaims: number
  trustScore: number
  level: 'Rookie Rescuer' | 'Food Hero' | 'Food Legend'
  maxClaimsAllowed: number
  lastClaimAt?: Date
  banned: boolean
  reports?: number
  successfulPosts?: number
  // Profile data
  bio?: string
  dietaryRestrictions?: string[]
  foodPreferences?: string[]
  allergies?: string[]
  cookingLevel?: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  location?: string
  lat?: number
  lng?: number
  maxDistance?: number
  notifications?: boolean
}

export interface Post {
  id: string
  userId: string
  title: string
  description: string
  photoUrl: string
  location: {
    lat: number
    lng: number
    address: string
  }
  status: 'available' | 'locked' | 'claimed' | 'completed'
  createdAt: Date
  expiresAt: Date
  quantity: number
  pickupWindow: {
    start: Date
    end: Date
  }
  foodMeta: {
    homemade: boolean
    refrigerated: boolean
    preparedAt?: Date
    allergens?: string[]
  }
  lockInfo?: {
    claimedBy: string
    claimId: string
    lockedAt: Date
    expiresAt: Date
  }
}

export interface Claim {
  id: string
  claimerId: string
  posterId: string
  postId: string
  status: 'pending' | 'completed' | 'expired' | 'cancelled' | 'timed_out'
  lockedAt: Date
  expiresAt: Date
  pickupCode: string
  completedAt?: Date
  cancelledAt?: Date
}

export interface Chat {
  id: string
  participants: string[]
  claimId?: string
  lastMessageAt: Date
  createdAt: Date
}

export interface Message {
  id: string
  senderId: string
  text: string
  createdAt: Date
  chatId: string
}

export interface Rating {
  id: string
  postId: string
  posterId: string
  claimerId: string
  claimId: string
  stars: number
  comment?: string
  createdAt: Date
}

export interface Report {
  id: string
  reporterId: string
  targetId: string
  targetType: 'user' | 'post'
  reason: string
  description?: string
  createdAt: Date
  status: 'pending' | 'resolved' | 'dismissed'
}

export interface Notification {
  id: string
  userId: string
  type: 'claim_created' | 'claim_expired' | 'claim_confirmed' | 'rating_received' | 'message_received'
  title: string
  message: string
  data?: any
  read: boolean
  createdAt: Date
}
