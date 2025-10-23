import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase-client'

// Cloud Function wrappers - only initialize if functions is available
export const createClaim = functions ? (() => {
  const functionsInstance = functions()
  return functionsInstance ? httpsCallable(functionsInstance, 'createClaim') : null
})() : null

export const confirmPickup = functions ? (() => {
  const functionsInstance = functions()
  return functionsInstance ? httpsCallable(functionsInstance, 'confirmPickup') : null
})() : null

export const cancelClaim = functions ? (() => {
  const functionsInstance = functions()
  return functionsInstance ? httpsCallable(functionsInstance, 'cancelClaim') : null
})() : null

export interface CreateClaimData {
  postId: string
}

export interface CreateClaimResult {
  success: boolean
  claimId: string
  pickupCode: string
  expiresAt: number
  message: string
}

export interface ConfirmPickupData {
  claimId: string
  pickupCode: string
}

export interface CancelClaimData {
  claimId: string
}

// Helper function to call createClaim with proper typing
export async function callCreateClaim(postId: string): Promise<CreateClaimResult> {
  try {
    if (!createClaim) {
      throw new Error('Firebase functions not available')
    }
    const result = await createClaim({ postId })
    return result.data as CreateClaimResult
  } catch (error: any) {
    console.error('Error creating claim:', error)
    
    // Handle specific error codes
    if (error.code === 'permission-denied') {
      if (error.message.includes('Too many active claims')) {
        throw new Error('You have too many active claims. Complete your current pickups first!')
      } else if (error.message.includes('cooldown')) {
        throw new Error('Please wait a moment before claiming another post.')
      }
    } else if (error.code === 'failed-precondition') {
      if (error.message.includes('Already claimed')) {
        throw new Error('Someone else claimed this item first.')
      } else if (error.message.includes('expired')) {
        throw new Error('This post has expired.')
      }
    }
    
    throw new Error('Failed to claim food. Please try again.')
  }
}

// Helper function to confirm pickup
export async function callConfirmPickup(claimId: string, pickupCode: string): Promise<void> {
  try {
    if (!confirmPickup) {
      throw new Error('Firebase functions not available')
    }
    await confirmPickup({ claimId, pickupCode })
  } catch (error: any) {
    console.error('Error confirming pickup:', error)
    
    if (error.code === 'permission-denied') {
      throw new Error('You are not authorized to confirm this pickup.')
    } else if (error.code === 'invalid-argument') {
      throw new Error('Invalid pickup code.')
    } else if (error.code === 'failed-precondition') {
      throw new Error('This claim has already been completed or expired.')
    }
    
    throw new Error('Failed to confirm pickup. Please try again.')
  }
}

// Helper function to cancel claim
export async function callCancelClaim(claimId: string): Promise<void> {
  try {
    if (!cancelClaim) {
      throw new Error('Firebase functions not available')
    }
    await cancelClaim({ claimId })
  } catch (error: any) {
    console.error('Error cancelling claim:', error)
    
    if (error.code === 'permission-denied') {
      throw new Error('You are not authorized to cancel this claim.')
    } else if (error.code === 'failed-precondition') {
      throw new Error('This claim cannot be cancelled.')
    }
    
    throw new Error('Failed to cancel claim. Please try again.')
  }
}
