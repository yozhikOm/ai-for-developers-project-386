import { Navigate, Route, Routes } from 'react-router-dom'
import BookingPage from './pages/BookingPage.tsx'
import NewEventTypePage from './pages/NewEventTypePage.tsx'
import OwnerEventTypesPage from './pages/OwnerEventTypesPage.tsx'
import PublicPage from './pages/PublicPage.tsx'
// ПРОТОТИП, выбросить: тикет «Экраны и сценарии гостя и владельца»
import ScreensPrototype from './prototype/screens/ScreensPrototype.tsx'

// Корневой компонент: маршруты приложения. Роутер (BrowserRouter) подключает
// main.tsx, чтобы тесты могли рендерить приложение в MemoryRouter на нужном URL.
function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage />} />
      <Route path="/booking/:eventTypeId" element={<BookingPage />} />
      {/* Раздел Owner; пока в нём одна вкладка — «Типы событий» */}
      <Route path="/owner" element={<Navigate to="/owner/event-types" replace />} />
      <Route path="/owner/event-types" element={<OwnerEventTypesPage />} />
      <Route path="/owner/event-types/new" element={<NewEventTypePage />} />
      {import.meta.env.DEV && <Route path="/prototype/screens" element={<ScreensPrototype />} />}
    </Routes>
  )
}

export default App
