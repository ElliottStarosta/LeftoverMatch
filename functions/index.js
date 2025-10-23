const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Constants
const MAX_CLAIMS_ROOKIE = 1;
const MAX_CLAIMS_HERO = 3;
const MAX_CLAIMS_LEGEND = 5;
const CLAIM_TIMEOUT_MINUTES = 15;
const COOLDOWN_SECONDS = 30;

/**
 * Create a new claim for a food post
 * Implements comprehensive anti-spam logic
 */
exports.createClaim = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const claimerId = context.auth.uid;
  const postId = data.postId;
  
  if (!postId) {
    throw new functions.https.HttpsError('invalid-argument', 'Post ID is required');
  }

  const userRef = db.collection('users').doc(claimerId);
  const postRef = db.collection('posts').doc(postId);
  const claimRef = db.collection('claims').doc();

  try {
    const result = await db.runTransaction(async (t) => {
      // Get user and post data
      const [userSnap, postSnap] = await Promise.all([
        t.get(userRef),
        t.get(postRef)
      ]);

      if (!userSnap.exists) {
        // Create user document if it doesn't exist
        const userData = {
          uid: claimerId,
          name: context.auth.token.name || 'Anonymous',
          email: context.auth.token.email || '',
          photoURL: context.auth.token.picture || '',
          joinedAt: admin.firestore.Timestamp.now(),
          activeClaimsCount: 0,
          totalClaims: 0,
          completedClaims: 0,
          expiredClaims: 0,
          trustScore: 1.0,
          level: 'Rookie Rescuer',
          maxClaimsAllowed: MAX_CLAIMS_ROOKIE,
          lastClaimAt: null,
          banned: false
        };
        t.set(userRef, userData);
      }

      if (!postSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Post not found');
      }

      const user = userSnap.exists ? userSnap.data() : {
        activeClaimsCount: 0,
        maxClaimsAllowed: MAX_CLAIMS_ROOKIE,
        lastClaimAt: null,
        level: 'Rookie Rescuer'
      };
      const post = postSnap.data();

      // 1. Check if user is banned
      if (user.banned) {
        throw new functions.https.HttpsError('permission-denied', 'Your account has been suspended');
      }

      // 2. Server-side cooldown check
      if (user.lastClaimAt) {
        const timeSinceLastClaim = (Date.now() - user.lastClaimAt.toMillis()) / 1000;
        if (timeSinceLastClaim < COOLDOWN_SECONDS) {
          throw new functions.https.HttpsError(
            'permission-denied',
            `Please wait ${Math.ceil(COOLDOWN_SECONDS - timeSinceLastClaim)} seconds before claiming another post`
          );
        }
      }

      // 3. Active claims limit check
      if ((user.activeClaimsCount || 0) >= user.maxClaimsAllowed) {
        throw new functions.https.HttpsError(
          'permission-denied', 
          `Too many active claims. You can hold ${user.maxClaimsAllowed} claims as a ${user.level}. Complete your current pickups first!`
        );
      }

      // 4. Check if post is available
      if (post.status !== 'available') {
        throw new functions.https.HttpsError('failed-precondition', 'Post is no longer available');
      }

      // 5. Check if post hasn't expired
      if (post.expiresAt && post.expiresAt.toDate() < new Date()) {
        throw new functions.https.HttpsError('failed-precondition', 'Post has expired');
      }

      // 6. Handle quantity-based posts
      if (post.quantity && post.quantity <= 0) {
        throw new functions.https.HttpsError('failed-precondition', 'No more items available');
      }

      // 7. Create claim
      const now = admin.firestore.Timestamp.now();
      const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CLAIM_TIMEOUT_MINUTES * 60 * 1000);
      const pickupCode = generatePickupCode();
      
      const claimData = {
        claimerId,
        posterId: post.userId,
        postId,
        status: 'pending',
        lockedAt: now,
        expiresAt,
        pickupCode,
        createdAt: now
      };

      t.create(claimRef, claimData);

      // 8. Update post status or quantity
      if (post.quantity && post.quantity > 1) {
        t.update(postRef, { 
          quantity: post.quantity - 1,
          lockInfo: {
            claimedBy: claimerId,
            claimId: claimRef.id,
            lockedAt: now,
            expiresAt
          }
        });
      } else {
        t.update(postRef, { 
          status: 'locked', 
          lockInfo: {
            claimedBy: claimerId,
            claimId: claimRef.id,
            lockedAt: now,
            expiresAt
          }
        });
      }

      // 9. Update user's active claims count and last claim time
      t.update(userRef, { 
        activeClaimsCount: admin.firestore.FieldValue.increment(1),
        lastClaimAt: now,
        totalClaims: admin.firestore.FieldValue.increment(1)
      }, { merge: true });

      // 10. Create chat doc for claim
      const chatId = claimRef.id;
      const chatRef = db.collection('chats').doc(chatId);
      t.set(chatRef, {
        id: chatId,
        participants: [claimerId, post.userId],
        claimId: claimRef.id,
        lastMessageAt: now,
        createdAt: now
      });

      return {
        claimId: claimRef.id,
        pickupCode,
        expiresAt: expiresAt.toMillis(),
        postLocation: post.location
      };
    });

    return { 
      success: true, 
      ...result,
      message: `Food claimed! You have ${CLAIM_TIMEOUT_MINUTES} minutes to confirm pickup.`
    };

  } catch (error) {
    console.error('Error creating claim:', error);
    throw error;
  }
});

/**
 * Confirm pickup of claimed food
 */
exports.confirmPickup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const claimId = data.claimId;
  const pickupCode = data.pickupCode;
  const userId = context.auth.uid;

  if (!claimId || !pickupCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Claim ID and pickup code are required');
  }

  const claimRef = db.collection('claims').doc(claimId);

  try {
    await db.runTransaction(async (t) => {
      const claimSnap = await t.get(claimRef);
      
      if (!claimSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Claim not found');
      }

      const claim = claimSnap.data();

      // Verify pickup code
      if (claim.pickupCode !== pickupCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid pickup code');
      }

      // Check if claim hasn't expired
      if (claim.expiresAt && claim.expiresAt.toDate() < new Date()) {
        throw new functions.https.HttpsError('failed-precondition', 'Claim has expired');
      }

      // Check if claim is still pending
      if (claim.status !== 'pending') {
        throw new functions.https.HttpsError('failed-precondition', 'Claim is no longer valid');
      }

      // Verify user is either the claimer or poster
      if (userId !== claim.claimerId && userId !== claim.posterId) {
        throw new functions.https.HttpsError('permission-denied', 'You are not authorized to confirm this pickup');
      }

      const now = admin.firestore.Timestamp.now();

      // Update claim status
      t.update(claimRef, { 
        status: 'completed',
        completedAt: now
      });

      // Update post status
      const postRef = db.collection('posts').doc(claim.postId);
      t.update(postRef, { 
        status: 'completed',
        completedAt: now
      });

      // Update claimer stats
      const claimerRef = db.collection('users').doc(claim.claimerId);
      t.update(claimerRef, { 
        activeClaimsCount: admin.firestore.FieldValue.increment(-1),
        completedClaims: admin.firestore.FieldValue.increment(1)
      });

      // Update poster stats
      const posterRef = db.collection('users').doc(claim.posterId);
      t.update(posterRef, { 
        successfulPosts: admin.firestore.FieldValue.increment(1)
      });

      // Create notification for claimer
      const notificationRef = db.collection('notifications').doc();
      t.set(notificationRef, {
        userId: claim.claimerId,
        type: 'claim_confirmed',
        title: 'Pickup Confirmed!',
        message: 'Your pickup has been confirmed. Enjoy your food!',
        read: false,
        createdAt: now
      });
    });

    return { success: true, message: 'Pickup confirmed! Thank you for rescuing food.' };

  } catch (error) {
    console.error('Error confirming pickup:', error);
    throw error;
  }
});

/**
 * Cancel a claim
 */
exports.cancelClaim = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const claimId = data.claimId;
  const userId = context.auth.uid;

  if (!claimId) {
    throw new functions.https.HttpsError('invalid-argument', 'Claim ID is required');
  }

  const claimRef = db.collection('claims').doc(claimId);

  try {
    await db.runTransaction(async (t) => {
      const claimSnap = await t.get(claimRef);
      
      if (!claimSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Claim not found');
      }

      const claim = claimSnap.data();

      // Verify user owns this claim
      if (claim.claimerId !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'You can only cancel your own claims');
      }

      // Check if claim can be cancelled
      if (claim.status !== 'pending') {
        throw new functions.https.HttpsError('failed-precondition', 'This claim cannot be cancelled');
      }

      const now = admin.firestore.Timestamp.now();

      // Update claim status
      t.update(claimRef, { 
        status: 'cancelled',
        cancelledAt: now
      });

      // Update post status back to available
      const postRef = db.collection('posts').doc(claim.postId);
      t.update(postRef, { 
        status: 'available',
        lockInfo: admin.firestore.FieldValue.delete()
      });

      // Update user's active claims count
      const userRef = db.collection('users').doc(userId);
      t.update(userRef, { 
        activeClaimsCount: admin.firestore.FieldValue.increment(-1)
      });

      // Notify poster
      const notificationRef = db.collection('notifications').doc();
      t.set(notificationRef, {
        userId: claim.posterId,
        type: 'claim_cancelled',
        title: 'Claim Cancelled',
        message: 'A claim on your post has been cancelled.',
        read: false,
        createdAt: now
      });
    });

    return { success: true, message: 'Claim cancelled successfully' };

  } catch (error) {
    console.error('Error cancelling claim:', error);
    throw error;
  }
});

/**
 * Release expired claims (runs every 5 minutes)
 */
exports.releaseExpiredClaims = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const expiredClaims = await db.collection('claims')
    .where('status', '==', 'pending')
    .where('expiresAt', '<', now)
    .get();

  const batch = db.batch();
  const userIds = new Set();

  expiredClaims.docs.forEach(doc => {
    const claim = doc.data();
    
    // Mark claim as expired
    batch.update(doc.ref, { 
      status: 'timed_out',
      expiredAt: now
    });

    // Update post status back to available
    const postRef = db.collection('posts').doc(claim.postId);
    batch.update(postRef, { 
      status: 'available',
      lockInfo: admin.firestore.FieldValue.delete()
    });

    // Track users to update their active claims count
    userIds.add(claim.claimerId);
  });

  // Update active claims count for users
  for (const userId of userIds) {
    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, { 
      activeClaimsCount: admin.firestore.FieldValue.increment(-1),
      expiredClaims: admin.firestore.FieldValue.increment(1)
    });

    // Create notification
    const notificationRef = db.collection('notifications').doc();
    batch.set(notificationRef, {
      userId: userId,
      type: 'claim_expired',
      title: 'Claim Expired',
      message: 'Your claim has expired and the food has returned to the deck.',
      read: false,
      createdAt: now
    });
  }

  await batch.commit();
  console.log(`Released ${expiredClaims.docs.length} expired claims`);
});

/**
 * Update user trust score when claim status changes
 */
exports.onClaimStatusChange = functions.firestore
  .document('claims/{claimId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only process if status changed
    if (before.status === after.status) {
      return;
    }

    const claimerId = after.claimerId;
    const userRef = db.collection('users').doc(claimerId);

    try {
      await db.runTransaction(async (t) => {
        // Get user data
        const userSnap = await t.get(userRef);
        if (!userSnap.exists) {
          return;
        }

        const user = userSnap.data();
        const completedClaims = user.completedClaims || 0;
        const totalClaims = completedClaims + (user.expiredClaims || 0);
        
        // Calculate new trust score
        const trustScore = totalClaims > 0 ? completedClaims / totalClaims : 1.0;
        
        // Update user with new trust score and level
        const userLevel = getUserLevel(trustScore, completedClaims);
        const maxClaimsAllowed = getMaxClaimsForLevel(userLevel);

        t.update(userRef, {
          trustScore,
          level: userLevel,
          maxClaimsAllowed
        });
      });
    } catch (error) {
      console.error('Error updating trust score:', error);
    }
  });

/**
 * Handle rating creation and update trust scores
 */
exports.onRatingCreated = functions.firestore
  .document('ratings/{ratingId}')
  .onCreate(async (snap, context) => {
    const rating = snap.data();
    const posterRef = db.collection('users').doc(rating.posterId);

    try {
      await db.runTransaction(async (t) => {
        const posterSnap = await t.get(posterRef);
        if (!posterSnap.exists) {
          return;
        }

        const poster = posterSnap.data();
        const newCompleted = (poster.completedClaims || 0) + 1;
        const newTotal = (poster.totalClaims || 0) + 1;
        const newTrust = newCompleted / newTotal;

        const userLevel = getUserLevel(newTrust, newCompleted);
        const maxClaims = getMaxClaimsForLevel(userLevel);

        t.update(posterRef, {
          completedClaims: newCompleted,
          totalClaims: newTotal,
          trustScore: newTrust,
          maxClaimsAllowed: maxClaims,
          level: userLevel
        });
      });
    } catch (error) {
      console.error('Error updating poster trust score:', error);
    }
  });

// Helper functions
function generatePickupCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function getUserLevel(trustScore, completedClaims) {
  if (completedClaims >= 20 && trustScore >= 0.9) {
    return 'Food Legend';
  } else if (completedClaims >= 5 && trustScore >= 0.7) {
    return 'Food Hero';
  } else {
    return 'Rookie Rescuer';
  }
}

function getMaxClaimsForLevel(level) {
  switch (level) {
    case 'Food Legend': return MAX_CLAIMS_LEGEND;
    case 'Food Hero': return MAX_CLAIMS_HERO;
    default: return MAX_CLAIMS_ROOKIE;
  }
}
