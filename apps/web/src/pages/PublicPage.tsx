import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOwner, type Owner } from '@/api/generated'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

type OwnerState = { status: 'loading' } | { status: 'ready'; owner: Owner } | { status: 'error' }

// Публичная страница Owner — первая страница для Guest: к кому он записывается.
// Список EventType добавит следующий тикет.
function PublicPage() {
  const [state, setState] = useState<OwnerState>({ status: 'loading' })

  useEffect(() => {
    // Ответ после ухода со страницы игнорируем
    let cancelled = false
    getOwner().then(({ data }) => {
      if (!cancelled) setState(data ? { status: 'ready', owner: data } : { status: 'error' })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        {state.status === 'loading' && (
          <CardHeader>
            <p role="status" className="text-muted-foreground">Загрузка…</p>
          </CardHeader>
        )}
        {state.status === 'error' && (
          <CardHeader>
            <p role="alert" className="text-destructive">
              Не удалось загрузить страницу. Попробуйте обновить её.
            </p>
          </CardHeader>
        )}
        {state.status === 'ready' && (
          <>
            <CardHeader>
              <CardDescription>Запись на звонок</CardDescription>
              <h1 className="font-heading text-2xl leading-snug font-semibold">
                {state.owner.name}
              </h1>
              <CardDescription className="text-base">
                Забронируйте звонок в удобное время — без переписки и согласований
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/booking" className={buttonVariants({ size: 'lg' })}>
                Забронировать звонок
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </main>
  )
}

export default PublicPage
