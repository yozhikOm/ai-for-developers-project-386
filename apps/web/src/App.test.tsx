import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('ведёт с главной страницы на страницу записи по кнопке', async () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Календарь звонков' }),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Забронировать звонок' }))

    expect(
      screen.getByRole('heading', { name: 'Запись на звонок' }),
    ).toBeInTheDocument()
  })
})
