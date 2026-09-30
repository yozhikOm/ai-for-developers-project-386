import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import HomePage from './HomePage.tsx'

describe('HomePage', () => {
  it('рендерит заголовок и ссылку на страницу записи', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Календарь звонков' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Забронировать звонок' })).toHaveAttribute(
      'href',
      '/booking',
    )
  })
})
