import { useEffect, useReducer } from 'react'

interface CodeVariant {
    lines: Array<string>
    label: string
}

interface UseCodeTypewriterOptions {
    variants: Array<CodeVariant>
    typingSpeed?: number
    lineDelay?: number
    startDelay?: number
    variantDelay?: number
    enabled?: boolean
}

interface UseCodeTypewriterReturn {
    displayedLines: Array<string>
    currentLineIndex: number
    currentVariantIndex: number
    currentVariantLabel: string
    isComplete: boolean
    isTyping: boolean
}

interface CodeTypewriterState {
    currentVariantIndex: number
    displayedLines: Array<string>
    currentLineIndex: number
    currentCharIndex: number
    isComplete: boolean
    isTyping: boolean
    hasStarted: boolean
}

type CodeTypewriterAction =
    | { type: 'start' }
    | { type: 'type-character'; line: string }
    | { type: 'finish-line'; line: string; totalLines: number }
    | { type: 'complete' }
    | { type: 'cycle-variant'; variantsLength: number }

const emptyLines: Array<string> = []

function createInitialState(currentVariantIndex = 0): CodeTypewriterState {
    return {
        currentVariantIndex,
        displayedLines: [],
        currentLineIndex: 0,
        currentCharIndex: 0,
        isComplete: false,
        isTyping: false,
        hasStarted: false,
    }
}

function codeTypewriterReducer(state: CodeTypewriterState, action: CodeTypewriterAction): CodeTypewriterState {
    switch (action.type) {
        case 'start':
            return {
                ...state,
                displayedLines: [''],
                hasStarted: true,
                isTyping: true,
            }
        case 'type-character': {
            const partialLine = action.line.slice(0, state.currentCharIndex + 1)
            const displayedLines = state.displayedLines.length === 0 ? [partialLine] : [...state.displayedLines.slice(0, -1), partialLine]

            return {
                ...state,
                displayedLines,
                currentCharIndex: state.currentCharIndex + 1,
            }
        }
        case 'finish-line': {
            const nextLineIndex = state.currentLineIndex + 1
            const nextLines = [...state.displayedLines.slice(0, -1), action.line]

            return {
                ...state,
                displayedLines: nextLineIndex < action.totalLines ? [...nextLines, ''] : nextLines,
                currentLineIndex: nextLineIndex,
                currentCharIndex: 0,
                isComplete: nextLineIndex >= action.totalLines,
                isTyping: nextLineIndex < action.totalLines,
            }
        }
        case 'complete':
            return {
                ...state,
                isComplete: true,
                isTyping: false,
            }
        case 'cycle-variant':
            return createInitialState((state.currentVariantIndex + 1) % action.variantsLength)
    }
}

export function useCodeTypewriter({
    variants,
    typingSpeed = 30,
    lineDelay = 150,
    startDelay = 500,
    variantDelay = 4000,
    enabled = true,
}: UseCodeTypewriterOptions): UseCodeTypewriterReturn {
    const [state, dispatch] = useReducer(codeTypewriterReducer, undefined, () => createInitialState())

    const currentVariant = variants.length > 0 ? variants[state.currentVariantIndex] : undefined
    const lines = currentVariant ? currentVariant.lines : emptyLines

    useEffect(() => {
        if (!enabled || variants.length === 0) return

        if (!state.hasStarted) {
            const startTimer = setTimeout(() => {
                dispatch({ type: 'start' })
            }, startDelay)

            return () => clearTimeout(startTimer)
        }

        if (state.isComplete) {
            const cycleTimer = setTimeout(() => {
                dispatch({ type: 'cycle-variant', variantsLength: variants.length })
            }, variantDelay)

            return () => clearTimeout(cycleTimer)
        }

        const currentLine = lines[state.currentLineIndex]

        if (!currentLine) {
            const lineDelayTimer = setTimeout(() => {
                dispatch({ type: 'complete' })
            }, lineDelay)

            return () => clearTimeout(lineDelayTimer)
        }

        if (state.currentCharIndex >= currentLine.length) {
            const lineDelayTimer = setTimeout(() => {
                dispatch({
                    type: 'finish-line',
                    line: currentLine,
                    totalLines: lines.length,
                })
            }, lineDelay)

            return () => clearTimeout(lineDelayTimer)
        }

        const typingTimer = setTimeout(() => {
            dispatch({ type: 'type-character', line: currentLine })
        }, typingSpeed)

        return () => clearTimeout(typingTimer)
    }, [enabled, state, variants.length, lines, startDelay, variantDelay, typingSpeed, lineDelay])

    return {
        displayedLines: state.displayedLines,
        currentLineIndex: state.currentLineIndex,
        currentVariantIndex: state.currentVariantIndex,
        currentVariantLabel: currentVariant ? currentVariant.label : '',
        isComplete: state.isComplete,
        isTyping: state.isTyping,
    }
}

// Token types for syntax highlighting
export type TokenType = 'keyword' | 'string' | 'comment' | 'function' | 'property' | 'number' | 'operator' | 'punctuation' | 'type' | 'text'

export interface Token {
    type: TokenType
    value: string
}

// Simple tokenizer for TypeScript-like syntax
export function tokenizeLine(line: string): Array<Token> {
    const tokens: Array<Token> = []
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
