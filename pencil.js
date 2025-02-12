const namespaceUri = 'http://www.w3.org/2000/svg'

/**
 * Create a drawing area
 * @param {DrawingAreaConfig} config
 * @returns {DrawingArea}
 */
export function createDrawingArea(config) {
  const {
    target,
    strokeColor = 'black',
    strokeWidth = 3,
    enableStrikeThrough = true,
    onChange = noop
  } = config

  const clearStrikeThroughDelay = 300 // ms
  const strikeThroughColor = '#f42121'

  if (!target) {
    throw new Error('Required property "target" not provided')
  }

  let { width, height } = target.getBoundingClientRect()

  /** @type {Trace[]} */
  let traces = []

  let svgPaths = []

  let removedSvgPaths = []

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
   * @return {SVGPathElement}
   */
  function createSvgPath(trace) {
    // in case of a dot, we create 2 points
    const path =
      trace.length <= 1 ? toSvgPath([...trace, ...trace], height) : toSvgPath(trace, height)

    const svgPath = document.createElementNS(namespaceUri, 'path')
    svgPath.setAttributeNS(null, 'd', path)
    svgPath.setAttributeNS(null, 'stroke', strokeColor)
    svgPath.setAttributeNS(null, 'stroke-linecap', 'round')
    svgPath.setAttributeNS(null, 'fill', 'transparent')
    svgPath.setAttributeNS(null, 'stroke-width', String(strokeWidth))

    return svgPath
  }

  function updateSvgPath(svgPath, trace) {
    svgPath.setAttributeNS(null, 'd', toSvgPath(trace, height))
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

  function addNewTrace() {
    traces.push(newTrace)
    newTrace = null

    svgPaths.push(newSvgPath)
    newSvgPath = null
  }

  function clearRemovedSvgPaths() {
    for (const svgPath of removedSvgPaths) {
      svg.removeChild(svgPath)
    }

    removedSvgPaths = []
  }

  function removeStrikeThroughPaths(strikeThroughRect) {
    removedSvgPaths.push(newSvgPath)

    newTrace = null
    newSvgPath = null

    for (let i = 0; i < traces.length; i++) {
      const rect = calculateBoundingRect(traces[i])

      if (overlap(rect, strikeThroughRect)) {
        const svgPath = svgPaths[i]
        svgPath.setAttributeNS(null, 'stroke', strikeThroughColor)
        removedSvgPaths.push(svgPath)
        traces.splice(i, 1)
        svgPaths.splice(i, 1)
        i--
      }
    }

    // remove the deleted paths from the rendering after a bit
    setTimeout(clearRemovedSvgPaths, clearStrikeThroughDelay)
  }

  function handlePointerDown(event) {
    event.preventDefault()

    const point = getPoint(event)
    newTrace = [point]
    newSvgPath = createSvgPath(newTrace)
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
      if (enableStrikeThrough && isStrikeThrough(newTrace)) {
        const rect = calculateBoundingRect(newTrace)

        removeStrikeThroughPaths(rect)
      } else {
        addNewTrace()
      }

      onChange()
    }
  }

  function clear() {
    traces = []
    svgPaths = []
    removedSvgPaths = []

    newTrace = null
    newSvgPath = null

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }
  }

  return {
    getTraces: () => traces.slice(),
    getSVG: () => {
      clearRemovedSvgPaths()
      return svgToDataUrl(svg.outerHTML)
    },
    getPNG: () => {
      clearRemovedSvgPaths()
      return svgToPng(svg.outerHTML, width, height)
    },
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

/**
 * Calculate the bounds of a trace
 * @param {Trace} trace
 * @returns {TraceRect}
 */
function calculateBoundingRect(trace) {
  return {
    xMin: Math.min(...trace.map((point) => point.x)),
    xMax: Math.max(...trace.map((point) => point.x)),
    yMin: Math.min(...trace.map((point) => point.y)),
    yMax: Math.max(...trace.map((point) => point.y))
  }
}

/**
 * Test whether two rects overlap
 * @param {TraceRect} rect1
 * @param {TraceRect} rect2
 * @return {boolean}
 */
function overlap(rect1, rect2) {
  return (
    rect1.xMin < rect2.xMax &&
    rect1.xMax > rect2.xMin &&
    rect1.yMin < rect2.yMax &&
    rect1.yMax > rect2.yMin
  )
}

/**
 * Determine whether a trace is a strike through
 * @param {Trace} trace
 * @return {boolean}
 */
function isStrikeThrough(trace) {
  const changes = calculateChangeInDirections(trace)

  // TODO: better detect large changes by looking at the sum of 2 or 3 consecutive changes:
  //  a large change can be split over two or 3 points if you write slow
  const largeChanges = changes.filter((change) => Math.abs(change) > 0.5 * Math.PI)

  return largeChanges.length >= 3
}

function calculateChangeInDirections(trace) {
  const directions = calculateDirections(trace)
  const changes = []

  for (let i = 0; i < directions.length - 1; i++) {
    const current = directions[i]
    const next = directions[i + 1]
    const change = next - current

    const normalizedChange =
      change > Math.PI ? change - 2 * Math.PI : change < -Math.PI ? change + 2 * Math.PI : change

    changes.push(normalizedChange)
  }

  return changes
}

/**
 * Calculated the directions, the angles, in radians between each of the points.
 * Returns the normalized directions, adjusted for flipping 1 circle at +pi or -pi.
 * @param {Trace} trace
 * @return {number[]}
 */
function calculateDirections(trace) {
  const directions = []

  for (let i = 0; i < trace.length - 1; i++) {
    const current = trace[i]
    const next = trace[i + 1]
    const dx = next.x - current.x
    const dy = next.y - current.y
    const direction = Math.atan2(dx, dy)

    directions.push(direction)
  }

  return directions
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
