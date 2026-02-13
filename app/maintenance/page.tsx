'use client'

import { useEffect, useMemo, useState } from 'react'

type Countdown = {
  days: string
  hours: string
  minutes: string
  seconds: string
}

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function computeCountdown(targetMs: number): Countdown {
  const diff = Math.max(0, targetMs - Date.now())
  const totalSeconds = Math.floor(diff / 1000)

  const days = Math.floor(totalSeconds / (60 * 60 * 24))
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60

  return {
    days: pad2(days),
    hours: pad2(hours),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
  }
}

export default function MaintenancePage() {
  const targetMs = useMemo(() => {
    // Default to Feb 16, 2026 if env var is not set
    const raw = process.env.NEXT_PUBLIC_MAINTENANCE_END_AT || '2026-02-16T00:00:00+09:00'
    const ms = Date.parse(raw)
    return Number.isFinite(ms) ? ms : null
  }, [])

  const [countdown, setCountdown] = useState<Countdown>(() => {
    if (!targetMs) {
      return { days: '--', hours: '--', minutes: '--', seconds: '--' }
    }
    return computeCountdown(targetMs)
  })

  useEffect(() => {
    if (!targetMs) return
    const id = window.setInterval(() => setCountdown(computeCountdown(targetMs)), 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  return (
    <div className="fixed inset-0 z-[60] h-[100dvh] overflow-x-hidden overflow-y-auto overscroll-contain text-slate-200 bg-[#1A1412]">
      {/* Soft blobs (Fixed position) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Content Wrapper with Gradient Background */}
      <div
        className="relative flex min-h-full flex-col items-center justify-between px-6 py-8 lg:py-12"
        style={{ background: 'linear-gradient(180deg, #1A1412 0%, #2D1B15 100%)' }}
      >
        {/* Header */}
        <header className="w-full flex justify-center items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="w-8 h-8 bg-gradient-to-br from-[#D4A373] to-orange-700 rounded-lg flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-[20px] font-light">redeem</span>
          </div>
          <span className="text-lg font-medium tracking-tight text-white/90">TokuSearch</span>
        </header>

        <main className="flex flex-col items-center text-center w-full max-w-4xl py-12 lg:py-20">
          <div className="space-y-6 mb-16 lg:mb-24">
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.2]"
              style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #D4A373 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              毎日をもっと、
              <br className="md:hidden" />
              おトクに。
            </h1>
            <p className="text-white/50 text-base md:text-xl font-light max-w-xl mx-auto leading-relaxed">
              新しくなったサービスで、あなたの暮らしを豊かに。
              <br className="hidden md:block" />
              まもなく公開予定です。
            </p>
          </div>

          {/* Mock phone + floating icons */}
          <div className="relative w-full max-w-[320px] md:max-w-[400px] aspect-[4/5] flex items-center justify-center mb-16 lg:mb-24">
            {/* Phone Body */}
            <div
              className="w-[240px] h-[480px] md:w-[280px] md:h-[560px] rounded-[3rem] p-4 relative overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-10" />
              <div className="space-y-6 px-2">
                <div className="h-32 w-full bg-white/5 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/5 text-5xl">auto_awesome</span>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-white/10 rounded-full" />
                  <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-20 bg-white/5 rounded-xl border border-white/5" />
                  <div className="h-20 bg-white/5 rounded-xl border border-white/5" />
                </div>
                <div className="h-12 w-full bg-[#D4A373]/20 rounded-xl border border-[#D4A373]/20" />
              </div>
            </div>

            {/* Floating Icon 1 */}
            <div
              className="absolute top-[15%] -right-4 md:-right-12 p-4 md:p-6 rotate-6 rounded-[1.5rem] md:rounded-[2rem]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="bg-orange-400/10 p-2 md:p-3 rounded-xl md:rounded-2xl">
                <span className="material-symbols-outlined text-3xl md:text-5xl text-[#D4A373]">local_mall</span>
              </div>
            </div>

            {/* Floating Icon 2 */}
            <div
              className="absolute bottom-[20%] -left-4 md:-left-12 p-4 md:p-6 -rotate-12 rounded-[1.5rem] md:rounded-[2rem]"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="bg-amber-400/10 p-2 md:p-3 rounded-xl md:rounded-2xl">
                <span className="material-symbols-outlined text-3xl md:text-5xl text-[#E9EDC6]">payments</span>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="w-full flex flex-col items-center">
            <p className="text-white/30 text-[10px] md:text-xs tracking-[0.3em] font-medium uppercase mb-8">
              LAUNCHING IN
            </p>
            <div className="flex gap-4 md:gap-8 justify-center items-start">
              <CountdownCell label="日" value={countdown.days} />
              <CountdownCell label="時間" value={countdown.hours} />
              <CountdownCell label="分" value={countdown.minutes} />
              <CountdownCell label="秒" value={countdown.seconds} accent />
            </div>
          </div>
        </main>

        <footer className="w-full flex flex-col items-center gap-3 py-4 pb-10">
          <p className="text-white/20 text-[10px] md:text-xs font-light tracking-wider">
            © {new Date().getFullYear()} TokuSearch.
          </p>
        </footer>
      </div>
    </div>
  )
}

function CountdownCell({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-center w-16 md:w-20">
      <div
        className="w-full aspect-square flex items-center justify-center rounded-2xl mb-3"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: accent ? '1px solid rgba(212, 163, 115, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <span
          className={`text-2xl md:text-3xl font-light ${accent ? 'text-[#D4A373]' : 'text-white/90'}`}
        >
          {value}
        </span>
      </div>
      <span className="text-white/30 text-[10px] md:text-xs font-medium tracking-widest">{label}</span>
    </div>
  )
}