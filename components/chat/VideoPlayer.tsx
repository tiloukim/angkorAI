'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, Download, Video } from 'lucide-react'

interface Props {
  prompt: string
}

export default function VideoPlayer({ prompt }: Props) {
  const [status, setStatus] = useState<'starting' | 'processing' | 'succeeded' | 'failed'>('starting')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const predictionId = useRef<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function generate() {
      try {
        // Start generation
        const res = await fetch('/api/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setError(err.error || 'Failed to start video generation')
          setStatus('failed')
          return
        }
        const data = await res.json()
        predictionId.current = data.id
        setStatus('processing')

        // Poll for completion
        let attempts = 0
        const maxAttempts = 60 // ~5 minutes max
        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 5000))
          attempts++

          const poll = await fetch(`/api/video?id=${data.id}`)
          if (!poll.ok) continue

          const result = await poll.json()
          if (result.status === 'succeeded' && result.output) {
            setVideoUrl(result.output)
            setStatus('succeeded')
            return
          }
          if (result.status === 'failed') {
            setError(result.error || 'Video generation failed')
            setStatus('failed')
            return
          }
        }
        setError('Video generation timed out')
        setStatus('failed')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        setStatus('failed')
      }
    }

    generate()
  }, [prompt])

  if (status === 'failed') {
    return (
      <div className="my-3 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
        Video generation failed: {error}
      </div>
    )
  }

  if (status === 'succeeded' && videoUrl) {
    return (
      <div className="my-3">
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          className="rounded-xl max-w-full border border-gray-200 shadow-sm"
          style={{ maxHeight: 480 }}
        />
        <div className="flex items-center gap-2 mt-2">
          <a
            href={videoUrl}
            download={`angkorai-video-${Date.now()}.mp4`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-accent transition-colors"
          >
            <Download size={12} />
            Download
          </a>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="my-3 p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Video size={16} className="text-accent" />
        <Loader2 size={16} className="animate-spin text-accent" />
      </div>
      <div className="text-sm text-gray-500">
        Generating video... this takes 1-2 minutes
      </div>
    </div>
  )
}
