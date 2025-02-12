/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 * @property {number} t
 */

/**
 * @typedef {Point[]} Trace
 */

/**
 * @typedef {Object} TraceRect
 * @property {number} xMin
 * @property {number} xMax
 * @property {number} yMin
 * @property {number} yMax
 */

/**
 * @typedef {Object} DrawingAreaConfig
 * @property {HTMLDivElement} target
 * @property {string} [strokeColor = "black"]
 * @property {number} [strokeWidth = 3]
 * @property {function(): void} [onChange]
 */

/**
 * @typedef {Object} DrawingArea
 * @property {function(): Trace[]} getTraces
 * @property {function(): string} getSVG
 * @property {function(): Promise<string>} getPNG
 * @property {function(): void} clear
 * @property {function(): void} destroy
 */
