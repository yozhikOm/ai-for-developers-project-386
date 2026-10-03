import { Route, Routes } from 'react-router-dom'
import BookingPage from './pages/BookingPage.tsx'
import PublicPage from './pages/PublicPage.tsx'
// ПРОТОТИП, выбросить: тикет «Экраны и сценарии гостя и владельца»
import ScreensPrototype from './prototype/screens/ScreensPrototype.tsx'

// Корневой компонент: маршруты приложения. Роутер (BrowserRouter) подключает
// main.tsx, чтобы тесты могли рендерить приложение в MemoryRouter на нужном URL.
function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/booking" element={<BookingPage />} />
      {import.meta.env.DEV && <Route path="/prototype/screens" element={<ScreensPrototype />} />}
    </Routes>
  )
}

export default App
