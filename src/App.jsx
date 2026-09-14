import { useCallback, useEffect, useRef, useState } from 'react'
import slides from 'virtual:slides'

const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp']
const SWIPE_THRESHOLD = 50

const clamp = (i) => Math.min(Math.max(i, 0), slides.length - 1)

const indexFromHash = () => {
  const n = parseInt(window.location.hash.slice(1), 10)
  return Number.isNaN(n) ? 0 : clamp(n - 1)
}

export default function App() {
  const [index, setIndex] = useState(indexFromHash)
  const iframeRef = useRef(null)

  const go = useCallback((next) => {
    setIndex((i) => clamp(typeof next === 'function' ? next(i) : next))
  }, [])

  useEffect(() => {
    window.history.replaceState(null, '', `#${index + 1}`)
  }, [index])

  useEffect(() => {
    const onHash = () => go(indexFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [go])

  // Keyboard and swipe handlers go on both the parent window and the slide's
  // document, since the iframe swallows events once it has focus.
  const bindInput = useCallback(
    (target) => {
      let startX = null
      const onKeyDown = (e) => {
        if (NEXT_KEYS.includes(e.key)) go((i) => i + 1)
        else if (PREV_KEYS.includes(e.key)) go((i) => i - 1)
        else if (e.key === 'Home') go(0)
        else if (e.key === 'End') go(slides.length - 1)
        else return
        e.preventDefault()
      }
      const onTouchStart = (e) => (startX = e.touches[0].clientX)
      const onTouchEnd = (e) => {
        if (startX === null) return
        const dx = e.changedTouches[0].clientX - startX
        if (Math.abs(dx) > SWIPE_THRESHOLD) go((i) => i + (dx < 0 ? 1 : -1))
        startX = null
      }
      target.addEventListener('keydown', onKeyDown)
      target.addEventListener('touchstart', onTouchStart, { passive: true })
      target.addEventListener('touchend', onTouchEnd)
      return () => {
        target.removeEventListener('keydown', onKeyDown)
        target.removeEventListener('touchstart', onTouchStart)
        target.removeEventListener('touchend', onTouchEnd)
      }
    },
    [go],
  )

  useEffect(() => bindInput(window), [bindInput])

  const onLoad = () => {
    const doc = iframeRef.current?.contentDocument
    if (doc) bindInput(doc)
  }

  if (slides.length === 0) return <p className="empty">No slides found in slides/</p>

  return (
    <div className="deck">
      <iframe
        ref={iframeRef}
        key={slides[index]}
        className="slide"
        src={`slides/${slides[index]}`}
        title={slides[index]}
        onLoad={onLoad}
      />
      <nav className="controls">
        <button onClick={() => go((i) => i - 1)} disabled={index === 0} aria-label="Previous slide">
          ←
        </button>
        <span>
          {index + 1} / {slides.length}
        </span>
        <button onClick={() => go((i) => i + 1)} disabled={index === slides.length - 1} aria-label="Next slide">
          →
        </button>
      </nav>
      <div className="progress" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
    </div>
  )
}
