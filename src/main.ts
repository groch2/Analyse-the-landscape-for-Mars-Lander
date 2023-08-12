const { innerWidth: viewPortWidth, innerHeight: viewPortHeight } = window
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const { width: canvasWidth, height: canvasHeight } = canvas
const viewRatio = canvasWidth / canvasHeight
const resolutionFactor = (viewPortWidth - 20) / canvasWidth

canvas.width *= resolutionFactor
canvas.height *= resolutionFactor
const canvas2DContext = canvas.getContext('2d')!

class Point {
  constructor(readonly x: number, readonly y: number) {}
}

enum VerticalDirection {
  Up = 'Up',
  Down = 'Down',
}

const codingGameLandscapePoints = [
  { x: 0, y: 100 },
  { x: 1000, y: 500 },
  { x: 1500, y: 1500 },
  { x: 3000, y: 1000 },
  { x: 4000, y: 150 },
  { x: 5500, y: 150 },
  { x: 6999, y: 800 },
]

const canvasLandscapePoints = convertCodingGamePointsToCanvasPoints(
  codingGameLandscapePoints,
  canvasHeight,
  resolutionFactor
)

drawCompleteLandscapeFromCanvasLandscapePoints(
  canvasLandscapePoints,
  canvas2DContext
)

function drawCompleteLandscapeFromCanvasLandscapePoints(
  canvasLandscapePoints: Point[],
  canvas2DContext: CanvasRenderingContext2D
) {
  canvas2DContext.clearRect(
    0,
    0,
    canvas2DContext.canvas.width,
    canvas2DContext.canvas.height
  )
  canvas2DContext.fillStyle = 'lightgray'
  canvas2DContext.fillRect(0, 0, canvas.width, canvas.height)
  drawVerticalLinesForLandscapePoints(
    canvasLandscapePoints,
    canvas2DContext,
    'purple'
  )
  drawLandscapeHorizon(canvasLandscapePoints, canvas2DContext, 'red')

  function drawVerticalLinesForLandscapePoints(
    canvasLandscapePoints: Point[],
    canvas2DContext: CanvasRenderingContext2D,
    linesColor: string
  ) {
    canvasLandscapePoints
      .slice(1, canvasLandscapePoints.length - 1)
      .forEach(({ x, y }) => {
        canvas2DContext.beginPath()
        canvas2DContext.moveTo(x, y)
        canvas2DContext.lineTo(x, canvas.height)
        canvas2DContext.strokeStyle = linesColor
        canvas2DContext.stroke()
      })
  }
}

let intervalId: number | undefined = undefined
let cursorX: number, cursorY: number
function saveCursorPosition({ pageX, pageY }: MouseEvent) {
  cursorX = pageX
  cursorY = pageY
}
let clickHorizontallyClosestPointIndex: number | undefined = undefined
canvas.addEventListener('mousedown', ({ offsetX, offsetY }) => {
  console.debug({ offsetX, offsetY })
  const clickPoint = new Point(offsetX, offsetY)
  const {
    canvasLandscapePoint: closestPoint,
    distance,
    index: _clickHorizontallyClosestPointIndex,
  } = canvasLandscapePoints
    .map((canvasLandscapePoint, pointHorizontalIndex) => ({
      canvasLandscapePoint,
      distance: getHorizontalDistanceFromPointAToPointB(
        canvasLandscapePoint,
        clickPoint
      ),
      index: pointHorizontalIndex,
    }))
    .reduce((state, item) => (item.distance < state.distance ? item : state))
  clickHorizontallyClosestPointIndex = _clickHorizontallyClosestPointIndex
  console.log({ 'closest point index': _clickHorizontallyClosestPointIndex })
  const previousPointX =
    _clickHorizontallyClosestPointIndex === 0
      ? 0
      : canvasLandscapePoints[_clickHorizontallyClosestPointIndex - 1].x
  const nextPointX =
    _clickHorizontallyClosestPointIndex === canvasLandscapePoints.length - 1
      ? canvas.width
      : canvasLandscapePoints[_clickHorizontallyClosestPointIndex + 1].x
  console.log({ previousPointX, nextPointX })
  window.addEventListener('mousemove', saveCursorPosition)
  intervalId = window.setInterval(() => {
    console.log({ cursorX, cursorY })
  }, 100)
  console.debug({ closestPoint, distance })
})

canvas.addEventListener('mouseup', ({ offsetX, offsetY }) => {
  console.debug({ offsetX, offsetY })
  window.clearInterval(intervalId)
  window.removeEventListener('mousemove', saveCursorPosition)
  clickHorizontallyClosestPointIndex =
    clickHorizontallyClosestPointIndex as number
  const canvasReplacementPoint = new Point(
    clickHorizontallyClosestPointIndex === 0
      ? 0
      : clickHorizontallyClosestPointIndex === canvasLandscapePoints.length - 1
      ? canvas.width
      : offsetX,
    offsetY
  )
  canvasLandscapePoints[clickHorizontallyClosestPointIndex] =
    canvasReplacementPoint
  drawCompleteLandscapeFromCanvasLandscapePoints(
    canvasLandscapePoints,
    canvas2DContext
  )

  const codingGameReplacementPoint = new Point(
    convertLongitudeFromCanvasToCodingGame({
      canvasGameLongitude: canvasReplacementPoint.x,
      resolutionFactor,
    }),
    convertAltitudeFromCanvasToCodingGame({
      canvasAltitude: canvasReplacementPoint.y,
      canvasHeight: canvas.height,
      resolutionFactor,
    })
  )
  codingGameLandscapePoints[clickHorizontallyClosestPointIndex] =
    codingGameReplacementPoint
})

drawConvexLandscape(
  codingGameLandscapePoints,
  canvas2DContext,
  canvasHeight,
  resolutionFactor
)

function drawConvexLandscape(
  codingGameLandscapePoints: Point[],
  canvas2DContext: CanvasRenderingContext2D,
  canvasHeight: number,
  resolutionFactor: number
) {
  const { convexLandscape, landingSiteLeftPointIndex } =
    convertLandscapeToConvexLandscapeOnBothSidesOfTheLandingSite(
      codingGameLandscapePoints
    )
  drawFromCodingGameLandscape({
    codingGameLandscapeGamePoints: convexLandscape.slice(
      0,
      landingSiteLeftPointIndex
    ),
    canvasHeight,
    resolutionFactor,
    canvas2DContext,
  })
  drawFromCodingGameLandscape({
    codingGameLandscapeGamePoints: convexLandscape.slice(
      landingSiteLeftPointIndex
    ),
    canvasHeight,
    resolutionFactor,
    canvas2DContext,
  })

  function drawFromCodingGameLandscape({
    codingGameLandscapeGamePoints,
    canvasHeight,
    resolutionFactor,
    canvas2DContext,
  }: {
    codingGameLandscapeGamePoints: Point[]
    canvasHeight: number
    resolutionFactor: number
    canvas2DContext: CanvasRenderingContext2D
  }) {
    const canvasConvexLandscapePoints = convertCodingGamePointsToCanvasPoints(
      codingGameLandscapeGamePoints,
      canvasHeight,
      resolutionFactor
    )
    drawLandscapeHorizon(canvasConvexLandscapePoints, canvas2DContext, 'blue')
  }
}

function convertCodingGamePointsToCanvasPoints(
  CodingGamePoints: Point[],
  canvasHeight: number,
  resolutionFactor: number
) {
  return CodingGamePoints.map(({ x, y }) => ({
    x: convertLongitudeFromCodingGameToCanvas({
      codingGameLongitude: x,
      resolutionFactor,
    }),
    y: convertAltitudeFromCodingGameToCanvas({
      codingGameAltitude: y,
      canvasHeight,
      resolutionFactor,
    }),
  }))
}

function drawLandscapeHorizon(
  canvasLandscapeCoordinates: Point[],
  canvas2DContext: CanvasRenderingContext2D,
  linesColor: string
) {
  canvas2DContext.beginPath()
  canvas2DContext.moveTo(
    canvasLandscapeCoordinates[0].x,
    canvasLandscapeCoordinates[0].y
  )
  canvasLandscapeCoordinates
    .slice(1)
    .forEach(({ x, y }) => canvas2DContext.lineTo(x, y))
  canvas2DContext.strokeStyle = linesColor
  canvas2DContext.stroke()
}

function convertLandscapeToConvexLandscapeOnBothSidesOfTheLandingSite(
  landscape: Point[]
) {
  const landingSiteLeftPointIndex = getLandingSiteLeftPointIndex(landscape)

  const landscapeOnTheLeftSideOfTheLandingSite = landscape.slice(
    0,
    landingSiteLeftPointIndex + 1
  )
  const convexLandscapeOnTheLeftSideOfTheLandingSite =
    getConvexLandscapeInOneVerticalDirection(
      landscapeOnTheLeftSideOfTheLandingSite,
      VerticalDirection.Down
    )

  const landscapeOnTheRightSideOfTheLandingSite = landscape.slice(
    landingSiteLeftPointIndex + 1
  )
  const convexLandscapeOnTheRightSideOfTheLandingSite =
    getConvexLandscapeInOneVerticalDirection(
      landscapeOnTheRightSideOfTheLandingSite,
      VerticalDirection.Up
    )

  return {
    convexLandscape: [
      ...convexLandscapeOnTheLeftSideOfTheLandingSite,
      ...convexLandscapeOnTheRightSideOfTheLandingSite,
    ],
    landingSiteLeftPointIndex:
      convexLandscapeOnTheLeftSideOfTheLandingSite.length,
  }

  function getConvexLandscapeInOneVerticalDirection(
    landscapePoints: Point[],
    verticalDirection: VerticalDirection
  ) {
    if (landscapePoints.length === 0) {
      return []
    }
    let maxAlitudePoint = landscapePoints[0]
    const convexLandscape = [landscapePoints[0]]
    for (let index = 1; index < landscapePoints.length; index++) {
      const point = landscapePoints[index]
      maxAlitudePoint = point.y > maxAlitudePoint.y ? point : maxAlitudePoint
      if (
        verticalDirection === VerticalDirection.Down &&
        point.y === maxAlitudePoint.y
      ) {
        convexLandscape.splice(
          0,
          Infinity,
          new Point(0, maxAlitudePoint.y),
          maxAlitudePoint
        )
        continue
      }
      while (convexLandscape.length > 1) {
        const lastPoint = convexLandscape.slice(-1)[0]
        const currentSlope = getSlope({
          leftPoint: lastPoint,
          rightPoint: point,
        })
        const beforeLastPoint = convexLandscape.slice(-2, -1)[0]
        const previousSlope = getSlope({
          leftPoint: beforeLastPoint,
          rightPoint: lastPoint,
        })
        if (currentSlope <= previousSlope) {
          break
        }
        convexLandscape.pop()
      }
      if (
        verticalDirection === VerticalDirection.Down ||
        (landscapePoints.length > 0 && point.y > convexLandscape.slice(-1)[0].y)
      ) {
        convexLandscape.push(point)
      }
    }

    if (verticalDirection === VerticalDirection.Up) {
      const lastConvexLandscapePoint = convexLandscape.slice(-1)[0]
      const { x: lastLandscapePointX } = landscapePoints.slice(-1)[0]
      if (lastConvexLandscapePoint.x < lastLandscapePointX) {
        convexLandscape.push(
          new Point(lastLandscapePointX, lastConvexLandscapePoint.y)
        )
      }
    }

    return convexLandscape

    function getSlope({
      leftPoint,
      rightPoint,
    }: {
      leftPoint: Point
      rightPoint: Point
    }) {
      return (rightPoint.y - leftPoint.y) / (rightPoint.x - leftPoint.x)
    }
  }

  function getLandingSiteLeftPointIndex(landscapePoints: Point[]) {
    let previousPoint = landscapePoints[0]
    for (let index = 1; index < landscapePoints.length; index++) {
      const point = landscapePoints[index]
      if (point.y === previousPoint.y) {
        return index - 1
      }
      previousPoint = point
    }
    return 0
  }
}

function convertAltitudeFromCodingGameToCanvas({
  codingGameAltitude,
  canvasHeight,
  resolutionFactor,
}: {
  codingGameAltitude: number
  canvasHeight: number
  resolutionFactor: number
}) {
  return (canvasHeight - codingGameAltitude / 10) * resolutionFactor
}

function convertAltitudeFromCanvasToCodingGame({
  canvasAltitude,
  canvasHeight,
  resolutionFactor,
}: {
  canvasAltitude: number
  canvasHeight: number
  resolutionFactor: number
}) {
  return (canvasAltitude / resolutionFactor + canvasHeight) * 10
}

function convertLongitudeFromCodingGameToCanvas({
  codingGameLongitude,
  resolutionFactor,
}: {
  codingGameLongitude: number
  resolutionFactor: number
}) {
  return (codingGameLongitude / 10) * resolutionFactor
}

function convertLongitudeFromCanvasToCodingGame({
  canvasGameLongitude,
  resolutionFactor,
}: {
  canvasGameLongitude: number
  resolutionFactor: number
}) {
  return (canvasGameLongitude / resolutionFactor + canvasHeight) * 10
}

function getHorizontalDistanceFromPointAToPointB(a: Point, b: Point): number {
  return Math.abs(a.x - b.x)
}
