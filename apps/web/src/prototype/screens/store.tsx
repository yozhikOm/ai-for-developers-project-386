/* eslint-disable react-refresh/only-export-components */
// ПРОТОТИП, выбросить. In-memory хранилище для прототипа экранов (тикет
// «Экраны и сценарии гостя и владельца»). Бэкенда нет, данные живут до перезагрузки.
//
// Правила слотов здесь — ДОПУЩЕНИЕ прототипа, а не решение: рабочие часы
// 09:00–18:00 (как в демо), шаг сетки = длительность типа события, окно —
// 14 дней с сегодняшнего, прошедшие слоты сегодняшнего дня скрыты. Настоящие
// правила решает тикет «Правила вычисления слотов».
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type EventType = {
  id: string
  title: string
  description: string
  duration: number
}

export type Booking = {
  id: string
  eventTypeId: string
  start: Date
  end: Date
  guestName: string
  guestEmail: string
  createdAt: Date
}

export type Slot = { start: Date; end: Date; free: boolean }

export type Preset = 'normal' | 'empty' | 'busy'

export const OWNER_NAME = 'Мария Иванова'
const DAY_START_HOUR = 9
const DAY_END_HOUR = 18
const WINDOW_DAYS = 14

let seq = 100
const nextId = () => String(++seq)

function atTime(dayOffset: number, hour: number, minute = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}

function addMinutes(d: Date, m: number): Date {
  return new Date(d.getTime() + m * 60_000)
}

const seedTypes: EventType[] = [
  { id: '1', title: 'Знакомство', description: 'Короткий созвон, чтобы понять задачу', duration: 15 },
  { id: '2', title: 'Консультация', description: 'Разбор вопроса с конкретными рекомендациями', duration: 30 },
  { id: '3', title: 'Разбор проекта', description: '', duration: 60 },
]

function seedBookings(preset: Preset): Booking[] {
  if (preset === 'empty') return []
  // Текущая бронь: началась 10 минут назад — чтобы был виден блок «Сейчас идёт»
  const now = new Date()
  const curStart = addMinutes(now, -10)
  curStart.setSeconds(0, 0)
  const base: Booking[] = [
    mk('2', curStart, 30, 'Олег Петров', 'oleg@example.com', -2),
    mk('1', atTime(1, 10), 15, 'Ирина Ким', 'irina@example.com', -1),
    mk('2', atTime(1, 14), 30, 'Сергей Лаптев', 'sergey@example.com', -1),
    mk('3', atTime(3, 11), 60, 'Анна Белова', 'anna@example.com', 0),
    mk('2', atTime(6, 9, 30), 30, 'Пётр Соколов', 'petr@example.com', 0),
  ]
  if (preset === 'busy') {
    // Завтра занят полностью: одна длинная бронь на весь рабочий день
    base.push(mk('3', atTime(2, DAY_START_HOUR), (DAY_END_HOUR - DAY_START_HOUR) * 60, 'Блок «Офсайт»', 'team@example.com', -3))
  }
  return base
}

function mk(eventTypeId: string, start: Date, minutes: number, guestName: string, guestEmail: string, createdDayOffset: number): Booking {
  return {
    id: nextId(),
    eventTypeId,
    start,
    end: addMinutes(start, minutes),
    guestName,
    guestEmail,
    createdAt: atTime(createdDayOffset, 8, 12),
  }
}

// --- вычисление слотов (допущение прототипа) ---

export function windowDays(): Date[] {
  return Array.from({ length: WINDOW_DAYS }, (_, i) => atTime(i, 0))
}

export function daySlots(type: EventType, day: Date, bookings: Booking[]): Slot[] {
  const now = new Date()
  const slots: Slot[] = []
  const start = new Date(day)
  start.setHours(DAY_START_HOUR, 0, 0, 0)
  const dayEnd = new Date(day)
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0)
  for (let s = start; addMinutes(s, type.duration) <= dayEnd; s = addMinutes(s, type.duration)) {
    const e = addMinutes(s, type.duration)
    if (s <= now) continue
    // Правило занятости: пересечение с любой бронью любого типа события
    const free = !bookings.some((b) => b.start < e && s < b.end)
    slots.push({ start: s, end: e, free })
  }
  return slots
}

export function freeCount(type: EventType, day: Date, bookings: Booking[]): number {
  return daySlots(type, day, bookings).filter((s) => s.free).length
}

// --- форматирование ---

const fmtTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const fmtDay = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
const fmtDayLong = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtDateTime = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export const time = (d: Date) => fmtTime.format(d)
export const range = (a: Date, b: Date) => `${time(a)}–${time(b)}`
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const dayShort = (d: Date) => cap(fmtDay.format(d))
export const dayLong = (d: Date) => cap(fmtDayLong.format(d))
export const dateTime = (d: Date) => fmtDateTime.format(d)
export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

// --- валидация (как в решении «Сущности домена и их связи») ---

export type BookingInput = { eventTypeId: string; start: Date; guestName: string; guestEmail: string }
export type FieldErrors = Partial<Record<string, string>>

export function validateBooking(input: BookingInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.guestName.trim()) errors.guestName = 'Укажите имя'
  if (!input.guestEmail.trim()) errors.guestEmail = 'Укажите email'
  else if (!/^\S+@\S+\.\S+$/.test(input.guestEmail)) errors.guestEmail = 'Неверный формат email'
  return errors
}

export type EventTypeInput = { title: string; description: string; duration: string }

export function validateEventType(input: EventTypeInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.title.trim()) errors.title = 'Укажите название'
  const n = Number(input.duration)
  if (!input.duration) errors.duration = 'Укажите длительность'
  else if (!Number.isInteger(n) || n <= 0 || n % 15 !== 0) errors.duration = 'Длительность — положительное число минут, кратное 15'
  return errors
}

// --- хранилище ---

type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; reason: 'slot_taken' } | { ok: false; reason: 'invalid'; errors: FieldErrors }

type Store = {
  eventTypes: EventType[]
  bookings: Booking[]
  preset: Preset
  setPreset: (p: Preset) => void
  // Переключатель прототипа: следующая бронь «проиграет гонку» — слот займёт кто-то другой
  simulateConflict: boolean
  setSimulateConflict: (v: boolean) => void
  createBooking: (input: BookingInput) => CreateBookingResult
  createEventType: (input: EventTypeInput) => { ok: true; eventType: EventType } | { ok: false; errors: FieldErrors }
  typeById: (id: string) => EventType | undefined
}

const Ctx = createContext<Store | null>(null)

export function PrototypeStoreProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<Preset>('normal')
  const [eventTypes, setEventTypes] = useState<EventType[]>(seedTypes)
  const [bookings, setBookings] = useState<Booking[]>(() => seedBookings('normal'))
  const [simulateConflict, setSimulateConflict] = useState(false)

  const store = useMemo<Store>(() => {
    const typeById = (id: string) => eventTypes.find((t) => t.id === id)
    return {
      eventTypes,
      bookings,
      preset,
      setPreset: (p) => {
        setPresetState(p)
        setEventTypes(p === 'empty' ? [] : seedTypes)
        setBookings(seedBookings(p))
      },
      simulateConflict,
      setSimulateConflict,
      typeById,
      createBooking: (input) => {
        const errors = validateBooking(input)
        if (Object.keys(errors).length) return { ok: false, reason: 'invalid', errors }
        const type = typeById(input.eventTypeId)!
        const end = addMinutes(input.start, type.duration)
        if (simulateConflict) {
          setSimulateConflict(false)
          setBookings((bs) => [...bs, mk(type.id, input.start, type.duration, 'Другой гость', 'other@example.com', 0)])
          return { ok: false, reason: 'slot_taken' }
        }
        if (bookings.some((b) => b.start < end && input.start < b.end)) return { ok: false, reason: 'slot_taken' }
        const booking: Booking = { id: nextId(), ...input, end, createdAt: new Date() }
        setBookings((bs) => [...bs, booking])
        return { ok: true, booking }
      },
      createEventType: (input) => {
        const errors = validateEventType(input)
        if (Object.keys(errors).length) return { ok: false, errors }
        const eventType: EventType = { id: nextId(), title: input.title.trim(), description: input.description.trim(), duration: Number(input.duration) }
        setEventTypes((ts) => [...ts, eventType])
        return { ok: true, eventType }
      },
    }
  }, [eventTypes, bookings, preset, simulateConflict])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('PrototypeStoreProvider отсутствует')
  return s
}

// Производные состояния Booking (решение «Сущности домена и их связи»)
export function currentBooking(bookings: Booking[]): Booking | undefined {
  const now = new Date()
  return bookings.find((b) => b.start <= now && now < b.end)
}

export function upcomingBookings(bookings: Booking[]): Booking[] {
  const now = new Date()
  return bookings.filter((b) => b.start > now).sort((a, b) => a.start.getTime() - b.start.getTime())
}

// Общий примитив поля ввода — общий только потому, что в проекте нет shadcn Input
export function Field(props: { label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; placeholder?: string; multiline?: boolean }) {
  const cls = `w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 ${props.error ? 'border-destructive' : 'border-input'}`
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{props.label}</span>
      {props.multiline ? (
        <textarea className={cls} rows={3} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
      ) : (
        <input className={cls} type={props.type ?? 'text'} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
      )}
      {props.error && <span className="text-xs text-destructive">{props.error}</span>}
    </label>
  )
}
