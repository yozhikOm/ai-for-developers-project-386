// ПРОТОТИП, выбросить. Вариант B «Всё на одном экране»: никаких шагов и главной.
// Гость: одна страница — типы слева, лента из 14 дней сверху, слоты-чипы,
// форма раскрывается прямо под выбранным слотом, успех — там же.
// Владелец: один дашборд — «Сейчас идёт» + повестка по дням слева,
// типы событий со всегда открытой формой создания справа.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Field, OWNER_NAME, currentBooking, dateTime, dayShort, daySlots, freeCount, range, sameDay, time,
  upcomingBookings, useStore, windowDays, type Booking, type FieldErrors, type Slot,
} from './store.tsx'

function VariantB() {
  const [role, setRole] = useState<'guest' | 'owner'>('guest')
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-heading font-semibold">Календарь звонков</span>
        {/* В реальном приложении у владельца отдельный URL (/admin), переключатель — только для прототипа */}
        <div className="flex rounded-lg bg-muted p-1 text-sm">
          {(['guest', 'owner'] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={`rounded-md px-3 py-1 ${role === r ? 'bg-background shadow' : 'text-muted-foreground'}`}>
              {r === 'guest' ? 'Гость' : 'Владелец (/admin)'}
            </button>
          ))}
        </div>
      </header>
      {role === 'guest' ? <GuestPage /> : <OwnerDashboard />}
    </div>
  )
}

function GuestPage() {
  const { eventTypes, bookings, createBooking } = useStore()
  const [typeId, setTypeId] = useState(eventTypes[0]?.id)
  const type = eventTypes.find((t) => t.id === typeId)
  const days = windowDays()
  const [day, setDay] = useState(days[0])
  const [slot, setSlot] = useState<Slot>()
  const [done, setDone] = useState<Booking>()
  const [notice, setNotice] = useState<string>()

  if (eventTypes.length === 0) {
    return <p className="p-16 text-center text-muted-foreground">Записаться пока нельзя: типов встреч ещё нет.</p>
  }
  const slots = type ? daySlots(type, day, bookings) : []
  const reset = () => { setSlot(undefined); setDone(undefined); setNotice(undefined) }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-6 md:grid-cols-[260px_1fr]">
      <aside className="flex flex-col gap-2">
        <h1 className="font-heading text-xl font-semibold">Запись на звонок · {OWNER_NAME}</h1>
        <p className="mb-2 text-sm text-muted-foreground">1. Выберите тип встречи</p>
        {eventTypes.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTypeId(t.id); reset() }}
            className={`rounded-lg border p-3 text-left ${t.id === typeId ? 'border-primary bg-accent' : 'hover:bg-muted'}`}
          >
            <div className="flex justify-between font-medium"><span>{t.title}</span><span className="text-sm">{t.duration} мин</span></div>
            {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
          </button>
        ))}
      </aside>
      <section className="flex min-w-0 flex-col gap-4">
        <p className="text-sm text-muted-foreground">2. Выберите день (ближайшие 14 дней)</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const n = type ? freeCount(type, d, bookings) : 0
            const sel = sameDay(d, day)
            return (
              <button
                key={d.toISOString()}
                onClick={() => { setDay(d); reset() }}
                className={`flex min-w-20 flex-col items-center rounded-lg border px-2 py-2 text-sm ${sel ? 'border-primary bg-primary text-primary-foreground' : n === 0 ? 'opacity-50' : 'hover:bg-muted'}`}
              >
                <span>{dayShort(d)}</span>
                <span className="text-xs">{n === 0 ? 'нет мест' : `${n} св.`}</span>
              </button>
            )
          })}
        </div>
        <p className="text-sm text-muted-foreground">3. Выберите время</p>
        {notice && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{notice}</div>}
        {slots.length === 0 && <p className="text-muted-foreground">На этот день слотов не осталось.</p>}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
          {slots.map((s) => {
            const sel = slot?.start.getTime() === s.start.getTime()
            const mine = done && done.start.getTime() === s.start.getTime()
            return (
              <button
                key={s.start.toISOString()}
                disabled={!s.free || !!done}
                onClick={() => { setSlot(s); setNotice(undefined) }}
                className={`rounded-md border py-2 text-sm ${mine ? 'border-primary bg-primary/15 font-medium' : sel ? 'border-primary bg-primary text-primary-foreground' : s.free ? 'hover:border-primary' : 'bg-muted text-muted-foreground line-through'}`}
                title={s.free ? 'Свободно' : 'Занято'}
              >
                {mine ? 'Ваша бронь' : time(s.start)}
              </button>
            )
          })}
        </div>
        {slot && type && !done && (
          <InlineForm
            summary={`${type.title}, ${dayShort(slot.start)} ${range(slot.start, slot.end)}`}
            onCancel={() => setSlot(undefined)}
            onSubmit={(guestName, guestEmail) => {
              const r = createBooking({ guestName, guestEmail, eventTypeId: type.id, start: slot.start })
              if (r.ok) setDone(r.booking)
              else if (r.reason === 'slot_taken') { setSlot(undefined); setNotice('Этот слот только что заняли. Список обновлён — выберите другое время.') }
              return !r.ok && r.reason === 'invalid' ? r.errors : {}
            }}
          />
        )}
        {done && (
          <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-accent p-4">
            <div>
              <p className="font-medium">✓ Бронь подтверждена. До встречи!</p>
              <p className="text-sm">{dayShort(done.start)}, {range(done.start, done.end)} · {done.guestName}, {done.guestEmail}</p>
            </div>
            <Button variant="outline" onClick={reset}>Забронировать ещё</Button>
          </div>
        )}
      </section>
    </div>
  )
}

function InlineForm({ summary, onSubmit, onCancel }: { summary: string; onSubmit: (n: string, e: string) => FieldErrors; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <p className="text-sm">4. Ваши данные · <span className="font-medium">{summary}</span></p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Имя" value={name} onChange={setName} error={errors.guestName} />
        <Field label="Email" type="email" value={email} onChange={setEmail} error={errors.guestEmail} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setErrors(onSubmit(name, email))}>Забронировать</Button>
        <Button variant="ghost" onClick={onCancel}>Отмена</Button>
      </div>
    </div>
  )
}

function OwnerDashboard() {
  const { bookings, eventTypes, typeById, createEventType } = useStore()
  const current = currentBooking(bookings)
  const upcoming = upcomingBookings(bookings)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('30')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [justCreated, setJustCreated] = useState<string>()

  // Повестка: группировка по дням
  const groups: { day: Date; items: Booking[] }[] = []
  for (const b of upcoming) {
    const g = groups.find((x) => sameDay(x.day, b.start))
    if (g) g.items.push(b)
    else groups.push({ day: b.start, items: [b] })
  }
  // eslint-disable-next-line react-hooks/purity -- прототип: прогресс считается на момент рендера
  const progress = current ? Math.round(((Date.now() - current.start.getTime()) / (current.end.getTime() - current.start.getTime())) * 100) : 0

  return (
    <div className="mx-auto grid max-w-6xl gap-8 p-6 md:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-xl font-semibold">Предстоящие встречи</h1>
        {current && (
          <div className="rounded-xl bg-primary p-4 text-primary-foreground">
            <div className="flex justify-between text-sm"><span>Сейчас идёт · до {time(current.end)}</span><span>{typeById(current.eventTypeId)?.title}</span></div>
            <div className="text-lg font-medium">{current.guestName} <span className="text-sm opacity-80">{current.guestEmail}</span></div>
            <div className="mt-2 h-1.5 rounded bg-primary-foreground/30"><div className="h-full rounded bg-primary-foreground" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
        {groups.length === 0 && <p className="text-muted-foreground">Предстоящих встреч нет.</p>}
        {groups.map((g) => (
          <div key={g.day.toDateString()}>
            <h2 className="sticky top-0 bg-background py-1 text-sm font-semibold text-muted-foreground">{dayShort(g.day)}</h2>
            <ul className="divide-y rounded-lg border">
              {g.items.map((b) => (
                <li key={b.id} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 px-3 py-2 text-sm">
                  <span className="font-mono">{range(b.start, b.end)}</span>
                  <span><span className="font-medium">{b.guestName}</span> <span className="text-muted-foreground">{b.guestEmail}</span></span>
                  <span className="text-right text-xs text-muted-foreground">{typeById(b.eventTypeId)?.title}<br />создано {dateTime(b.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <aside className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold">Типы событий</h2>
        <div className="flex flex-col gap-2 rounded-xl bg-muted p-3">
          <Field label="Название" value={title} onChange={setTitle} error={errors.title} />
          <Field label="Описание" value={description} onChange={setDescription} placeholder="необязательно" />
          <Field label="Минут (кратно 15)" type="number" value={duration} onChange={setDuration} error={errors.duration} />
          <Button
            onClick={() => {
              const r = createEventType({ title, description, duration })
              if (r.ok) { setTitle(''); setDescription(''); setErrors({}); setJustCreated(r.eventType.id) }
              else setErrors(r.errors)
            }}
          >
            Добавить тип
          </Button>
        </div>
        {eventTypes.length === 0 && <p className="text-sm text-muted-foreground">Пока ни одного — гостям нечего бронировать.</p>}
        {eventTypes.map((t) => (
          <div key={t.id} className={`rounded-lg border p-2 text-sm ${t.id === justCreated ? 'border-primary bg-accent' : ''}`}>
            <div className="flex justify-between font-medium"><span>{t.title}</span><span>{t.duration} мин</span></div>
            {t.description && <div className="text-xs text-muted-foreground">{t.description}</div>}
          </div>
        ))}
      </aside>
    </div>
  )
}

export default VariantB
