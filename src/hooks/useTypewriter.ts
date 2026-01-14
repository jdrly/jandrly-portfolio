import { useState, useEffect } from 'react'

interface UseTypewriterOptions {
    words: string[]
    typingSpeed?: number
    deletingSpeed?: number
    pauseDuration?: number
    lastWordPauseDuration?: number
}

interface UseTypewriterReturn {
    displayText: string
    isDeleting: boolean
    currentWordIndex: number
}

export function useTypewriter({
    words,
    typingSpeed = 150,
    deletingSpeed = 50,
    pauseDuration = 1500,
    lastWordPauseDuration = 5000,
}: UseTypewriterOptions): UseTypewriterReturn {
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [displayText, setDisplayText] = useState(words[0])
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const speed = isDeleting ? deletingSpeed : typingSpeed
        const isLastWord = currentWordIndex === words.length - 1
        const pauseTime = isLastWord ? lastWordPauseDuration : pauseDuration

        let timeoutId: ReturnType<typeof setTimeout>

        function tick() {
            const fullWord = words[currentWordIndex]

            if (!isDeleting && displayText === fullWord) {
                timeoutId = setTimeout(() => {
                    setIsDeleting(true)
                }, pauseTime)
            } else if (isDeleting && displayText === '') {
                setIsDeleting(false)
                setCurrentWordIndex((prev) => (prev + 1) % words.length)
            } else {
                timeoutId = setTimeout(() => {
                    if (isDeleting) {
                        setDisplayText((prev) => prev.slice(0, -1))
                    } else {
                        setDisplayText(fullWord.slice(0, displayText.length + 1))
                    }
                }, speed)
            }
        }

        tick()

        return () => clearTimeout(timeoutId)
    }, [
        displayText,
        isDeleting,
        currentWordIndex,
        words,
        typingSpeed,
        deletingSpeed,
        pauseDuration,
        lastWordPauseDuration,
    ])

    return { displayText, isDeleting, currentWordIndex }
}
