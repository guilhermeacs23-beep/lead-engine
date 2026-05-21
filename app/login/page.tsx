'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'

function LELogo({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="silver1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#d0d8e8" stopOpacity="1" />
          <stop offset="100%" stopColor="#8fa0b8" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="silver2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#b8c8dc" stopOpacity="1" />
          <stop offset="100%" stopColor="#6a80a0" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="silverAccent" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* L — vertical stroke */}
      <path d="M6 8 L6 40 L18 40 L18 36 L10 36 L10 8 Z" fill="url(#silver1)" />
      {/* L — highlight layer */}
      <path d="M6 8 L7.5 9.5 L7.5 35 L18 36 L18 40 L6 40 Z" fill="url(#silverAccent)" />

      {/* E — vertical stroke */}
      <path d="M22 8 L22 40 L26 40 L26 8 Z" fill="url(#silver1)" />
      {/* E — top bar */}
      <path d="M22 8 L38 8 L38 12 L22 12 Z" fill="url(#silver2)" />
      {/* E — middle bar */}
      <path d="M22 22 L35 22 L35 26 L22 26 Z" fill="url(#silver2)" />
      {/* E — bottom bar */}
      <path d="M22 36 L38 36 L38 40 L22 40 Z" fill="url(#silver2)" />

      {/* Shine overlay on E bars */}
      <path d="M22 8 L38 8 L38 9.5 L22 9.5 Z" fill="white" opacity="0.4" />
      <path d="M22 22 L35 22 L35 23.5 L22 23.5 Z" fill="white" opacity="0.3" />
      <path d="M22 36 L38 36 L38 37.5 L22 37.5 Z" fill="white" opacity="0.3" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email,   setEmail]   = useState('')
  const [senha,   setSenha]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 60% 30%, #1a4a8a 0%, #0d2d6b 35%, #071840 70%, #030c24 100%)',
      }}
    >
      {/* Subtle light rays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(100,160,255,0.12) 0%, transparent 60%)',
        }}
      />

      {/* Bottom vignette */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-64"
        style={{ background: 'linear-gradient(to top, rgba(3,12,36,0.8), transparent)' }}
      />

      {/* Reflection glow under card */}
      <div
        className="pointer-events-none absolute"
        style={{
          width: 320,
          height: 80,
          bottom: 'calc(50% - 240px)',
          background: 'rgba(100,160,255,0.08)',
          filter: 'blur(40px)',
          borderRadius: '50%',
        }}
      />

      {/* Card — preto glassmorphism */}
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl px-8 py-9"
        style={{
          background: 'rgba(0,0,0,0.72)',
          border: '0.5px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(145deg, #0d2d6b, #0a1f4e)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
     