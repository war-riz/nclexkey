"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Download,
  BookOpen
} from 'lucide-react'
import { videoAPI } from '@/lib/api'

export default function VideoPlayer({ 
  videoId, 
  title = "Video Lesson",
  onProgress,
  onComplete,
  showControls = true,
  autoPlay = false,
  className = ""
}) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [quality, setQuality] = useState('720p')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Video stream URL
  const videoUrl = videoAPI.getVideoStream(videoId, quality)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Check if HLS is supported
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoUrl
    } else {
      // Use HLS.js for other browsers
      loadHLS()
    }

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      onProgress?.(video.currentTime, video.duration)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      onComplete?.()
    }

    const handleError = (e) => {
      setError('Failed to load video')
      setIsLoading(false)
      console.error('Video error:', e)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [videoUrl, onProgress, onComplete])

  const loadHLS = async () => {
    try {
      const Hls = (await import('hls.js')).default
      
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        })
        
        hls.loadSource(videoUrl)
        hls.attachMedia(videoRef.current)
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false)
          if (autoPlay) {
            play()
          }
        })
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          setError('Failed to load video stream')
          setIsLoading(false)
        })
      } else {
        setError('HLS is not supported in this browser')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Failed to load HLS.js:', error)
      setError('Failed to load video player')
      setIsLoading(false)
    }
  }

  const play = () => {
    const video = videoRef.current
    if (video) {
      video.play()
      setIsPlaying(true)
    }
  }

  const pause = () => {
    const video = videoRef.current
    if (video) {
      video.pause()
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const handleSeek = (value) => {
    const video = videoRef.current
    if (video) {
      const newTime = (value / 100) * duration
      video.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (value) => {
    const video = videoRef.current
    if (video) {
      const newVolume = value / 100
      video.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (video) {
      if (isMuted) {
        video.volume = volume
        setIsMuted(false)
      } else {
        video.volume = 0
        setIsMuted(true)
      }
    }
  }

  const skipBackward = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Math.max(0, video.currentTime - 10)
    }
  }

  const skipForward = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Math.min(duration, video.currentTime + 10)
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (video) {
      if (!isFullscreen) {
        if (video.requestFullscreen) {
          video.requestFullscreen()
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen()
        } else if (video.msRequestFullscreen) {
          video.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <BookOpen className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Video Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-0">
        <div className="relative bg-black rounded-t-lg overflow-hidden">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-auto"
            poster={videoAPI.getVideoThumbnail(videoId)}
            preload="metadata"
          >
            <source src={videoUrl} type="application/x-mpegURL" />
            Your browser does not support the video tag.
          </video>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading video...</p>
              </div>
            </div>
          )}

          {/* Video Controls */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              {/* Progress Bar */}
              <div className="mb-2">
                <Slider
                  value={[progressPercentage]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipBackward}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipForward}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <span className="text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Volume Control */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white hover:bg-opacity-20"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      className="w-20"
                    />
                  </div>

                  {/* Settings */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white hover:bg-opacity-20"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Quality Settings */}
              {showSettings && (
                <div className="mt-2 p-2 bg-black bg-opacity-75 rounded">
                  <div className="flex items-center space-x-4 text-white text-sm">
                    <span>Quality:</span>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="bg-transparent border border-white border-opacity-30 rounded px-2 py-1"
                    >
                      <option value="360p">360p</option>
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Video Title */}
        <div className="p-4">
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
      </CardContent>
    </Card>
  )
}





