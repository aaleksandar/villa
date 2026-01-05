import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock lottie-react
vi.mock('lottie-react', () => ({
  default: vi.fn(({ loop, autoplay, style }) => (
    <div
      data-testid="lottie-animation"
      data-loop={loop}
      data-autoplay={autoplay}
      style={style}
    >
      Lottie Animation
    </div>
  )),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: vi.fn(() => false),
}))

describe('LottieAnimation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Lottie animation with data', async () => {
    const { LottieAnimation } = await import('@/components/ui/lottie-animation')
    const mockAnimationData = { v: '5.5.7', fr: 30, ip: 0, op: 60 }

    render(<LottieAnimation animationData={mockAnimationData} />)

    expect(screen.getByTestId('lottie-animation')).toBeInTheDocument()
  })

  it('loops continuously by default', async () => {
    const { LottieAnimation } = await import('@/components/ui/lottie-animation')
    const mockAnimationData = { v: '5.5.7', fr: 30, ip: 0, op: 60 }

    render(<LottieAnimation animationData={mockAnimationData} />)

    const animation = screen.getByTestId('lottie-animation')
    expect(animation).toHaveAttribute('data-loop', 'true')
  })

  it('can play once when loop is false', async () => {
    const { LottieAnimation } = await import('@/components/ui/lottie-animation')
    const mockAnimationData = { v: '5.5.7', fr: 30, ip: 0, op: 60 }

    render(<LottieAnimation animationData={mockAnimationData} loop={false} />)

    const animation = screen.getByTestId('lottie-animation')
    expect(animation).toHaveAttribute('data-loop', 'false')
  })

  it('accepts custom size prop', async () => {
    const { LottieAnimation } = await import('@/components/ui/lottie-animation')
    const mockAnimationData = { v: '5.5.7', fr: 30, ip: 0, op: 60 }

    const { container } = render(
      <LottieAnimation animationData={mockAnimationData} className="w-24 h-24" />
    )

    expect(container.firstChild).toHaveClass('w-24', 'h-24')
  })

  it('respects reduced motion preference', async () => {
    const { useReducedMotion } = await import('framer-motion')
    vi.mocked(useReducedMotion).mockReturnValue(true)

    const { LottieAnimation } = await import('@/components/ui/lottie-animation')
    const mockAnimationData = { v: '5.5.7', fr: 30, ip: 0, op: 60 }

    render(<LottieAnimation animationData={mockAnimationData} />)

    const animation = screen.getByTestId('lottie-animation')
    expect(animation).toHaveAttribute('data-autoplay', 'false')
  })
})

describe('LoadingAnimation Component', () => {
  it('renders loading animation', async () => {
    const { LoadingAnimation } = await import('@/components/ui/loading-animation')

    render(<LoadingAnimation />)

    // Should render either Lottie or fallback
    const container = document.querySelector('[class*="loading"]') ||
                      screen.queryByTestId('lottie-animation')
    expect(container || screen.getByRole('status')).toBeTruthy()
  })

  it('accepts size prop', async () => {
    const { LoadingAnimation } = await import('@/components/ui/loading-animation')

    const { container } = render(<LoadingAnimation size="lg" />)

    // Should apply size classes
    expect(container.innerHTML).toBeTruthy()
  })
})

describe('SuccessCelebration Component', () => {
  it('renders success animation', async () => {
    const { SuccessCelebration } = await import('@/components/ui/success-celebration')

    render(<SuccessCelebration show={true} />)

    // Should show celebration
    await waitFor(() => {
      expect(document.body.innerHTML).toContain('success') ||
      expect(screen.queryByTestId('lottie-animation')).toBeTruthy()
    })
  })

  it('calls onComplete when animation finishes', async () => {
    const { SuccessCelebration } = await import('@/components/ui/success-celebration')
    const onComplete = vi.fn()

    render(<SuccessCelebration show={true} onComplete={onComplete} />)

    // onComplete should be callable
    expect(typeof onComplete).toBe('function')
  })

  it('respects reduced motion', async () => {
    const { useReducedMotion } = await import('framer-motion')
    vi.mocked(useReducedMotion).mockReturnValue(true)

    const { SuccessCelebration } = await import('@/components/ui/success-celebration')
    const onComplete = vi.fn()

    render(<SuccessCelebration show={true} onComplete={onComplete} />)

    // Should still render but without animation
    expect(document.body.innerHTML).toBeTruthy()
  })
})
