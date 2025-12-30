import React from 'react'
import { render, screen } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { Providers } from '@/components/providers'

// Test component that uses React Query
function TestQueryComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: () => Promise.resolve('test data'),
  })

  if (isLoading) return <div>Loading...</div>
  return <div>Data: {data}</div>
}

describe('Providers', () => {
  it('should render children', () => {
    render(
      <Providers>
        <div>Test Child</div>
      </Providers>
    )
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide QueryClient context', () => {
    render(
      <Providers>
        <TestQueryComponent />
      </Providers>
    )
    // Should not throw when using useQuery
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render multiple children', () => {
    render(
      <Providers>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </Providers>
    )
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  it('should render nested elements', () => {
    render(
      <Providers>
        <div>
          <span>Nested content</span>
        </div>
      </Providers>
    )
    expect(screen.getByText('Nested content')).toBeInTheDocument()
  })
})
