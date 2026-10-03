// ПРОТОТИП, выбросить. Плавающая панель для переключения вариантов прототипа
// через ?variant= (стрелки на панели и клавиши ←/→).
import { useEffect, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

type Props = {
  variants: { key: string; name: string }[]
  // Дополнительные элементы управления прототипа (пресеты данных и т. п.)
  extra?: ReactNode
}

// eslint-disable-next-line react-refresh/only-export-components -- прототип
export function useVariant(keys: string[]): string {
  const [params] = useSearchParams()
  const v = params.get('variant') ?? keys[0]
  return keys.includes(v) ? v : keys[0]
}

function PrototypeSwitcher({ variants, extra }: Props) {
  const [params, setParams] = useSearchParams()
  const keys = variants.map((v) => v.key)
  const current = useVariant(keys)
  const idx = keys.indexOf(current)

  const go = (delta: number) => {
    const next = keys[(idx + delta + keys.length) % keys.length]
    const p = new URLSearchParams(params)
    p.set('variant', next)
    setParams(p, { replace: true })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (import.meta.env.PROD) return null

  const btn = 'rounded-full px-2 py-1 hover:bg-white/15'
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-zinc-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-2xl ring-2 ring-fuchsia-500">
      <span className="font-bold text-fuchsia-400">ПРОТОТИП</span>
      <button className={btn} onClick={() => go(-1)} aria-label="Предыдущий вариант">←</button>
      <span className="min-w-40 text-center font-medium">
        {current} ({variants[idx].name})
      </span>
      <button className={btn} onClick={() => go(1)} aria-label="Следующий вариант">→</button>
      {extra}
    </div>
  )
}

export default PrototypeSwitcher
