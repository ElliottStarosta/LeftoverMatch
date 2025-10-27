'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPinIcon, ClockIcon, UserIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import { AlgorithmPost } from '@/lib/algorithm'

interface FoodCardProps {
  post: AlgorithmPost
}

export default function FoodCard({ post }: FoodCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const getTrustStars = (score: number) => {
    const stars = []
    const fullStars = Math.floor(score * 5)
    for (let i = 0; i < 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`w-3 h-3 ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      )
    }
    return stars
  }

  const getTimeAgo = (date: Date | any) => {
    const dateObj = date instanceof Date ? date : date.toDate()
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className="bg-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col relative cursor-pointer hover:scale-[1.02] transition-transform duration-200"
      >
        {/* Main Image */}
        <div className="relative flex-1 min-h-0 bg-gray-200">
          <Image
            src={post.photoUrl}
            alt={post.title}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Dark gradient overlay at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Top right badges */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            {post.foodMeta?.homemade && (
              <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg text-gray-900">
                🏠 Homemade
              </div>
            )}
            {post.quantity > 1 && (
              <div className="w-fit bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                {post.quantity} available
              </div>
            )}
          </div>

          {/* Info icon */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(true)
            }}
            className="absolute top-4 left-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <InformationCircleIcon className="w-5 h-5 text-gray-700" />
          </button>

          {/* Bottom Info Card */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              {post.title}
            </h2>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {getTrustStars(post.posterTrustScore)}
                <span className="text-sm text-gray-200 ml-1">
                  {post.posterTotalRatings && post.posterTotalRatings > 0
                    ? `${(post.posterTrustScore * 5).toFixed(1)} (${post.posterTotalRatings} rating${post.posterTotalRatings !== 1 ? 's' : ''})`
                    : 'No ratings yet'
                  }
                </span>
              </div>
              
            </div>

            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                {post.posterAvatar ? (
                  <Image
                    src={post.posterAvatar}
                    alt={post.posterName}
                    width={24}
                    height={24}
                    className="rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <span className="font-medium drop-shadow">{post.posterName}</span>
              </div>

              <div className="flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                <span className="font-medium">{post.distance.toFixed(1)} mi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Image */}
              <div className="relative h-80">
                <Image
                  src={post.photoUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setShowDetails(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h2>

                {/* Match percentage */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full inline-block mb-4">
                  <span className="font-bold">{post.compatibilityPercentage}% Match</span>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6">{post.description}</p>

                {/* Match Reasons */}
                {post.matchReasons.length > 0 && (
                  <div className="bg-green-50 rounded-2xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Why this matches you:</h3>
                    <div className="space-y-2">
                      {post.matchReasons.map((reason, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-gray-700 text-sm">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Poster Info */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">About the poster</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {post.posterAvatar ? (
                      <Image
                        src={post.posterAvatar}
                        alt={post.posterName}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{post.posterName}</p>
                      <div className="flex items-center gap-1">
                        {getTrustStars(post.posterTrustScore)}
                        <span className="text-sm text-gray-600 ml-1">
                          {post.posterTotalRatings && post.posterTotalRatings > 0
                            ? `${(post.posterTrustScore * 5).toFixed(1)} trust score (${post.posterTotalRatings} rating${post.posterTotalRatings !== 1 ? 's' : ''})`
                            : 'New poster - no ratings yet'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ADD THESE LINES */}
                  <div className="space-y-2 mt-3">
                    {post.posterLevel && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-pink-100 px-3 py-2 rounded-xl">
                        <span className="text-lg">🏆</span>
                        <span className="text-sm font-semibold text-gray-800">{post.posterLevel}</span>
                      </div>
                    )}

                    {post.posterCookingLevel && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-2 rounded-xl">
                        <span className="text-lg">
                          {post.posterCookingLevel === 'beginner' && '🌱'}
                          {post.posterCookingLevel === 'intermediate' && '🔥'}
                          {post.posterCookingLevel === 'advanced' && '⭐'}
                          {post.posterCookingLevel === 'professional' && '👑'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 capitalize">
                          {post.posterCookingLevel} Chef
                        </span>
                      </div>
                    )}

                    {post.posterTotalRatings !== undefined && post.posterTotalRatings > 0 && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-2 rounded-xl">
                        <span className="text-lg">📊</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {post.posterTotalRatings} rating{post.posterTotalRatings !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Food Details */}
                {post.foodMeta && (
                  <div className="bg-orange-50 rounded-2xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Food details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        {post.foodMeta.homemade ? (
                          <>
                            <span>🏠</span>
                            <span className="text-gray-700">Homemade</span>
                          </>
                        ) : (
                          <>
                            <span>🛍️</span>
                            <span className="text-gray-700">Bought</span>
                          </>
                        )}
                      </div>

                      {post.foodMeta.refrigerated && (
                        <div className="flex items-center gap-2">
                          <span>❄️</span>
                          <span className="text-gray-700">Refrigerated</span>
                        </div>
                      )}

                      {post.foodMeta.allergens && post.foodMeta.allergens.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span>⚠️</span>
                          <span className="text-gray-700">
                            Contains: {post.foodMeta.allergens.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>


                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}