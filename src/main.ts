const { innerWidth: viewPortWidth, innerHeight: viewPortHeight } = window
const canvas = document.getElementById('canvas') as HTMLCanvasElement

const resolutionFactor = (viewPortWidth - 20) / canvas.width
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

const codingGameLandscape = { height: 3000, width: 7000 }
const codingGameLandscapePoints = [
  { x: 0, y: 100 },
  { x: 1000, y: 500 },
  { x: 1500, y: 1500 },
  { x: 3000, y: 1000 },
  { x: 4000, y: 150 },
  { x: 5500, y: 150 },
  { x: 6999, y: 800 },
]

const canvasLandscapePoints = codingGameLandscapePoints.map(({ x, y }) => {
  const canvas_x = convertLengthFromScaleToScale({
    fromLength: x,
    fromTotalLength: codingGameLandscape.width,
    toTotalLength: canvas.width,
  })
  const canvas_y = convertLengthFromScaleToScale({
    fromLength: codingGameLandscape.height - y,
    fromTotalLength: codingGameLandscape.height,
    toTotalLength: canvas.height,
  })
  return new Point(canvas_x, canvas_y)
})

drawCompleteLandscapeFromCanvasLandscapePoints(
  canvasLandscapePoints,
  canvas2DContext
)

canvas.addEventListener('click', ({ offsetX, offsetY }) => {
  const clickPoint = new Point(offsetX, offsetY)
  const { pointHorizontalIndex: clickHorizontallyClosestPointIndex } =
    canvasLandscapePoints
      .map((canvasLandscapePoint, pointHorizontalIndex) => ({
        canvasLandscapePoint,
        distance: getHorizontalDistanceFromPointAToPointB(
          canvasLandscapePoint,
          clickPoint
        ),
        pointHorizontalIndex,
      }))
      .reduce((state, item) => (item.distance < state.distance ? item : state))
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

  function getHorizontalDistanceFromPointAToPointB(a: Point, b: Point): number {
    return Math.abs(a.x - b.x)
  }
})

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
  drawConvexLandscape(canvasLandscapePoints, canvas2DContext)

  function drawVerticalLinesForLandscapePoints(
    landscapePoints: Point[],
    canvas2DContext: CanvasRenderingContext2D,
    linesColor: string
  ) {
    landscapePoints.slice(1, landscapePoints.length - 1).forEach(({ x, y }) => {
      canvas2DContext.beginPath()
      canvas2DContext.moveTo(x, y)
      canvas2DContext.lineTo(x, canvas.height)
      canvas2DContext.strokeStyle = linesColor
      canvas2DContext.stroke()
    })
  }

  function drawConvexLandscape(
    landscapePoints: Point[],
    canvas2DContext: CanvasRenderingContext2D
  ) {
    const { convexLandscape: _convexLandscape, landingSiteLeftPointIndex } =
      convertLandscapeToConvexLandscapeOnBothSidesOfTheLandingSite(
        landscapePoints.map(({ x, y }) => new Point(x, canvas.height - y))
      )
    const convexLandscape = _convexLandscape.map(
      ({ x, y }) => new Point(x, canvas.height - y)
    )
    drawLandscape({
      landscapePoints: convexLandscape.slice(0, landingSiteLeftPointIndex),
      canvas2DContext,
    })
    drawLandscape({
      landscapePoints: convexLandscape.slice(landingSiteLeftPointIndex),
      canvas2DContext,
    })

    function drawLandscape({
      landscapePoints,
      canvas2DContext,
    }: {
      landscapePoints: Point[]
      canvas2DContext: CanvasRenderingContext2D
    }) {
      drawLandscapeHorizon(landscapePoints, canvas2DContext, 'blue')
    }
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
          (landscapePoints.length > 0 &&
            point.y > convexLandscape.slice(-1)[0].y)
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
}

function convertLengthFromScaleToScale({
  fromLength,
  fromTotalLength,
  toTotalLength,
}: {
  fromLength: number
  fromTotalLength: number
  toTotalLength: number
}) {
  return (fromLength * toTotalLength) / fromTotalLength
}
