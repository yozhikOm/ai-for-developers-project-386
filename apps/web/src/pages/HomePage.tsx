import { Link } from 'react-router-dom'

// Главная страница: рассказывает про сервис и ведёт на страницу записи.
function HomePage() {
  return (
    <main>
      <h1>Календарь звонков</h1>
      <p>Забронируйте звонок в удобное время — без переписки и согласований</p>
      <Link to="/booking">Забронировать звонок</Link>
    </main>
  )
}

export default HomePage
