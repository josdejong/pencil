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
 * @typedef {Object} DrawingAreaConfig
 * @property {HTMLDivElement} target
 * @property {string} [color = "black"]
 * @property {string} [activeColor = "#$f31717"]
 * @property {number} [lineWidth = 3]
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
