import { render, screen } from '@testing-library/react'
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

describe('публичная страница Owner', () => {
  it('показывает имя Owner из API', async () => {
    const fetchMock = stubApi({
      'GET /api/owner': [200, { name: 'Анна Смирнова', timezone: 'Europe/Moscow' }],
    })

    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Анна Смирнова' })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('сообщает об ошибке, если API не ответил данными Owner', async () => {
    stubApi({
      'GET /api/owner': [500, { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' }],
    })

    renderApp('/')

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить страницу')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
