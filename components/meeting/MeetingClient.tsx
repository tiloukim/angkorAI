'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Mic, Square, Upload, FileText, ArrowLeft, Loader2, Download,
  ChevronDown, ChevronUp, Clock, CheckCircle2, Plus, Trash2, PanelLeft, X, RefreshCw,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Phase = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'summarizing' | 'complete'

interface SavedMeeting {
  id: string
  title: string
  duration_seconds: number
  created_at: string
}

interface MeetingDetail {
  id: string
  title: string
  transcript: string
  summary: string
  duration_seconds: number
  created_at: string
}

interface Props {
  token: string
  plan: string
}

export default function MeetingClient({ token, plan }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState('')
  const [duration, setDuration] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [audioLang, setAudioLang] = useState<'auto' | 'en' | 'km'>('auto')
  const [savedMeetings, setSavedMeetings] = useState<SavedMeeting[]>([])
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )
  const [saving, setSaving] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maxDuration = plan === 'free' ? 5 * 60 : 60 * 60

  // Auth headers — cookies handle web auth, Bearer token as backup
  const authHeaders = (): HeadersInit => {
    const h: HeadersInit = {}
    if (token) h['Authorization'] = `Bearer ${token}`
    return h
  }

  // Load saved meetings on mount, on focus, and every 30s
  useEffect(() => {
    fetchMeetings()
    const onFocus = () => fetchMeetings()
    const interval = setInterval(fetchMeetings, 30000)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      clearInterval(interval)
    }
  }, [token])

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings', {
        headers: authHeaders(),
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        setSavedMeetings(data)
      } else {
        console.error('Meetings fetch failed:', res.status)
      }
    } catch (err) {
      console.error('Meetings fetch error:', err)
    }
  }

  const saveMeeting = async (summaryText: string, transcriptText: string, dur: number) => {
    setSaving(true)
    try {
      const firstLine = summaryText.split('\n').find(l => l.trim() && !l.startsWith('#'))?.trim() || 'Untitled Meeting'
      const title = firstLine.slice(0, 80)

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, transcript: transcriptText, summary: summaryText, duration: dur }),
      })
      if (res.ok) {
        const { id } = await res.json()
        setActiveMeetingId(id)
        await fetchMeetings()
      }
    } catch {
      // ignore save errors
    }
    setSaving(false)
  }

  const loadMeeting = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        headers: authHeaders(),
        credentials: 'include',
      })
      if (res.ok) {
        const data: MeetingDetail = await res.json()
        setTranscript(data.transcript || '')
        setSummary(data.summary || '')
        setDuration(data.duration_seconds || 0)
        setActiveMeetingId(data.id)
        setPhase('complete')
        setError('')
        setShowTranscript(false)
      }
    } catch {
      setError('Failed to load meeting')
    }
  }

  const deleteMeeting = async (id: string) => {
    try {
      await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      })
      setSavedMeetings(prev => prev.filter(m => m.id !== id))
      if (activeMeetingId === id) reset()
    } catch {
      // ignore
    }
  }

  const startRecording = useCallback(async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        processAudio(blob)
      }

      mediaRecorder.start(1000)
      setPhase('recording')
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }, [maxDuration])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    processAudio(file)
  }

  const processAudio = async (audioBlob: Blob) => {
    setPhase('transcribing')
    setActiveMeetingId(null)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      if (audioLang !== 'auto') formData.append('language', audioLang)

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: formData,
      })

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json()
        throw new Error(err.detail || 'Transcription failed')
      }

      const { transcript: text, duration: dur } = await transcribeRes.json()
      setTranscript(text)
      if (dur) setDuration(dur)

      setPhase('summarizing')
      const summarizeRes = await fetch('/api/summarize', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transcript: text, duration: dur }),
      })

      if (!summarizeRes.ok) {
        const err = await summarizeRes.json()
        throw new Error(err.detail || 'Summarization failed')
      }

      const reader = summarizeRes.body?.getReader()
      const decoder = new TextDecoder()
      let fullSummary = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const { text: t } = JSON.parse(line.slice(6))
                if (t) {
                  fullSummary += t
                  setSummary(fullSummary)
                }
              } catch {
                // skip
              }
            }
          }
        }
      }

      setPhase('complete')

      // Auto-save
      await saveMeeting(fullSummary, text, dur || 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setPhase('idle')
    }
  }

  const handleExportPdf = async () => {
    const { generateMeetingPdf } = await import('@/lib/meeting-pdf')
    generateMeetingPdf(summary, transcript, duration)
  }

  const reset = () => {
    setPhase('idle')
    setTranscript('')
    setSummary('')
    setDuration(0)
    setRecordingTime(0)
    setError('')
    setShowTranscript(false)
    setActiveMeetingId(null)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      {sidebarOpen ? (
        <>
          <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full z-40 w-72 md:w-64 md:static md:z-auto bg-sidebar border-r border-gray-200 flex flex-col flex-shrink-0">
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
              <div className="flex items-center gap-2 px-1">
                <Image src="/logo.png" alt="AngkorAI" width={24} height={24} className="rounded-full" />
                <span className="font-semibold text-sm text-gray-900">Meetings</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={fetchMeetings} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700" title="Refresh">
                  <RefreshCw size={14} />
                </button>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* New recording button */}
            <div className="px-3 mb-2">
              <button
                onClick={reset}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-sm transition-colors group"
              >
                <Plus size={16} className="text-gray-400 group-hover:text-gray-700" />
                New recording
              </button>
            </div>

            {/* Back to chat */}
            <div className="px-3 mb-2">
              <Link
                href="/chat"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-xs transition-colors"
              >
                <ArrowLeft size={14} />
                Back to Chat
              </Link>
            </div>

            {/* Saved meetings list */}
            <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
              {savedMeetings.length === 0 && (
                <p className="text-gray-400 text-xs text-center py-8">No saved meetings yet</p>
              )}
              {savedMeetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => loadMeeting(m.id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    activeMeetingId === m.id
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FileText size={14} className="flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{m.title}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(m.created_at)}
                      {m.duration_seconds > 0 && ` · ${Math.round(m.duration_seconds / 60)}m`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMeeting(m.id) }}
                    className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <PanelLeft size={18} />
              </button>
            )}
            <h1 className="font-semibold text-sm text-gray-900">Meeting Summarizer</h1>
            {saving && <span className="text-xs text-gray-400">Saving...</span>}
          </div>
          {phase === 'complete' && (
            <button onClick={reset} className="text-xs text-accent hover:text-accent/80 font-medium transition-colors">
              New Recording
            </button>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* IDLE */}
            {phase === 'idle' && (
              <div className="text-center space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Record or Upload</h2>
                  <p className="text-gray-500 text-sm">
                    Record a meeting or upload an audio file. AngkorAI will transcribe and summarize it.
                  </p>
                  {plan === 'free' && (
                    <p className="text-xs text-accent mt-2">Free plan: max 5 minute recordings</p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-500">Audio language:</span>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setAudioLang('auto')}
                      className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                        audioLang === 'auto' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      onClick={() => setAudioLang('en')}
                      className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                        audioLang === 'en' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setAudioLang('km')}
                      className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                        audioLang === 'km' ? 'bg-accent text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ខ្មែរ
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={startRecording}
                    className="w-24 h-24 rounded-full bg-accent hover:bg-accent/90 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    <Mic size={36} />
                  </button>
                  <span className="text-sm text-gray-500">Tap to record</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div>
                  <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 text-sm transition-colors"
                  >
                    <Upload size={16} />
                    Upload audio file
                  </button>
                  <p className="text-xs text-gray-400 mt-2">Supports MP3, WAV, M4A, WebM, MP4</p>
                </div>
              </div>
            )}

            {/* RECORDING */}
            {phase === 'recording' && (
              <div className="text-center space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Recording...</h2>
                  <p className="text-gray-500 text-sm">Speak clearly. Tap stop when finished.</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl font-mono font-bold text-gray-900">{formatTime(recordingTime)}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Recording
                    {plan === 'free' && <span>· Max {formatTime(maxDuration)}</span>}
                  </div>
                </div>
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg mx-auto transition-all active:scale-95"
                >
                  <Square size={28} fill="white" />
                </button>
              </div>
            )}

            {/* TRANSCRIBING */}
            {phase === 'transcribing' && (
              <div className="text-center space-y-6">
                <Loader2 size={48} className="animate-spin text-accent mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Transcribing audio...</h2>
                  <p className="text-gray-500 text-sm">Converting speech to text with Whisper AI</p>
                </div>
              </div>
            )}

            {/* SUMMARIZING */}
            {phase === 'summarizing' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Loader2 size={48} className="animate-spin text-accent mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Generating summary...</h2>
                  <p className="text-gray-500 text-sm">AngkorAI is analyzing your meeting</p>
                </div>
                {summary && (
                  <div className="bg-gray-50 rounded-2xl p-6 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}

            {/* COMPLETE */}
            {phase === 'complete' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <CheckCircle2 size={20} className="text-green-600" />
                  <div>
                    <p className="text-green-800 text-sm font-medium">Summary ready!</p>
                    {duration > 0 && (
                      <p className="text-green-600 text-xs flex items-center gap-1">
                        <Clock size={11} />
                        {Math.round(duration / 60)} min recording
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6 prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportPdf}
                    className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Download size={16} />
                    Export PDF
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(summary)}
                    className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-600 transition-colors"
                  >
                    <FileText size={16} />
                    Copy Summary
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-sm text-gray-600 transition-colors"
                  >
                    <span className="font-medium">Full Transcript</span>
                    {showTranscript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {showTranscript && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3 max-h-80 overflow-y-auto">
                      {transcript}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
