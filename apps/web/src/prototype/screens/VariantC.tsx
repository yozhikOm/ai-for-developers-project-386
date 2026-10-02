// ПРОТОТИП, выбросить. Вариант C «Профиль владельца + админка» (в духе Cal.com).
// Гость: публичная страница владельца со списком типов → страница типа,
// где все 14 дней идут вертикальной повесткой с чипами слотов (без месячного
// календаря) → бронь в модальном окне, успех и конфликт — там же.
// Владелец: отдельная админ-оболочка с боковым меню; предстоящие — таблица
// с закреплённой строкой «Сейчас идёт»; создание типа — выдвижная панель.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Field, OWNER_NAME, currentBooking, dateTime, dayLong, daySlots, range, time,
  upcomingBookings, useStore, windowDays, type Booking, type EventType, type FieldErrors, type Slot,
} from './store.tsx'

type Screen = { name: 'profile' } | { name: 'type'; type: EventType } | { name: 'admin'; section: 'upcoming' | 'types' }

function VariantC() {
  const [screen, setScreen] = useState<Screen>({ name: 'profile' })
  if (screen.name === 'admin') return <Admin section={screen.section} go={setScreen} />
  return (
    <div className="min-h-screen bg-zinc-100 py-10">
      <div className="mx-auto max-w-3xl px-4">
        {screen.name === 'profile' && <Profile go={setScreen} />}
        {screen.name === 'type' && <TypePage type={screen.type} go={setScreen} />}
        {/* Вход владельца — неприметная ссылка внизу публичной страницы */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <button className="underline" onClick={() => setScreen({ name: 'admin', section: 'upcoming' })}>Вход для владельца</button>
        </p>
      </div>
    </div>
  )
}

type Go = (s: Screen) => void

function Avatar() {
  return <div className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">МИ</div>
}

function Profile({ go }: { go: Go }) {
  const { eventTypes } = useStore()
  return (
    <div className="overflow-hidden rounded-2xl bg-background shadow-sm">
      <div className="flex flex-col items-center gap-2 border-b p-8">
        <Avatar />
        <h1 className="font-heading text-2xl font-semibold">{OWNER_NAME}</h1>
        <p className="text-muted-foreground">Выберите формат звонка</p>
      </div>
      {eventTypes.length === 0 && <p className="p-8 text-center text-muted-foreground">Сейчас нет доступных форматов звонка.</p>}
      <ul className="divide-y">
        {eventTypes.map((t) => (
          <li key={t.id}>
            <button className="flex w-full items-center justify-between p-5 text-left hover:bg-muted" onClick={() => go({ name: 'type', type: t })}>
              <span>
                <span className="block font-medium">{t.title}</span>
                {t.description && <span className="block text-sm text-muted-foreground">{t.description}</span>}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-sm">⏱ {t.duration} мин</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TypePage({ type, go }: { type: EventType; go: Go }) {
  const { bookings } = useStore()
  const [slot, setSlot] = useState<Slot>()
  const [showFull, setShowFull] = useState(false)
  const days = windowDays().map((d) => ({ d, slots: daySlots(type, d, bookings) }))
  const anyFree = days.some((x) => x.slots.some((s) => s.free))
  return (
    <div className="grid overflow-hidden rounded-2xl bg-background shadow-sm md:grid-cols-[240px_1fr]">
      <div className="flex flex-col gap-2 border-b p-6 md:border-r md:border-b-0">
        <button className="self-start text-sm text-muted-foreground hover:underline" onClick={() => go({ name: 'profile' })}>← Все форматы</button>
        <Avatar />
        <p className="text-sm text-muted-foreground">{OWNER_NAME}</p>
        <h1 className="font-heading text-xl font-semibold">{type.title}</h1>
        <p className="text-sm">⏱ {type.duration} мин</p>
        <p className="text-sm text-muted-foreground">{type.description}</p>
      </div>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-auto p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Свободное время на 14 дней</h2>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={showFull} onChange={(e) => setShowFull(e.target.checked)} /> показывать занятые
          </label>
        </div>
        {!anyFree && <p className="text-muted-foreground">В ближайшие 14 дней свободного времени нет.</p>}
        {days.map(({ d, slots }) => {
          const free = slots.filter((s) => s.free)
          const shown = showFull ? slots : free
          return (
            <div key={d.toISOString()} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">{dayLong(d)} <span className="font-normal text-muted-foreground">· {free.length} св.</span></h3>
              {free.length === 0 && !showFull ? (
                <p className="text-xs text-muted-foreground">нет мест</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {shown.map((s) => (
                    <button
                      key={s.start.toISOString()}
                      disabled={!s.free}
                      onClick={() => setSlot(s)}
                      className={`rounded-full border px-3 py-1 text-sm ${s.free ? 'border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground line-through'}`}
                    >
                      {time(s.start)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {slot && <BookingModal type={type} slot={slot} onClose={() => setSlot(undefined)} />}
    </div>
  )
}

function BookingModal({ type, slot, onClose }: { type: EventType; slot: Slot; onClose: () => void }) {
  const { createBooking } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [state, setState] = useState<{ kind: 'form' } | { kind: 'done'; booking: Booking } | { kind: 'taken' }>({ kind: 'form' })
  const submit = () => {
    const r = createBooking({ eventTypeId: type.id, start: slot.start, guestName: name, guestEmail: email })
    if (r.ok) setState({ kind: 'done', booking: r.booking })
    else if (r.reason === 'invalid') setErrors(r.errors)
    else setState({ kind: 'taken' })
  }
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-muted-foreground">{type.title} · {type.duration} мин</p>
        <p className="font-medium">{dayLong(slot.start)}, {range(slot.start, slot.end)}</p>
        {state.kind === 'form' && (
          <>
            <Field label="Имя" value={name} onChange={setName} error={errors.guestName} />
            <Field label="Email" type="email" value={email} onChange={setEmail} error={errors.guestEmail} />
            <Button onClick={submit}>Подтвердить</Button>
            <Button variant="ghost" onClick={onClose}>Выбрать другое время</Button>
          </>
        )}
        {state.kind === 'done' && (
          <>
            <p className="text-lg font-semibold">✓ Вы записаны</p>
            <p className="text-sm">{state.booking.guestName}, ждём вас. Детали — {state.booking.guestEmail}.</p>
            <Button onClick={onClose}>Готово</Button>
          </>
        )}
        {state.kind === 'taken' && (
          <>
            <p className="font-semibold text-destructive">Это время только что заняли</p>
            <p className="text-sm">Пока вы заполняли форму, слот забронировал кто-то другой. Выберите другое время — список уже обновлён.</p>
            <Button onClick={onClose}>Выбрать другое время</Button>
          </>
        )}
      </div>
    </div>
  )
}

function Admin({ section, go }: { section: 'upcoming' | 'types'; go: Go }) {
  const nav = 'w-full rounded-md px-3 py-2 text-left text-sm'
  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-1 bg-zinc-900 p-3 text-zinc-100">
        <div className="mb-4 flex items-center gap-2 px-2 py-2 font-semibold">📅 Админка</div>
        <button className={`${nav} ${section === 'upcoming' ? 'bg-white/15' : 'hover:bg-white/10'}`} onClick={() => go({ name: 'admin', section: 'upcoming' })}>Предстоящие</button>
        <button className={`${nav} ${section === 'types' ? 'bg-white/15' : 'hover:bg-white/10'}`} onClick={() => go({ name: 'admin', section: 'types' })}>Типы событий</button>
        <div className="flex-1" />
        <button className={`${nav} text-zinc-400 hover:bg-white/10`} onClick={() => go({ name: 'profile' })}>↗ Моя публичная страница</button>
        <div className="px-3 py-2 text-xs text-zinc-500">{OWNER_NAME}</div>
      </aside>
      <main className="bg-zinc-50 p-8">{section === 'upcoming' ? <UpcomingTable /> : <TypesAdmin />}</main>
    </div>
  )
}

function UpcomingTable() {
  const { bookings, typeById } = useStore()
  const current = currentBooking(bookings)
  const upcoming = upcomingBookings(bookings)
  const row = (b: Booking, live = false) => (
    <tr key={b.id} className={`border-t ${live ? 'bg-emerald-50' : ''}`}>
      <td className="p-3 whitespace-nowrap">
        {live && <span className="mr-2 rounded bg-emerald-600 px-1.5 py-0.5 text-xs text-white">LIVE · идёт сейчас</span>}
        <span>{dayLong(b.start)}</span>, {range(b.start, b.end)}
      </td>
      <td className="p-3 font-medium">{b.guestName}</td>
      <td className="p-3 text-muted-foreground">{b.guestEmail}</td>
      <td className="p-3">{typeById(b.eventTypeId)?.title}</td>
      <td className="p-3 text-xs text-muted-foreground">{dateTime(b.createdAt)}</td>
    </tr>
  )
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Предстоящие встречи</h1>
      <table className="w-full overflow-hidden rounded-xl bg-background text-sm shadow-sm">
        <thead className="text-left text-xs text-muted-foreground uppercase">
          <tr><th className="p-3">Когда</th><th className="p-3">Гость</th><th className="p-3">Email</th><th className="p-3">Тип</th><th className="p-3">Создано</th></tr>
        </thead>
        <tbody>
          {current && row(current, true)}
          {upcoming.map((b) => row(b))}
          {!current && upcoming.length === 0 && (
            <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Пока никто не записался.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TypesAdmin() {
  const { eventTypes, createEventType } = useStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('30')
  const [errors, setErrors] = useState<FieldErrors>({})
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Типы событий</h1>
        <Button onClick={() => setOpen(true)}>+ Новый тип</Button>
      </div>
      {eventTypes.length === 0 && (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          Создайте первый тип события — без него гостям нечего бронировать.
        </div>
      )}
      <div className="flex flex-col gap-2">
        {eventTypes.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl bg-background p-4 shadow-sm">
            <div>
              <p className="font-medium">{t.title}</p>
              <p className="text-sm text-muted-foreground">{t.description || 'Без описания'}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-sm">{t.duration} мин</span>
          </div>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => setOpen(false)}>
          <div className="flex w-96 flex-col gap-3 bg-background p-6 pb-24 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-lg font-semibold">Новый тип события</h2>
            <Field label="Название" value={title} onChange={setTitle} error={errors.title} />
            <Field label="Описание" value={description} onChange={setDescription} multiline placeholder="необязательно" />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Длительность</span>
              <div className="flex gap-2">
                {['15', '30', '45', '60'].map((m) => (
                  <button key={m} onClick={() => setDuration(m)} className={`rounded-md border px-3 py-1 ${duration === m ? 'border-primary bg-accent' : ''}`}>{m}</button>
                ))}
                <input className="w-20 rounded-md border px-2" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              {errors.duration && <span className="text-xs text-destructive">{errors.duration}</span>}
            </div>
            <div className="flex-1" />
            <Button
              onClick={() => {
                const r = createEventType({ title, description, duration })
                if (r.ok) { setOpen(false); setTitle(''); setDescription(''); setErrors({}) }
                else setErrors(r.errors)
              }}
            >
              Сохранить
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VariantC
