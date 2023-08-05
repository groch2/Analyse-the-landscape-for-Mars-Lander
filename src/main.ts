const { innerWidth: viewPortWidth, innerHeight: viewPortHeight } = window
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const { width: canvasWidth, height: canvasHeight } = canvas
const viewRatio = canvasWidth / canvasHeight
const resolutionFactor = (viewPortWidth - 20) / canvasWidth

canvas.width *= resolutionFactor
canvas.height *= resolutionFactor
const canvas2DContext = canvas.getContext('2d')!
canvas2DContext.fillStyle = 'lightgray'
canvas2DContext.fillRect(0, 0, canvas.width, canvas.height)

class Point {
  constructor(readonly x: number, readonly y: number) {}
}

enum VerticalDirection {
  Up = 'Up',
  Down = 'Down',
}

const codingGameLandscapePoints = [
  { x: 0, y: 2700 },
  { x: 1000, y: 2600 },
  { x: 1200, y: 2200 },
  { x: 1400, y: 1950 },
  { x: 1500, y: 2000 },
  { x: 1600, y: 1800 },
  { x: 2000, y: 2100 },
  { x: 2200, y: 1700 },
  { x: 2900, y: 1500 },
  { x: 3200, y: 1000 },
  { x: 3300, y: 400 },
  { x: 3400, y: 600 },
  { x: 3500, y: 200 },
  { x: 5000, y: 200 },
  { x: 5200, y: 300 },
  { x: 5300, y: 1150 },
  { x: 5400, y: 1390 },
  { x: 5450, y: 1400 },
  { x: 5500, y: 1500 },
  { x: 5800, y: 1100 },
  { x: 5900, y: 1200 },
  { x: 6000, y: 2200 },
  { x: 6100, y: 2220 },
  { x: 6200, y: 2300 },
  { x: 6300, y: 2000 },
  { x: 6500, y: 2400 },
  { x: 6600, y: 2300 },
  { x: 6999, y: 2200 },
]

codingGameLandscapePoints
  .slice(1, codingGameLandscapePoints.length - 1)
  .forEach(({ x, y }) => {
    x = convertCodingGameLongitudeToCanvasLongitude({
      codingGameLongitude: x,
      resolutionFactor,
    })
    y = convertCodingGameAltitudeToCanvasAltitude({
      codingGameAltitude: y,
      canvasHeight,
      resolutionFactor,
    })
    canvas2DContext.beginPath()
    canvas2DContext.moveTo(x, y)
    canvas2DContext.lineTo.apply(canvas2DContext, [x, canvas.height])
    canvas2DContext.strokeStyle = 'purple'
    canvas2DContext.stroke()
  })

const canvasLandscapePoints = convertCodingGamePointsToCanvasPoints(
  codingGameLandscapePoints,
  canvasHeight,
  resolutionFactor
)
drawLandscape(canvasLandscapePoints, canvas2DContext, 'red')

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
  drawLandscape(canvasConvexLandscapePoints, canvas2DContext, 'blue')
}

function convertCodingGamePointsToCanvasPoints(
  CodingGamePoints: Point[],
  canvasHeight: number,
  resolutionFactor: number
) {
  return CodingGamePoints.map(({ x, y }) => ({
    x: convertCodingGameLongitudeToCanvasLongitude({
      codingGameLongitude: x,
      resolutionFactor,
    }),
    y: convertCodingGameAltitudeToCanvasAltitude({
      codingGameAltitude: y,
      canvasHeight,
      resolutionFactor,
    }),
  }))
}

function drawLandscape(
  canvasLandscapeCoordinates: Point[],
  canvas2DContext: CanvasRenderingContext2D,
  linesColor: string
) {
  canvas2DContext.beginPath()
  canvas2DContext.moveTo(
    canvasLandscapeCoordinates[0].x,
    canvasLandscapeCoordinates[0].y
  )
  canvasLandscapeCoordinates.forEach(({ x, y }) =>
    canvas2DContext.lineTo.apply(canvas2DContext, [x, y])
  )
  canvas2DContext.strokeStyle = linesColor
  canvas2DContext.stroke()
}

function convertLandscapeToConvexLandscapeOnBothSidesOfTheLandingSite(
  landscape: Point[]
) {
  const landingSiteLeftPointIndex = getLandingSiteLeftPointIndex(
    codingGameLandscapePoints
  )

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
      }
      while (convexLandscape.length > 0) {
        const lastPoint = convexLandscape.slice(-1)[0]
        if (convexLandscape.length > 1) {
          const currentSlope = getSlope({
            leftPoint: lastPoint,
            rightPoint: point,
          })
          const beforeLastPoint = convexLandscape.slice(-2, -1)[0]
          const previousSlope = getSlope({
            leftPoint: beforeLastPoint,
            rightPoint: lastPoint,
          })
          if (currentSlope > previousSlope) {
            convexLandscape.pop()
            continue
          }
        }
        break
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

function convertCodingGameAltitudeToCanvasAltitude({
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

function convertCodingGameLongitudeToCanvasLongitude({
  codingGameLongitude,
  resolutionFactor,
}: {
  codingGameLongitude: number
  resolutionFactor: number
}) {
  return (codingGameLongitude / 10) * resolutionFactor
}
