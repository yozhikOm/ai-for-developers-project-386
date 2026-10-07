import { useEffect, useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getEventType,
  getOwner,
  listSlots,
  type BookingWindowDay,
  type EventType,
  type Owner,
} from '@/api/generated'
import BookingCalendar from '@/components/BookingCalendar'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type PageState =
  | { status: 'loading' }
  | { status: 'ready'; owner: Owner; eventType: EventType; days: BookingWindowDay[] }
  | { status: 'not-found' }
  | { status: 'error' }

const STEPS = ['Тип встречи', 'Дата и время', 'Ваши данные']

// Экран выбора времени для EventType (/booking/:eventTypeId): шаг «Дата и время».
// Открывается и по прямой ссылке: всё нужное загружает сам по id из URL.
// Колонку «Статус слотов» добавит следующий тикет.
function BookingPage() {
  const { eventTypeId = '' } = useParams()
  const [state, setState] = useState<PageState>({ status: 'loading' })
  const [selectedDate, setSelectedDate] = useState<string>()

  useEffect(() => {
    // Ответ после ухода со страницы игнорируем
    let cancelled = false
    const path = { eventTypeId }
    Promise.all([getOwner(), getEventType({ path }), listSlots({ path })]).then(([owner, eventType, days]) => {
      if (cancelled) return
      if ([eventType.error, days.error].some((error) => error?.code === 'EVENT_TYPE_NOT_FOUND')) {
        setState({ status: 'not-found' })
        return
      }
      setState(
        owner.data && eventType.data && days.data
          ? { status: 'ready', owner: owner.data, eventType: eventType.data, days: days.data }
          : { status: 'error' },
      )
    })
    return () => {
      cancelled = true
    }
  }, [eventTypeId])

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8">
        <h1 className="font-heading text-2xl font-semibold">Запись на звонок</h1>
        {state.status === 'loading' && (
          <p role="status" className="text-muted-foreground">Загрузка…</p>
        )}
        {state.status === 'error' && (
          <p role="alert" className="text-destructive">
            Не удалось загрузить страницу. Попробуйте обновить её.
          </p>
        )}
        {state.status === 'not-found' && <EventTypeNotFound />}
        {state.status === 'ready' && (
          <>
            <Steps current={2} />
            <div className="grid items-start gap-4 md:grid-cols-[1fr_1.4fr]">
              <EventTypeInfo owner={state.owner} eventType={state.eventType} />
              <BookingCalendar
                days={state.days}
                timeZone={state.owner.timezone}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// Индикатор шагов «Тип встречи → Дата и время → Ваши данные»; current — номер с 1
function Steps({ current }: { current: number }) {
  return (
    <ol aria-label="Шаги записи" className="flex flex-wrap gap-4 text-sm">
      {STEPS.map((step, index) => {
        const isCurrent = index + 1 === current
        return (
          <li
            key={step}
            aria-current={isCurrent ? 'step' : undefined}
            className={isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}
          >
            {index + 1}. {step}
          </li>
        )
      })}
    </ol>
  )
}

// Колонка «Информация»: к кому и на какой звонок записывается Guest
function EventTypeInfo({ owner, eventType }: { owner: Owner; eventType: EventType }) {
  const headingId = useId()
  return (
    <Card role="region" aria-labelledby={headingId}>
      <CardHeader>
        <h2 id={headingId} className="font-heading font-medium">
          Информация
        </h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-muted-foreground">{owner.name}</p>
        <p className="font-medium">{eventType.name}</p>
        <p>{eventType.durationMinutes} мин</p>
        {eventType.description && <p className="text-muted-foreground">{eventType.description}</p>}
        <Link to="/" className={cn(buttonVariants({ variant: 'ghost' }), 'self-start')}>
          ← Другой тип
        </Link>
      </CardContent>
    </Card>
  )
}

// EventType из ссылки не существует: возврат к списку типов
function EventTypeNotFound() {
  return (
    <Card className="w-full max-w-md self-center text-center">
      <CardHeader>
        <h2 className="font-heading text-xl font-semibold">Тип больше недоступен</h2>
        <CardDescription>Выберите другой формат звонка из списка</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to="/" className={buttonVariants()}>
          К списку типов
        </Link>
      </CardContent>
    </Card>
  )
}

export default BookingPage
