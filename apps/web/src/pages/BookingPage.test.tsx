import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BookingPage from './BookingPage.tsx'

describe('BookingPage', () => {
  it('рендерит заглушку страницы записи', () => {
    render(<BookingPage />)

    expect(
      screen.getByRole('heading', { name: 'Запись на звонок' }),
    ).toBeInTheDocument()
  })
})
