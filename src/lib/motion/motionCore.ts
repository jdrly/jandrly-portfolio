/**
 * The Motion functions the eagerly bundled modules use, for them to load lazily: `import('motion')` would pull in
 * every export of the package (a dynamic namespace import cannot be tree-shaken), this module keeps it to three.
 */
export { animate, cancelFrame, frame } from 'motion'
