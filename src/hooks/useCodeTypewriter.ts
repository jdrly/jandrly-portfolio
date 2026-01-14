import { useState, useEffect, useCallback } from 'react'

interface CodeVariant {
    lines: string[]
    label: string
}

interface UseCodeTypewriterOptions {
    variants: CodeVariant[]
    typingSpeed?: number
    lineDelay?: number
    startDelay?: number
    variantDelay?: number
}

interface UseCodeTypewriterReturn {
    displayedLines: string[]
    currentLineIndex: number
    currentVariantIndex: number
    currentVariantLabel: string
    isComplete: boolean
    isTyping: boolean
}

export function useCodeTypewriter({
    variants,
    typingSpeed = 30,
    lineDelay = 150,
    startDelay = 500,
    variantDelay = 4000,
}: UseCodeTypewriterOptions): UseCodeTypewriterReturn {
    const [currentVariantIndex, setCurrentVariantIndex] = useState(0)
    const [displayedLines, setDisplayedLines] = useState<string[]>([])
    const [currentLineIndex, setCurrentLineIndex] = useState(0)
    const [currentCharIndex, setCurrentCharIndex] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    const currentVariant = variants[currentVariantIndex]
    const lines = currentVariant?.lines ?? []

    const reset = useCallback(() => {
        setDisplayedLines([])
        setCurrentLineIndex(0)
        setCurrentCharIndex(0)
        setIsComplete(false)
        setIsTyping(false)
        setHasStarted(false)
    }, [])

    // Start delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setHasStarted(true)
            setIsTyping(true)
        }, startDelay)

        return () => clearTimeout(timer)
    }, [startDelay, currentVariantIndex])

    // Main typing effect
    useEffect(() => {
        if (!hasStarted || isComplete) return

        const currentLine = lines[currentLineIndex]

        // If we've finished all lines
        if (currentLineIndex >= lines.length) {
            setIsComplete(true)
            setIsTyping(false)
            return
        }

        // If we've finished the current line
        if (currentCharIndex >= currentLine.length) {
            const lineDelayTimer = setTimeout(() => {
                setDisplayedLines((prev) => [...prev.slice(0, -1), currentLine])
                setCurrentLineIndex((prev) => prev + 1)
                setCurrentCharIndex(0)

                // Add empty string for next line if there are more lines
                if (currentLineIndex + 1 < lines.length) {
                    setDisplayedLines((prev) => [...prev, ''])
                }
            }, lineDelay)

            return () => clearTimeout(lineDelayTimer)
        }

        // Type the next character
        const typingTimer = setTimeout(() => {
            const partialLine = currentLine.slice(0, currentCharIndex + 1)

            setDisplayedLines((prev) => {
                if (prev.length === 0 || currentCharIndex === 0) {
                    return [...prev.slice(0, -1), partialLine].filter(
                        (_, i) => i < currentLineIndex || partialLine
                    )
                }
                const newLines = [...prev]
                newLines[newLines.length - 1] = partialLine
                return newLines
            })

            setCurrentCharIndex((prev) => prev + 1)
        }, typingSpeed)

        return () => clearTimeout(typingTimer)
    }, [
        hasStarted,
        isComplete,
        currentLineIndex,
        currentCharIndex,
        lines,
        typingSpeed,
        lineDelay,
    ])

    // Initialize first line
    useEffect(() => {
        if (hasStarted && displayedLines.length === 0) {
            setDisplayedLines([''])
        }
    }, [hasStarted, displayedLines.length])

    // Cycle to next variant when complete
    useEffect(() => {
        if (!isComplete) return

        const cycleTimer = setTimeout(() => {
            const nextIndex = (currentVariantIndex + 1) % variants.length
            setCurrentVariantIndex(nextIndex)
            reset()
            // Trigger restart after reset
            setTimeout(() => {
                setHasStarted(true)
                setIsTyping(true)
            }, startDelay)
        }, variantDelay)

        return () => clearTimeout(cycleTimer)
    }, [isComplete, variantDelay, reset, startDelay, currentVariantIndex, variants.length])

    return {
        displayedLines,
        currentLineIndex,
        currentVariantIndex,
        currentVariantLabel: currentVariant?.label ?? '',
        isComplete,
        isTyping,
    }
}

// Token types for syntax highlighting
export type TokenType =
    | 'keyword'
    | 'string'
    | 'comment'
    | 'function'
    | 'property'
    | 'number'
    | 'operator'
    | 'punctuation'
    | 'type'
    | 'text'

export interface Token {
    type: TokenType
    value: string
}

// Simple tokenizer for TypeScript-like syntax
export function tokenizeLine(line: string): Token[] {
    const tokens: Token[] = []
    let remaining = line

    const patterns: Array<{ type: TokenType; regex: RegExp }> = [
        // Comments (must come first)
        { type: 'comment', regex: /^(\/\/.*|\/\*[\s\S]*?\*\/)/ },
        // Strings
        { type: 'string', regex: /^(['"`])((?:\\.|(?!\1)[^\\])*)\1/ },
        // Keywords
        {
            type: 'keyword',
            regex: /^(async|await|const|let|var|function|return|if|else|for|while|import|export|from|new|try|catch|throw|class|interface|type|extends|implements)\b/,
        },
        // Types (capitalized words often are types)
        { type: 'type', regex: /^(Client|Promise|Record|Array|string|number|boolean|Requirements|MobileSpec|Brand)\b/ },
        // Numbers
        { type: 'number', regex: /^(\d+\.?\d*|\.\d+)/ },
        // Function calls (word followed by parenthesis)
        { type: 'function', regex: /^([a-zA-Z_]\w*)(?=\s*\()/ },
        // Properties (after dot)
        { type: 'property', regex: /^\.([a-zA-Z_]\w*)/ },
        // Operators
        { type: 'operator', regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|^~])/ },
        // Punctuation
        { type: 'punctuation', regex: /^([{}[\](),;:])/ },
        // Regular text/identifiers
        { type: 'text', regex: /^[a-zA-Z_]\w*/ },
        // Whitespace (preserve as text)
        { type: 'text', regex: /^\s+/ },
    ]

    while (remaining.length > 0) {
        let matched = false

        for (const { type, regex } of patterns) {
            const match = remaining.match(regex)
            if (match) {
                // Handle property specially (include the dot)
                if (type === 'property') {
                    tokens.push({ type: 'punctuation', value: '.' })
                    tokens.push({ type, value: match[1] })
                } else {
                    tokens.push({ type, value: match[0] })
                }
                remaining = remaining.slice(match[0].length)
                matched = true
                break
            }
        }

        // If nothing matched, take one character as text
        if (!matched) {
            tokens.push({ type: 'text', value: remaining[0] })
            remaining = remaining.slice(1)
        }
    }

    return tokens
}
