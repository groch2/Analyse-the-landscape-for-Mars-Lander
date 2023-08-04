console.clear()
console.log(new Date().getTime())

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

const codingGameLandscapeGamePoints = [
  { x: 0, y: 1000 },
  { x: 300, y: 1500 },
  { x: 350, y: 1400 },
  { x: 500, y: 2000 },
  { x: 1500, y: 2700 },
  { x: 1700, y: 2000 },
  { x: 3200, y: 1000 },
  { x: 3500, y: 200 },
  { x: 5000, y: 200 },
  { x: 5500, y: 1500 },
  { x: 5800, y: 1100 },
  { x: 6000, y: 2200 },
  { x: 6500, y: 2400 },
  { x: 6600, y: 2600 },
  { x: 6999, y: 2500 },
]

const landingSiteLeftPointIndex = getLandingSiteLeftPointIndex(
  codingGameLandscapeGamePoints
)
const canvasLandscapePoints = convertCodingGamePointsToCanvasPoints(
  codingGameLandscapeGamePoints,
  canvasHeight,
  resolutionFactor
)
drawLandscape(canvasLandscapePoints, canvas2DContext, 'red')

const landscapeOnTheLeftSideOfTheLandingSite =
  codingGameLandscapeGamePoints.slice(0, landingSiteLeftPointIndex + 1)
const highestPointIndexOnTheLeftSideOfTheLandingSite = getHighestPointIndex(
  landscapeOnTheLeftSideOfTheLandingSite
)
if (highestPointIndexOnTheLeftSideOfTheLandingSite > 0) {
  const higestPointAltitudeOnTheLeftSideOfTheLandingSite =
    codingGameLandscapeGamePoints[
      highestPointIndexOnTheLeftSideOfTheLandingSite
    ].y
  landscapeOnTheLeftSideOfTheLandingSite.splice(
    0,
    highestPointIndexOnTheLeftSideOfTheLandingSite,
    { x: 0, y: higestPointAltitudeOnTheLeftSideOfTheLandingSite }
  )
}
const convexLandscapeOnTheLeftSideOfTheLandingSite = getConvexLandscape(
  landscapeOnTheLeftSideOfTheLandingSite
)
drawFromCodingGameLandscape({
  codingGameLandscapeGamePoints: convexLandscapeOnTheLeftSideOfTheLandingSite,
  canvasHeight,
  resolutionFactor,
  canvas2DContext,
})

const landscapeOnTheRightSideOfTheLandingSite =
  codingGameLandscapeGamePoints.slice(landingSiteLeftPointIndex + 1)
console.log(landscapeOnTheRightSideOfTheLandingSite)
const highestPointIndexOnTheRightSideOfTheLandingSite = getHighestPointIndex(
  landscapeOnTheRightSideOfTheLandingSite
)
console.log({ highestPointIndexOnTheRightSideOfTheLandingSite })
if (
  highestPointIndexOnTheRightSideOfTheLandingSite <
  landscapeOnTheRightSideOfTheLandingSite.length
) {
  const higestPointAltitudeOnTheRightSideOfTheLandingSite =
    landscapeOnTheRightSideOfTheLandingSite[
      highestPointIndexOnTheRightSideOfTheLandingSite
    ].y
  landscapeOnTheRightSideOfTheLandingSite.splice(
    highestPointIndexOnTheRightSideOfTheLandingSite + 1,
    Infinity,
    { x: 6999, y: higestPointAltitudeOnTheRightSideOfTheLandingSite }
  )
}
const convexLandscapeOnTheRightSideOfTheLandingSite = getConvexLandscape(
  landscapeOnTheRightSideOfTheLandingSite
)
drawFromCodingGameLandscape({
  codingGameLandscapeGamePoints: convexLandscapeOnTheRightSideOfTheLandingSite,
  canvasHeight,
  resolutionFactor,
  canvas2DContext,
})

const solutionOutput = [
  ...convexLandscapeOnTheLeftSideOfTheLandingSite,
  ...convexLandscapeOnTheRightSideOfTheLandingSite,
]
  .map(({ x, y }) => `${x},${y}`)
  .join(`\r\n`)
console.log(solutionOutput)

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

function getConvexLandscape(landscapePoints: Point[]) {
  if (landscapePoints.length === 0) {
    return []
  }
  let maxAlitudePoint = landscapePoints[0]
  const uphill = [maxAlitudePoint]
  const downhill = []
  for (let index = 0; index < landscapePoints.length; index++) {
    const point = landscapePoints[index]
    if (point.y > maxAlitudePoint.y) {
      maxAlitudePoint = point
      removePreviousPointsWhileSlopeWithNewPointIsConcave(uphill, point)
      uphill.push(point)
      downhill.splice(0, Infinity)
      downhill.push(point)
    } else {
      while (downhill.length > 0 && downhill.slice(-1)[0].y < point.y) {
        downhill.pop()
      }
      removePreviousPointsWhileSlopeWithNewPointIsConcave(downhill, point)
      downhill.push(point)
    }
  }
  return [...uphill, ...downhill]

  function removePreviousPointsWhileSlopeWithNewPointIsConcave(
    landscapePoints: Point[],
    newPoint: Point
  ) {
    while (landscapePoints.length > 1) {
      const lastPoint = landscapePoints.slice(-1)[0]
      const beforeLastPoint = landscapePoints.slice(-2, -1)[0]
      const previousSlope = getSlope({
        leftPoint: beforeLastPoint,
        rightPoint: lastPoint,
      })
      const currentSlope = getSlope({
        leftPoint: lastPoint,
        rightPoint: newPoint,
      })
      if (currentSlope <= previousSlope) {
        break
      }
      landscapePoints.pop()
    }

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

function getHighestPointIndex(points: Point[]) {
  return points.reduce<{
    highestAltitude: undefined | number
    highestAltitudeIndex: undefined | number
  }>(
    ({ highestAltitude, highestAltitudeIndex }, { y: altitude }, index) => {
      return highestAltitude === undefined || altitude > highestAltitude
        ? { highestAltitude: altitude, highestAltitudeIndex: index }
        : { highestAltitude, highestAltitudeIndex }
    },
    { highestAltitude: undefined, highestAltitudeIndex: undefined }
  ).highestAltitudeIndex as number
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
