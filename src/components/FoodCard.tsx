'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPinIcon, ClockIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'

import { AlgorithmPost } from '@/lib/algorithm'

interface FoodCardProps {
  post: AlgorithmPost
}

export default function FoodCard({ post }: FoodCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  const getTrustStars = (score: number) => {
    const stars = []
    const fullStars = Math.floor(score * 5)
    for (let i = 0; i < 5; i++) {
      stars.push(
        <StarIcon 
          key={i} 
          className={`w-4 h-4 ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      )
    }
    return stars
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-full flex flex-col relative">
      {/* Image */}
      <div className="relative flex-1 min-h-0 bg-gray-200">
        <Image
          src={post.photoUrl}
          alt={post.title}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Quantity Badge */}
        {post.quantity > 1 && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
            {post.quantity} items
          </div>
        )}

        {/* Food Meta Icons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {post.foodMeta.homemade && (
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
              🏠
            </div>
          )}
          {post.foodMeta.refrigerated && (
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
              🧊
            </div>
          )}
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-2 left-2 right-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-white truncate flex-1 mr-2">{post.title}</h3>
            <div className="flex items-center flex-shrink-0">
              {getTrustStars(post.posterTrustScore)}
              <span className="text-white text-xs ml-1">
                {(post.posterTrustScore * 5).toFixed(1)}
              </span>
            </div>
          </div>
          
          <p className="text-white/90 text-xs line-clamp-2 mb-2">{post.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image
                src={post.posterAvatar}
                alt={post.posterName}
                width={20}
                height={20}
                className="rounded-full border-2 border-white"
              />
              <div>
                <p className="text-white text-xs font-medium">{post.posterName}</p>
                <p className="text-white/70 text-xs">
                  {(post.posterTrustScore * 5).toFixed(1)} trust
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center text-white/90 text-xs">
                <MapPinIcon className="w-3 h-3 mr-1" />
                <span>{post.distance} mi</span>
              </div>
              <div className="flex items-center text-white/70 text-xs">
                <ClockIcon className="w-3 h-3 mr-1" />
                <span>{getTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Content */}
      <div className="p-2 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-xs text-green-600">
            <ShieldCheckIcon className="w-3 h-3 mr-1" />
            <span>Verified safe</span>
          </div>
          <div className="text-xs text-gray-500 truncate ml-2">
            {post.location.address}
          </div>
        </div>
      </div>
    </div>
  )
}
