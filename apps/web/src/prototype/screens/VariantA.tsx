// ПРОТОТИП, выбросить. Вариант A «Шаги, как в демо»: каждый шаг — отдельный экран.
// Гость: Главная → Типы событий → Календарь (3 колонки) → Подтверждение → Готово.
// Владелец: отдельный раздел с вкладками «Предстоящие» и «Типы событий»,
// создание типа — отдельный экран-форма.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field, OWNER_NAME, cap, currentBooking, dateTime, dayLong, daySlots, freeCount, range, sameDay,
  upcomingBookings, useStore, windowDays, type Booking, type EventType, type FieldErrors, type Slot,
} from './store.tsx'

type Screen =
  | { name: 'home' }
  | { name: 'types' }
  | { name: 'calendar'; type: EventType; day?: Date; slot?: Slot; error?: string }
  | { name: 'confirm'; type: EventType; slot: Slot }
  | { name: 'done'; booking: Booking }
  | { name: 'owner'; tab: 'upcoming' | 'types'; highlight?: string }
  | { name: 'newType' }

function VariantA() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  const isOwner = screen.name === 'owner' || screen.name === 'newType'
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button className="font-heading text-lg font-semibold" onClick={() => setScreen({ name: 'home' })}>Календарь звонков</button>
          <nav className="flex gap-2">
            <Button variant={isOwner ? 'ghost' : 'secondary'} onClick={() => setScreen({ name: 'types' })}>Записаться</Button>
            <Button variant={isOwner ? 'secondary' : 'ghost'} onClick={() => setScreen({ name: 'owner', tab: 'upcoming' })}>Для владельца</Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {screen.name === 'home' && <Home go={setScreen} />}
        {screen.name === 'types' && <TypesStep go={setScreen} />}
        {screen.name === 'calendar' && <CalendarStep screen={screen} go={setScreen} />}
        {screen.name === 'confirm' && <ConfirmStep type={screen.type} slot={screen.slot} go={setScreen} />}
        {screen.name === 'done' && <DoneStep booking={screen.booking} go={setScreen} />}
        {screen.name === 'owner' && <Owner tab={screen.tab} highlight={screen.highlight} go={setScreen} />}
        {screen.name === 'newType' && <NewType go={setScreen} />}
      </main>
    </div>
  )
}

type Go = (s: Screen) => void

function Home({ go }: { go: Go }) {
  const { eventTypes, bookings } = useStore()
  // «Что доступно прямо сейчас» из демо: ближайший свободный слот каждого типа
  const nearest = eventTypes.map((t) => {
    for (const d of windowDays()) {
      const s = daySlots(t, d, bookings).find((x) => x.free)
      if (s) return { t, s }
    }
    return { t, s: undefined }
  })
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <h1 className="font-heading text-3xl font-semibold">Запишитесь на звонок</h1>
          <CardDescription className="text-base">Владелец календаря — {OWNER_NAME}. Выберите тип встречи и удобное время в ближайшие 14 дней.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={() => go({ name: 'types' })}>Записаться</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Что доступно прямо сейчас</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {nearest.length === 0 && <p className="text-muted-foreground">Пока нет ни одного типа встречи.</p>}
          {nearest.map(({ t, s }) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-2">
              <span>{t.title} · {t.duration} мин</span>
              {s ? (
                <button className="text-primary hover:underline" onClick={() => go({ name: 'calendar', type: t, day: s.start, slot: s })}>
                  {dateTime(s.start)}
                </button>
              ) : <span className="text-muted-foreground">нет мест</span>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function TypesStep({ go }: { go: Go }) {
  const { eventTypes } = useStore()
  return (
    <div className="flex flex-col gap-4">
      <Steps current={1} />
      <h1 className="font-heading text-2xl font-semibold">Выберите тип встречи</h1>
      {eventTypes.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Типов встреч пока нет. Загляните позже.</CardContent></Card>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {eventTypes.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.duration} мин</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <p className="text-muted-foreground">{t.description || '—'}</p>
              <Button onClick={() => go({ name: 'calendar', type: t })}>Выбрать время</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Steps({ current }: { current: number }) {
  const steps = ['Тип встречи', 'Дата и время', 'Ваши данные']
  return (
    <ol className="flex gap-4 text-sm">
      {steps.map((s, i) => (
        <li key={s} className={i + 1 === current ? 'font-semibold text-primary' : 'text-muted-foreground'}>{i + 1}. {s}</li>
      ))}
    </ol>
  )
}

function CalendarStep({ screen, go }: { screen: Extract<Screen, { name: 'calendar' }>; go: Go }) {
  const { bookings } = useStore()
  const { type, day, slot, error } = screen
  const days = windowDays()
  const [month, setMonth] = useState(() => new Date((day ?? days[0]).getFullYear(), (day ?? days[0]).getMonth(), 1))
  const slots = day ? daySlots(type, day, bookings) : []
  const set = (patch: Partial<typeof screen>) => go({ ...screen, error: undefined, ...patch })

  // Сетка месяца, неделя с понедельника
  const first = new Date(month)
  const lead = (first.getDay() + 6) % 7
  const cells: (Date | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d))
  const inWindow = (d: Date) => days.some((w) => sameDay(w, d))
  const monthName = cap(month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }))

  return (
    <div className="flex flex-col gap-4">
      <Steps current={2} />
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Информация</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <p className="text-muted-foreground">{OWNER_NAME}</p>
            <p className="font-medium">{type.title}</p>
            <p>{type.duration} мин</p>
            <p className="text-muted-foreground">{type.description}</p>
            <hr />
            <p>Дата: {day ? dayLong(day) : <span className="text-muted-foreground">не выбрана</span>}</p>
            <p>Время: {slot ? range(slot.start, slot.end) : <span className="text-muted-foreground">не выбрано</span>}</p>
            <Button variant="ghost" onClick={() => go({ name: 'types' })}>← Другой тип</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="grid-cols-[auto_1fr_auto] items-center">
            <Button size="icon-sm" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</Button>
            <CardTitle className="text-center">{monthName}</CardTitle>
            <Button size="icon-sm" variant="outline" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => <div key={d} className="text-muted-foreground">{d}</div>)}
              {cells.map((d, i) => {
                if (!d) return <div key={i} />
                const ok = inWindow(d)
                const n = ok ? freeCount(type, d, bookings) : 0
                const selected = day && sameDay(d, day)
                return (
                  <button
                    key={i}
                    disabled={!ok}
                    onClick={() => set({ day: d, slot: undefined })}
                    className={`flex flex-col items-center rounded-md p-1 ${selected ? 'bg-primary text-primary-foreground' : ok ? 'hover:bg-accent' : 'text-muted-foreground/40'}`}
                  >
                    <span className="text-sm">{d.getDate()}</span>
                    {ok && <span className={`text-[10px] ${n === 0 && !selected ? 'text-destructive' : ''}`}>{n} св.</span>}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Статус слотов</CardTitle></CardHeader>
          <CardContent className="flex max-h-96 flex-col gap-1 overflow-auto">
            {!day && <p className="text-sm text-muted-foreground">Выберите дату в календаре</p>}
            {day && slots.length === 0 && <p className="text-sm text-muted-foreground">На этот день слотов не осталось</p>}
            {day && slots.length > 0 && slots.every((s) => !s.free) && <p className="text-sm text-muted-foreground">Все слоты заняты — выберите другой день</p>}
            {slots.map((s) => {
              const selected = slot && s.start.getTime() === slot.start.getTime()
              return (
                <button
                  key={s.start.toISOString()}
                  disabled={!s.free}
                  onClick={() => set({ slot: s })}
                  className={`flex justify-between rounded-md border px-2 py-1 text-sm ${selected ? 'border-primary bg-accent' : ''} ${s.free ? 'hover:bg-accent' : 'opacity-50'}`}
                >
                  <span>{range(s.start, s.end)}</span>
                  <span className={s.free ? 'text-primary' : 'text-muted-foreground'}>{s.free ? 'Свободно' : 'Занято'}</span>
                </button>
              )
            })}
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <Button size="lg" disabled={!slot} onClick={() => slot && go({ name: 'confirm', type, slot })}>Продолжить</Button>
      </div>
    </div>
  )
}

function ConfirmStep({ type, slot, go }: { type: EventType; slot: Slot; go: Go }) {
  const { createBooking } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const submit = () => {
    const r = createBooking({ eventTypeId: type.id, start: slot.start, guestName: name, guestEmail: email })
    if (r.ok) go({ name: 'done', booking: r.booking })
    else if (r.reason === 'invalid') setErrors(r.errors)
    else go({ name: 'calendar', type, day: slot.start, error: 'Пока вы заполняли форму, этот слот заняли. Выберите другое время.' })
  }
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Steps current={3} />
      <Card>
        <CardHeader>
          <CardTitle>Подтверждение записи</CardTitle>
          <CardDescription>{type.title} · {dayLong(slot.start)}, {range(slot.start, slot.end)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Field label="Имя" value={name} onChange={setName} error={errors.guestName} />
          <Field label="Email" type="email" value={email} onChange={setEmail} error={errors.guestEmail} />
          <div className="flex gap-2">
            <Button onClick={submit}>Подтвердить запись</Button>
            <Button variant="outline" onClick={() => go({ name: 'calendar', type, day: slot.start, slot })}>Изменить</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DoneStep({ booking, go }: { booking: Booking; go: Go }) {
  const { typeById } = useStore()
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardHeader>
        <h1 className="font-heading text-2xl font-semibold">Бронь подтверждена. До встречи!</h1>
        <CardDescription className="text-base">
          {typeById(booking.eventTypeId)?.title} · {dayLong(booking.start)}, {range(booking.start, booking.end)}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>{booking.guestName}, {booking.guestEmail}</p>
        <Button onClick={() => go({ name: 'types' })}>Забронировать ещё</Button>
      </CardContent>
    </Card>
  )
}

function Owner({ tab, highlight, go }: { tab: 'upcoming' | 'types'; highlight?: string; go: Go }) {
  const { bookings, eventTypes, typeById } = useStore()
  const current = currentBooking(bookings)
  const upcoming = upcomingBookings(bookings)
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-semibold">Кабинет владельца · {OWNER_NAME}</h1>
      <div className="flex gap-2 border-b">
        {(['upcoming', 'types'] as const).map((t) => (
          <button key={t} onClick={() => go({ name: 'owner', tab: t })} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t ? 'border-primary font-medium' : 'border-transparent text-muted-foreground'}`}>
            {t === 'upcoming' ? `Предстоящие (${upcoming.length})` : `Типы событий (${eventTypes.length})`}
          </button>
        ))}
      </div>
      {tab === 'upcoming' && (
        <>
          {current && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardDescription className="font-semibold text-primary">● Сейчас идёт</CardDescription>
                <CardTitle>{current.guestName} · {typeById(current.eventTypeId)?.title}</CardTitle>
                <CardDescription>{range(current.start, current.end)} · {current.guestEmail}</CardDescription>
              </CardHeader>
            </Card>
          )}
          {upcoming.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Предстоящих встреч нет. Поделитесь ссылкой на запись с гостями.</CardContent></Card>}
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((b) => (
              <Card key={b.id} size="sm">
                <CardHeader>
                  <CardTitle>{b.guestName}</CardTitle>
                  <CardDescription>{b.guestEmail}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{typeById(b.eventTypeId)?.title} · {dayLong(b.start)}, {range(b.start, b.end)}</p>
                  <p className="text-xs text-muted-foreground">Создано {dateTime(b.createdAt)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      {tab === 'types' && (
        <>
          <div><Button onClick={() => go({ name: 'newType' })}>+ Создать тип события</Button></div>
          {eventTypes.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Типов событий ещё нет — гости не смогут записаться, пока вы не создадите хотя бы один.</CardContent></Card>}
          {eventTypes.length > 0 && (
            <table className="w-full overflow-hidden rounded-xl bg-card text-sm ring-1 ring-foreground/10">
              <thead className="bg-muted text-left"><tr><th className="p-2">Название</th><th className="p-2">Описание</th><th className="p-2">Длительность</th></tr></thead>
              <tbody>
                {eventTypes.map((t) => (
                  <tr key={t.id} className={`border-t ${t.id === highlight ? 'bg-accent' : ''}`}>
                    <td className="p-2 font-medium">{t.title}</td>
                    <td className="p-2 text-muted-foreground">{t.description || '—'}</td>
                    <td className="p-2">{t.duration} мин</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

function NewType({ go }: { go: Go }) {
  const { createEventType } = useStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('30')
  const [errors, setErrors] = useState<FieldErrors>({})
  const submit = () => {
    const r = createEventType({ title, description, duration })
    if (r.ok) go({ name: 'owner', tab: 'types', highlight: r.eventType.id })
    else setErrors(r.errors)
  }
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader><CardTitle>Новый тип события</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Field label="Название" value={title} onChange={setTitle} error={errors.title} />
        <Field label="Описание (необязательно)" value={description} onChange={setDescription} multiline />
        <Field label="Длительность, мин (кратно 15)" type="number" value={duration} onChange={setDuration} error={errors.duration} />
        <div className="flex gap-2">
          <Button onClick={submit}>Создать</Button>
          <Button variant="outline" onClick={() => go({ name: 'owner', tab: 'types' })}>Отмена</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default VariantA
