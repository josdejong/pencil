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

  /** @type {Trace[]} */
  let removedTraces = []

  /** @type {Trace | null} */
  let newTrace = null

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

  function getPoint(event) {
    const rect = wrapper.getBoundingClientRect()

    return {
      x: event.clientX - rect.x,
      y: height - (event.clientY - rect.y),
      t: Date.now()
    }
  }

  function addPoint(point) {
    if (newTrace) {
      newTrace.push(point)

      render()
    }
  }

  function addNewTrace() {
    traces.push(newTrace)
    newTrace = null

    render()
  }

  function clearRemovedTraces() {
    removedTraces = []

    render()
  }

  function removeStrikeThroughPaths(strikeThroughRect) {
    for (let i = 0; i < traces.length; i++) {
      if (traces[i].some((point) => pointInRect(point, strikeThroughRect))) {
        removedTraces.push(traces[i])
        traces.splice(i, 1)
        i--
      }
    }

    render()

    // remove the deleted paths from the rendering after a bit
    setTimeout(clearRemovedTraces, clearStrikeThroughDelay)
  }

  function handlePointerDown(event) {
    event.preventDefault()

    const point = getPoint(event)
    newTrace = [point]

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
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

    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)

    if (newTrace) {
      const _newTrace = newTrace
      addNewTrace()

      if (enableStrikeThrough && isStrikeThrough(_newTrace)) {
        const rect = calculateBoundingRect(_newTrace)

        removeStrikeThroughPaths(rect)
      }

      onChange()
    }
  }

  function clear() {
    traces = []
    removedTraces = []
    newTrace = null

    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }
  }

  function render() {
    /**
     * @param {number} index
     * @param {string} path
     * @param {string} color
     */
    function createOrUpdatePath(index, path, color) {
      /** @type {SVGPathElement} */
      const svgPath = svg.childNodes[index]

      if (svgPath) {
        // update existing path
        if (svgPath.getAttributeNS(null, 'd') !== path) {
          svgPath.setAttributeNS(null, 'd', path)
        }

        // update existing color
        if (svgPath.getAttributeNS(null, 'stroke') !== color) {
          svgPath.setAttributeNS(null, 'stroke', color)
        }
      } else {
        // create a new path
        const svgPath = document.createElementNS(namespaceUri, 'path')
        svgPath.setAttributeNS(null, 'd', path)
        svgPath.setAttributeNS(null, 'stroke', color)
        svgPath.setAttributeNS(null, 'stroke-linecap', 'round')
        svgPath.setAttributeNS(null, 'fill', 'transparent')
        svgPath.setAttributeNS(null, 'stroke-width', String(strokeWidth))

        svg.appendChild(svgPath)
      }
    }

    for (let i = 0; i < traces.length; i++) {
      createOrUpdatePath(i, toSvgPath(traces[i], height), strokeColor)
    }

    for (let i = 0; i < removedTraces.length; i++) {
      createOrUpdatePath(traces.length + i, toSvgPath(removedTraces[i], height), strikeThroughColor)
    }

    if (newTrace) {
      createOrUpdatePath(
        traces.length + removedTraces.length,
        toSvgPath(newTrace, height),
        strokeColor
      )
    }

    while (svg.childElementCount > traces.length + removedTraces.length + newTrace ? 1 : 0) {
      svg.removeChild(svg.lastChild)
    }
  }

  return {
    getTraces: () => traces.slice(),
    getSVG: () => {
      clearRemovedTraces()
      return svgToDataUrl(svg.outerHTML)
    },
    getPNG: () => {
      clearRemovedTraces()
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
 * Test whether a point lies inside a rect
 * @param {Point} point
 * @param {TraceRect} rect
 * @return {boolean}
 */
function pointInRect(point, rect) {
  return (
    point.x >= rect.xMin && point.x <= rect.xMax && point.y >= rect.yMin && point.y <= rect.yMax
  )
}

/**
 * Determine whether a trace is a strike through
 * @param {Trace} trace
 * @return {boolean}
 */
function isStrikeThrough(trace) {
  const changes = calculateChangeInDirections(trace)

  let largeChanges = 0
  for (let i = 0; i < changes.length - 1; i++) {
    // We look at the sum of two consecutive changes because often a switch
    // in direction is spread over two or even three points in time.
    if (Math.abs(changes[i] + changes[i + 1]) > 0.5 * Math.PI) {
      largeChanges++
    }
  }

  return largeChanges >= 5
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
