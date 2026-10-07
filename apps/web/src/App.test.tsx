import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

// Подменяет глобальный fetch: ответы API задаются как «путь → [статус, тело]».
// Запросы при этом идут через настоящий сгенерированный SDK.
function stubApi(routes: Record<string, [number, unknown]>) {
  const fetchMock = vi.fn(async (request: Request) => {
    const { pathname } = new URL(request.url)
    const [status, body] = routes[`${request.method} ${pathname}`] ?? [
      404,
      { code: 'NOT_FOUND', message: 'нет такого маршрута' },
    ]
    return Response.json(body, { status })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const owner = { name: 'Анна Смирнова', timezone: 'Europe/Moscow' }

const eventTypeWithDescription = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Знакомство',
  description: 'Короткий созвон, чтобы понять задачу',
  durationMinutes: 15,
  createdAt: '2026-10-01T09:00:00.000Z',
}

// Тип без описания: поля description в ответе нет вовсе
const eventTypeWithoutDescription = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Разбор проекта',
  durationMinutes: 60,
  createdAt: '2026-10-02T09:00:00.000Z',
}

describe('публичная страница Owner', () => {
  it('показывает имя Owner и EventType в порядке из API: название, описание и длительность', async () => {
    const fetchMock = stubApi({
      'GET /api/owner': [200, owner],
      'GET /api/event-types': [200, [eventTypeWithDescription, eventTypeWithoutDescription]],
    })

    renderApp('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Анна Смирнова' })).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByRole('heading', { name: 'Знакомство' })).toBeInTheDocument()
    expect(items[0]).toHaveTextContent('Короткий созвон, чтобы понять задачу')
    expect(items[0]).toHaveTextContent('15 мин')
    expect(within(items[1]).getByRole('heading', { name: 'Разбор проекта' })).toBeInTheDocument()
    expect(items[1]).toHaveTextContent('60 мин')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('у EventType без описания нет пустого блока', async () => {
    stubApi({
      'GET /api/owner': [200, owner],
      'GET /api/event-types': [200, [eventTypeWithoutDescription]],
    })

    renderApp('/')

    const item = await screen.findByRole('listitem')
    const emptyElements = Array.from(item.querySelectorAll('*')).filter(
      (element) => element instanceof HTMLElement && element.children.length === 0 && !element.textContent?.trim(),
    )
    expect(emptyElements).toEqual([])
  })

  it('без EventType сообщает, что форматов звонка сейчас нет', async () => {
    stubApi({
      'GET /api/owner': [200, owner],
      'GET /api/event-types': [200, []],
    })

    renderApp('/')

    expect(await screen.findByText('Сейчас нет доступных форматов звонка')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('по клику на EventType ведёт к выбору времени этого типа', async () => {
    stubApi({
      'GET /api/owner': [200, owner],
      'GET /api/event-types': [200, [eventTypeWithDescription, eventTypeWithoutDescription]],
    })
    renderApp('/')

    const link = await screen.findByRole('link', { name: /Разбор проекта/ })
    expect(link).toHaveAttribute('href', `/booking/${eventTypeWithoutDescription.id}`)

    await userEvent.click(link)

    expect(await screen.findByRole('heading', { name: 'Запись на звонок' })).toBeInTheDocument()
  })

  it.each([
    ['данные Owner', 'GET /api/owner'],
    ['список EventType', 'GET /api/event-types'],
  ])('сообщает об ошибке, если API не ответил: %s', async (_title, failedRoute) => {
    stubApi({
      'GET /api/owner': [200, owner],
      'GET /api/event-types': [200, [eventTypeWithDescription]],
      [failedRoute]: [500, { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' }],
    })

    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить страницу')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
