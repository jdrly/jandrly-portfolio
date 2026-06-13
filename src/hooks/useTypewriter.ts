import { useEffect, useState } from 'react'

interface UseTypewriterOptions {
    words: Array<string>
    typingSpeed?: number
    deletingSpeed?: number
    pauseDuration?: number
    lastWordPauseDuration?: number
    enabled?: boolean
}

interface UseTypewriterReturn {
    displayText: string
    isDeleting: boolean
    currentWordIndex: number
}

type TypewriterState = UseTypewriterReturn

export function useTypewriter({
    words,
    typingSpeed = 150,
    deletingSpeed = 50,
    pauseDuration = 1500,
    lastWordPauseDuration = 5000,
    enabled = true,
}: UseTypewriterOptions): UseTypewriterReturn {
    const [state, setState] = useState<TypewriterState>(() => ({
        currentWordIndex: 0,
        displayText: words[0] ?? '',
        isDeleting: false,
    }))

    useEffect(() => {
        if (!enabled || words.length === 0) return

        const fullWord = words[state.currentWordIndex] ?? ''
        const speed = state.isDeleting ? deletingSpeed : typingSpeed
        const isLastWord = state.currentWordIndex === words.length - 1
        const pauseTime = isLastWord ? lastWordPauseDuration : pauseDuration

        const delay = !state.isDeleting && state.displayText === fullWord ? pauseTime : speed

        const timeoutId = setTimeout(() => {
            setState((current) => {
                const currentWord = words[current.currentWordIndex] ?? ''

                if (!current.isDeleting && current.displayText === currentWord) {
                    return { ...current, isDeleting: true }
                }

                if (current.isDeleting && current.displayText === '') {
                    return {
                        currentWordIndex: (current.currentWordIndex + 1) % words.length,
                        displayText: '',
                        isDeleting: false,
                    }
                }

                return {
                    ...current,
                    displayText: current.isDeleting
                        ? current.displayText.slice(0, -1)
                        : currentWord.slice(0, current.displayText.length + 1),
                }
            })
        }, delay)

        return () => clearTimeout(timeoutId)
    }, [enabled, state, words, typingSpeed, deletingSpeed, pauseDuration, lastWordPauseDuration])

    return state
}
