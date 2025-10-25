export type UserLevel = 'Rookie Rescuer' | 'Food Hero' | 'Food Legend'

interface LevelRequirements {
  minRatings: number
  minAvgScore: number
  minSuccessfulPosts: number
}

const LEVEL_REQUIREMENTS: Record<UserLevel, LevelRequirements> = {
    'Rookie Rescuer': {
      minRatings: 0,
      minAvgScore: 0,
      minSuccessfulPosts: 0
    },
    'Food Hero': {
      minRatings: 5,
      minAvgScore: 3.5, // 3.5/5 stars = 0.7 trust score
      minSuccessfulPosts: 5
    },
    'Food Legend': {
      minRatings: 20,
      minAvgScore: 4.0, // 4.0/5 stars = 0.8 trust score (more achievable)
      minSuccessfulPosts: 20
    }
  }

export function calculateLevel(
  totalRatings: number,
  trustScore: number, // 0-1 scale
  successfulPosts: number
): UserLevel {
  const avgScore = trustScore * 5 // Convert to 5-star scale
  
  // Check from highest to lowest
  if (
    totalRatings >= LEVEL_REQUIREMENTS['Food Legend'].minRatings &&
    avgScore >= LEVEL_REQUIREMENTS['Food Legend'].minAvgScore &&
    successfulPosts >= LEVEL_REQUIREMENTS['Food Legend'].minSuccessfulPosts
  ) {
    return 'Food Legend'
  }
  
  if (
    totalRatings >= LEVEL_REQUIREMENTS['Food Hero'].minRatings &&
    avgScore >= LEVEL_REQUIREMENTS['Food Hero'].minAvgScore &&
    successfulPosts >= LEVEL_REQUIREMENTS['Food Hero'].minSuccessfulPosts
  ) {
    return 'Food Hero'
  }
  
  return 'Rookie Rescuer'
}

export function getLevelBadge(level: UserLevel): string {
  switch (level) {
    case 'Rookie Rescuer':
      return '🌱'
    case 'Food Hero':
      return '⭐'
    case 'Food Legend':
      return '👑'
  }
}

export function getLevelColor(level: UserLevel): string {
  switch (level) {
    case 'Rookie Rescuer':
      return 'from-gray-400 to-gray-500'
    case 'Food Hero':
      return 'from-blue-500 to-purple-500'
    case 'Food Legend':
      return 'from-yellow-400 to-orange-500'
  }
}

export function getNextLevelRequirements(currentLevel: UserLevel): {
  nextLevel: UserLevel | null
  requirements: LevelRequirements | null
} {
  if (currentLevel === 'Rookie Rescuer') {
    return {
      nextLevel: 'Food Hero',
      requirements: LEVEL_REQUIREMENTS['Food Hero']
    }
  }
  
  if (currentLevel === 'Food Hero') {
    return {
      nextLevel: 'Food Legend',
      requirements: LEVEL_REQUIREMENTS['Food Legend']
    }
  }
  
  return {
    nextLevel: null,
    requirements: null
  }
}