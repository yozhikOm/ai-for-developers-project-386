import { Card, CardDescription, CardHeader } from '@/components/ui/card'

// Заглушка страницы записи: полноценное бронирование звонка — отдельный тикет.
function BookingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <h1 className="font-heading text-2xl leading-snug font-semibold">
            Запись на звонок
          </h1>
          <CardDescription className="text-base">
            Скоро здесь можно будет забронировать звонок
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  )
}

export default BookingPage
