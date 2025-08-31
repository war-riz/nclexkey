import { useState } from 'react'
import { User } from 'lucide-react'

export default function Avatar({ 
  user, 
  size = 'md', 
  className = '',
  showFallback = true 
}) {
  const [imageError, setImageError] = useState(false)
  
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }
  
  // Generate fallback avatar URL using user's email
  const getFallbackAvatar = (email) => {
    if (!email) return '/api/avatar/default?d=mp&s=200'
    return `/api/avatar/${encodeURIComponent(email)}?d=mp&s=200`
  }
  
  // Get avatar source with fallback
  const getAvatarSrc = () => {
    if (user?.avatar && !imageError) {
      return user.avatar
    }
    return getFallbackAvatar(user?.email)
  }
  
  // Handle image load error
  const handleImageError = () => {
    setImageError(true)
  }
  
  // If showing fallback and no image available, show icon
  if (showFallback && imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <User className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-10 h-10'} text-gray-500`} />
      </div>
    )
  }
  
  return (
    <img
      src={getAvatarSrc()}
      alt={`${user?.full_name || user?.email || 'User'}'s avatar`}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 ${className}`}
      onError={handleImageError}
    />
  )
}
