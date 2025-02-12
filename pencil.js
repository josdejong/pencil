const namespaceUri = 'http://www.w3.org/2000/svg'

/**
 * Create a drawing area
 * @param {DrawingAreaConfig} config
 * @returns {DrawingArea}
 */
export function createDrawingArea(config) {
  const {
    target,
    color = 'black',
    activeColor = '#f31717',
    lineWidth = 3,
    onChange = noop
  } = config

  let { width, height } = target.getBoundingClientRect()

  /** @type {Trace[]} */
  let traces = []

  let svgPaths = []

  /** @type {Trace | null} */
  let newTrace = null

  let newSvgPath = null

  const svg = document.createElementNS(namespaceUri, 'svg')
  svg.setAttribute('xmlns', namespaceUri)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))

  const wrapper = document.createElement('div')
  wrapper.className = 'drawing-area'
  wrapper.style.display = 'flex'
  wrapper.style.touchAction = 'none'
  wrapper.style.width = '100%'
  wrapper.style.height = '100%'

  wrapper.addEventListener('pointerdown', handlePointerDown)
  wrapper.addEventListener('pointermove', handlePointerMove)
  wrapper.addEventListener('pointerup', handlePointerUp)

  wrapper.appendChild(svg)
  target.appendChild(wrapper)

  const resizeObserver = new ResizeObserver((_entries) => {
    const rect = target.getBoundingClientRect()
    width = rect.width
    height = rect.height

    svg.setAttribute('width', String(width))
    svg.setAttribute('height', String(height))
  })
  resizeObserver.observe(wrapper)

  /**
   * @param {Trace} trace
   * @param {string} color
   * @return {SVGPathElement}
   */
  function createSvgPath(trace, color) {
    // in case of a dot, we create 2 points
    const path =
      trace.length <= 1 ? toSvgPath([...trace, ...trace], height) : toSvgPath(trace, height)

    const svgPath = document.createElementNS(namespaceUri, 'path')
    svgPath.setAttributeNS(null, 'd', path)
    svgPath.setAttributeNS(null, 'stroke', color)
    svgPath.setAttributeNS(null, 'stroke-linecap', 'round')
    svgPath.setAttributeNS(null, 'fill', 'transparent')
    svgPath.style.strokeWidth = String(lineWidth)

    return svgPath
  }

  function updateSvgPath(svgPath, trace) {
    svgPath.setAttributeNS(null, 'd', toSvgPath(trace, height))
  }

  function updateSvgColor(svgPath, color) {
    svgPath.setAttributeNS(null, 'stroke', color)
  }

  function getPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect()

    return {
      x: event.clientX - rect.x,
      y: height - (event.clientY - rect.y),
      t: Date.now()
    }
  }

  function addPoint(point) {
    if (newTrace) {
      newTrace.push(point)
    }

    if (newSvgPath) {
      updateSvgPath(newSvgPath, newTrace)
    }
  }

  function handlePointerDown(event) {
    event.preventDefault()

    const point = getPoint(event)
    newTrace = [point]
    newSvgPath = createSvgPath(newTrace, activeColor)
    svg.appendChild(newSvgPath)
  }

  function handlePointerMove(event) {
    event.preventDefault()

    if (newTrace) {
      const point = getPoint(event)
      addPoint(point)
    }
  }

  function handlePointerUp(event) {
    event.preventDefault()

    if (newTrace) {
      traces.push(newTrace)
      newTrace = null

      updateSvgColor(newSvgPath, color)
      svgPaths.push(newSvgPath)
      newSvgPath = null

      onChange()
    }
  }

  function clear() {
    traces = []
    svgPaths = []

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }
  }

  return {
    getTraces: () => traces.slice(),
    getSVG: () => svgToDataUrl(svg.outerHTML),
    getPNG: () => svgToPng(svg.outerHTML, width, height),
    clear,
    destroy: () => target.removeChild(wrapper)
  }
}

/**
 * @param {Trace} trace
 * @param {number} height
 * @returns {string}
 */
function toSvgPath(trace, height) {
  const [first, ...rest] = trace

  const firstPoint = `M${first.x},${height - first.y}`
  const restPoints = rest.map(({ x, y }) => `L${x},${height - y}`).join(' ')

  return firstPoint + restPoints
}

function noop() {}

/**
 * Create an SVG data url
 * @param {string} svg
 * @returns {string}
 */
function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Convert an SVG string into a data:image/png;base64 string
 * Source: https://stackoverflow.com/a/78708218/1262753
 * @param {string} svg
 * @param {number} width
 * @param {number} height
 * @return {Promise<string>}
 */
async function svgToPng(svg, width, height) {
  const img = new Image()
  img.src = svgToDataUrl(svg)

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  return canvas.toDataURL('image/png')
}
