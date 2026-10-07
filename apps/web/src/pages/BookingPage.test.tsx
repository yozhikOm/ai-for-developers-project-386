import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { BookingWindowDay, SlotStatus } from '@/api/generated'
import { renderApp, stubApi } from '@/testing.tsx'

afterEach(() => {
  vi.unstubAllGlobals()
})

const owner = { name: 'Анна Смирнова', timezone: 'Europe/Moscow' }

const eventType = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Встреча 30 минут',
  description: 'Обсудим задачу и следующие шаги',
  durationMinutes: 30,
  createdAt: '2026-10-01T09:00:00.000Z',
}

// Ответ listSlots: 14 дней с первого, выходные — нерабочие без слотов.
// У рабочего дня по умолчанию два свободных слота, statusesByDate задаёт статусы слотов дня
function bookingWindow(first: string, statusesByDate: Record<string, SlotStatus[]> = {}): BookingWindowDay[] {
  return Array.from({ length: 14 }, (_, offset) => {
    const start = new Date(`${first}T00:00:00.000Z`)
    start.setUTCDate(start.getUTCDate() + offset)
    const date = start.toISOString().slice(0, 10)
    const weekday = start.getUTCDay()
    if (weekday === 0 || weekday === 6) return { date, isWorkingDay: false, slots: [] }

    const statuses = statusesByDate[date] ?? ['free', 'free']
    return {
      date,
      isWorkingDay: true,
      // Время слотов условное (с 06:00 UTC с шагом 15 минут): экран пока показывает
      // только счётчики, а они считаются по статусам
      slots: statuses.map((status, index) => ({
        start: new Date(Date.parse(`${date}T06:00:00.000Z`) + index * 15 * 60_000).toISOString(),
        end: new Date(Date.parse(`${date}T06:30:00.000Z`) + index * 15 * 60_000).toISOString(),
        status,
      })),
    }
  })
}

// API для экрана выбора времени и публичной страницы (куда ведут ссылки возврата)
function stubBookingApi({
  ownerData = owner,
  days = bookingWindow('2026-10-06'),
}: { ownerData?: typeof owner; days?: BookingWindowDay[] } = {}) {
  return stubApi({
    'GET /api/owner': [200, ownerData],
    'GET /api/event-types': [200, [eventType]],
    [`GET /api/event-types/${eventType.id}`]: [200, eventType],
    [`GET /api/event-types/${eventType.id}/slots`]: [200, days],
  })
}

async function openBookingPage() {
  renderApp(`/booking/${eventType.id}`)
  return screen.findByRole('region', { name: 'Календарь' })
}

// Кнопка дня календаря по полной дате, например «среда, 7 октября»
function dayButton(label: string) {
  return screen.getByRole('button', { name: new RegExp(`^${label}`) })
}

describe('экран выбора времени', () => {
  it('открывается по прямой ссылке: шаги и «Информация» с Owner, типом, длительностью и описанием', async () => {
    const fetchMock = stubBookingApi()

    await openBookingPage()

    const steps = screen.getByRole('list', { name: 'Шаги записи' })
    expect(within(steps).getAllByRole('listitem').map((step) => step.textContent)).toEqual([
      '1. Тип встречи',
      '2. Дата и время',
      '3. Ваши данные',
    ])
    expect(within(steps).getByText('2. Дата и время')).toHaveAttribute('aria-current', 'step')

    const info = screen.getByRole('region', { name: 'Информация' })
    expect(info).toHaveTextContent('Анна Смирнова')
    expect(info).toHaveTextContent('Встреча 30 минут')
    expect(info).toHaveTextContent('30 мин')
    expect(info).toHaveTextContent('Обсудим задачу и следующие шаги')

    const requested = fetchMock.mock.calls.map(([request]) => new URL(request.url).pathname)
    expect(requested).toEqual(
      expect.arrayContaining([`/api/event-types/${eventType.id}`, `/api/event-types/${eventType.id}/slots`]),
    )
  })

  it('«← Другой тип» ведёт к списку типов', async () => {
    stubBookingApi()
    await openBookingPage()

    await userEvent.click(screen.getByRole('link', { name: '← Другой тип' }))

    expect(await screen.findByRole('link', { name: /Встреча 30 минут/ })).toHaveAttribute(
      'href',
      `/booking/${eventType.id}`,
    )
  })

  it('для несуществующего типа показывает «Тип больше недоступен» с возвратом к списку типов', async () => {
    const notFound = [404, { code: 'EVENT_TYPE_NOT_FOUND', message: 'EventType не найден' }] as const
    stubApi({
      'GET /api/owner': [200, owner],
      'GET /api/event-types': [200, [eventType]],
      [`GET /api/event-types/${eventType.id}`]: [...notFound],
      [`GET /api/event-types/${eventType.id}/slots`]: [...notFound],
    })
    renderApp(`/booking/${eventType.id}`)

    expect(await screen.findByRole('heading', { name: 'Тип больше недоступен' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Календарь' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'К списку типов' }))

    expect(await screen.findByRole('link', { name: /Встреча 30 минут/ })).toBeInTheDocument()
  })

  it('сообщает об ошибке, если API не ответил', async () => {
    stubApi({
      'GET /api/owner': [200, owner],
      [`GET /api/event-types/${eventType.id}`]: [200, eventType],
      [`GET /api/event-types/${eventType.id}/slots`]: [500, { code: 'INTERNAL_ERROR', message: 'Ошибка' }],
    })
    renderApp(`/booking/${eventType.id}`)

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить страницу')
  })
})

describe('календарь BookingWindow', () => {
  it('дни вне окна и выходные неактивны и без счётчика', async () => {
    // Окно — со вторника 6 по понедельник 19 октября
    stubBookingApi()
    await openBookingPage()

    expect(screen.getByRole('heading', { name: 'Октябрь 2026' })).toBeInTheDocument()
    for (const label of [
      'понедельник, 5 октября', // до окна
      'суббота, 10 октября', // выходной в окне
      'воскресенье, 18 октября', // выходной в окне
      'вторник, 20 октября', // после окна
    ]) {
      expect(dayButton(label)).toBeDisabled()
      expect(dayButton(label)).not.toHaveTextContent('св.')
    }
    for (const label of ['вторник, 6 октября', 'пятница, 9 октября', 'понедельник, 19 октября']) {
      expect(dayButton(label)).toBeEnabled()
      expect(dayButton(label)).toHaveTextContent('2 св.')
    }
  })

  it('«N св.» и «0 св.» считаются по статусам слотов из ответа', async () => {
    stubBookingApi({
      days: bookingWindow('2026-10-06', {
        // Сегодня вечером: рабочий день без оставшихся слотов
        '2026-10-06': [],
        '2026-10-07': ['free', 'taken', 'free', 'taken', 'free'],
        '2026-10-08': ['taken', 'taken'],
      }),
    })
    await openBookingPage()

    expect(dayButton('вторник, 6 октября')).toHaveTextContent('0 св.')
    expect(dayButton('среда, 7 октября')).toHaveTextContent('3 св.')
    expect(dayButton('четверг, 8 октября')).toHaveTextContent('0 св.')
    expect(dayButton('четверг, 8 октября')).toBeEnabled()
  })

  it('окно на стыке месяцев листается стрелками', async () => {
    // Окно — с понедельника 26 октября по воскресенье 8 ноября
    stubBookingApi({ days: bookingWindow('2026-10-26') })
    await openBookingPage()
    const previous = screen.getByRole('button', { name: 'Предыдущий месяц' })
    const next = screen.getByRole('button', { name: 'Следующий месяц' })

    expect(screen.getByRole('heading', { name: 'Октябрь 2026' })).toBeInTheDocument()
    expect(previous).toBeDisabled()
    expect(dayButton('пятница, 30 октября')).toHaveTextContent('2 св.')
    expect(screen.queryByRole('button', { name: /ноября/ })).not.toBeInTheDocument()

    await userEvent.click(next)

    expect(screen.getByRole('heading', { name: 'Ноябрь 2026' })).toBeInTheDocument()
    expect(next).toBeDisabled()
    expect(dayButton('понедельник, 2 ноября')).toHaveTextContent('2 св.')
    expect(dayButton('суббота, 7 ноября')).toBeDisabled()
    expect(dayButton('понедельник, 9 ноября')).toBeDisabled()
    expect(dayButton('понедельник, 9 ноября')).not.toHaveTextContent('св.')

    await userEvent.click(previous)

    expect(screen.getByRole('heading', { name: 'Октябрь 2026' })).toBeInTheDocument()
  })

  it('подпись пояса — по поясу Owner', async () => {
    stubBookingApi()
    await openBookingPage()

    expect(screen.getByText('Время указано по Москве (UTC+3)')).toBeInTheDocument()
  })

  it('дни и подпись пояса — в поясе Owner независимо от пояса jsdom', async () => {
    // Пояс тестов задан в vite.config.ts и лежит западнее UTC: наивный разбор
    // даты «2026-10-07» через new Date() показал бы 6 октября
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Pacific/Honolulu')
    stubBookingApi({
      ownerData: { ...owner, timezone: 'Asia/Yekaterinburg' },
      days: bookingWindow('2026-10-07', { '2026-10-07': ['free', 'free', 'free'] }),
    })
    await openBookingPage()

    expect(screen.getByText('Время указано по Екатеринбургу (UTC+5)')).toBeInTheDocument()
    expect(dayButton('среда, 7 октября')).toHaveTextContent('3 св.')
    expect(dayButton('вторник, 6 октября')).toBeDisabled()
  })
})
