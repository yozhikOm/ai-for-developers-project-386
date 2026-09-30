import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

// Главная страница: рассказывает про сервис и ведёт на страницу записи.
function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <h1 className="font-heading text-2xl leading-snug font-semibold">
            Календарь звонков
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
      </Card>
    </main>
  )
}

export default HomePage
