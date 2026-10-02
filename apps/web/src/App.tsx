import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BookingPage from './pages/BookingPage.tsx'
import HomePage from './pages/HomePage.tsx'
// ПРОТОТИП, выбросить: тикет «Экраны и сценарии гостя и владельца»
import ScreensPrototype from './prototype/screens/ScreensPrototype.tsx'

// Корневой компонент: роутинг между главной страницей и страницей записи.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/booking" element={<BookingPage />} />
        {import.meta.env.DEV && <Route path="/prototype/screens" element={<ScreensPrototype />} />}
      </Routes>
    </BrowserRouter>
  )
}

export default App
