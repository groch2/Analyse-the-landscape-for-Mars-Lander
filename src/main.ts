const { innerWidth: viewPortWidth } = window
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const toggleConvexLandscapeVisibilityButton = document.getElementById(
  'toggleConvexLandscapeVisibility'
) as HTMLButtonElement

const viewPortToCanvasWidthRatio = (viewPortWidth - 20) / canvas.width
canvas.width *= viewPortToCanvasWidthRatio
canvas.height *= viewPortToCanvasWidthRatio

const canvas2DContext = canvas.getContext('2d')!

class Point {
  constructor(readonly x: number, readonly y: number) {}
}

class Segment {
  public readonly left: Point
  public readonly right: Point
  constructor(a: Point, b: Point) {
    this.left = a
    this.right = b
    if (a.x > b.x) {
      this.left = b
      this.right = a
    }
  }
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
    fromLength: y,
    fromTotalLength: codingGameLandscape.height,
    toTotalLength: canvas.height,
  })
  return new Point(canvas_x, canvas_y)

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
})

let displayConvexLandscape = true
drawCompleteLandscape(canvasLandscapePoints, canvas2DContext)

function drawCompleteLandscape(
  canvasLandscapePoints: Point[],
  canvas2DContext: CanvasRenderingContext2D
) {
  clearLandscape(canvas2DContext)
  drawLandscape(canvasLandscapePoints, canvas2DContext, 'red')
  drawVerticalLinesBetweenCanvasBottomAndLandscapePoints(
    canvasLandscapePoints,
    canvas2DContext,
    'purple'
  )
  if (displayConvexLandscape === true) {
    drawConvexLandscape(canvasLandscapePoints, canvas2DContext, 'blue')
  }
  drawMiddleSlopeAtEachPairsOfSegmentJunctions(
    canvasLandscapePoints,
    canvas2DContext
  )

  function clearLandscape(canvas2DContext: CanvasRenderingContext2D) {
    canvas2DContext.clearRect(
      0,
      0,
      canvas2DContext.canvas.width,
      canvas2DContext.canvas.height
    )
    canvas2DContext.fillStyle = 'lightgray'
    canvas2DContext.fillRect(0, 0, canvas.width, canvas.height)
  }

  function drawConvexLandscape(
    landscapePoints: Point[],
    canvas2DContext: CanvasRenderingContext2D,
    linesColor: string
  ) {
    const { convexLandscape: convexLandscape, landingSiteLeftPointIndex } =
      convertLandscapeToConvexLandscapeOnBothSidesOfTheLandingSite(
        landscapePoints
      )
    drawLandscape(
      convexLandscape.slice(0, landingSiteLeftPointIndex),
      canvas2DContext,
      linesColor
    )
    drawLandscape(
      convexLandscape.slice(landingSiteLeftPointIndex),
      canvas2DContext,
      linesColor
    )

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
          maxAlitudePoint =
            point.y > maxAlitudePoint.y ? point : maxAlitudePoint
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

  function drawLandscape(
    canvasLandscapeCoordinates: Point[],
    canvas2DContext: CanvasRenderingContext2D,
    linesColor: string
  ) {
    canvas2DContext.beginPath()
    canvas2DContext.moveTo(
      canvasLandscapeCoordinates[0].x,
      canvas2DContext.canvas.height - canvasLandscapeCoordinates[0].y
    )
    canvasLandscapeCoordinates
      .slice(1)
      .forEach(({ x, y }) =>
        canvas2DContext.lineTo(x, canvas2DContext.canvas.height - y)
      )
    canvas2DContext.strokeStyle = linesColor
    canvas2DContext.stroke()
  }

  function drawVerticalLinesBetweenCanvasBottomAndLandscapePoints(
    landscapePoints: Point[],
    canvas2DContext: CanvasRenderingContext2D,
    linesColor: string
  ) {
    landscapePoints.slice(1, landscapePoints.length - 1).forEach(({ x, y }) => {
      canvas2DContext.beginPath()
      canvas2DContext.moveTo(x, canvas.height)
      canvas2DContext.lineTo(x, canvas.height - y)
      canvas2DContext.strokeStyle = linesColor
      canvas2DContext.stroke()
    })
  }
}

canvas.addEventListener('click', ({ offsetX, offsetY }) => {
  const { pointHorizontalIndex: clickHorizontallyClosestPointIndex } =
    canvasLandscapePoints
      .map((canvasLandscapePoint, pointHorizontalIndex) => ({
        canvasLandscapePoint,
        distance: Math.abs(offsetX - canvasLandscapePoint.x),
        pointHorizontalIndex,
      }))
      .reduce((state, item) => (item.distance < state.distance ? item : state))
  const canvasReplacementPoint = new Point(
    clickHorizontallyClosestPointIndex === 0
      ? 0
      : clickHorizontallyClosestPointIndex === canvasLandscapePoints.length - 1
      ? canvas.width
      : offsetX,
    canvas.height - offsetY
  )
  canvasLandscapePoints[clickHorizontallyClosestPointIndex] =
    canvasReplacementPoint
  drawCompleteLandscape(canvasLandscapePoints, canvas2DContext)
})

toggleConvexLandscapeVisibilityButton.addEventListener(
  'click',
  toggleConvexLandscapeVisibility
)

function drawMiddleSlopeAtEachPairsOfSegmentJunctions(
  canvasLandscapePoints: Point[],
  canvas2DContext: CanvasRenderingContext2D
) {
  const oppositeSide_1 = canvasLandscapePoints[1].y - canvasLandscapePoints[0].y
  const adjacentSide_1 = canvasLandscapePoints[1].x - canvasLandscapePoints[0].x
  const hypotenuse_1 = Math.sqrt(
    Math.pow(oppositeSide_1, 2) + Math.pow(adjacentSide_1, 2)
  )
  const angle_1 = angleInRadiansToDregrees(
    Math.asin(oppositeSide_1 / hypotenuse_1)
  )

  const oppositeSide_2 = canvasLandscapePoints[2].y - canvasLandscapePoints[1].y
  const adjacentSide_2 = canvasLandscapePoints[2].x - canvasLandscapePoints[1].x
  const hypotenuse_2 = Math.sqrt(
    Math.pow(oppositeSide_2, 2) + Math.pow(adjacentSide_2, 2)
  )
  const angle_2 = angleInRadiansToDregrees(
    Math.asin(adjacentSide_2 / hypotenuse_2)
  )

  const slope = Math.tan(
    angleInDegreesToRadians(45) -
      angleInDegreesToRadians(angle_1) / 2 +
      angleInDegreesToRadians(angle_2) / 2
  )
  drawStraightLineFromPointAndSlope(
    canvasLandscapePoints[1],
    -slope,
    canvas2DContext,
    'green'
  )
}

function angleInRadiansToDregrees(angleInRadians: number) {
  return (angleInRadians * 180) / Math.PI
}

function angleInDegreesToRadians(angleInDegrees: number) {
  return (angleInDegrees * Math.PI) / 180
}

function drawSegmentPerpendicularsAtEachEndForEachSegment(
  canvasLandscapePoints: Point[],
  canvas2DContext: CanvasRenderingContext2D
) {
  ;[...getAllSegments(canvasLandscapePoints)].forEach((segment) =>
    drawSegmentPerpendicularsAtEachEnd(segment, canvas2DContext)
  )

  function drawSegmentPerpendicularsAtEachEnd(
    segment: Segment,
    canvas2DContext: CanvasRenderingContext2D
  ) {
    if (segment.left.y === segment.right.y) {
      drawVerticalLine(segment.left.x, canvas2DContext, 'green')
      drawVerticalLine(segment.right.x, canvas2DContext, 'brown')
    }
    const perpendicularSlope = getPerpendicularSlope(segment)
    drawStraightLineFromPointAndSlope(
      segment.left,
      perpendicularSlope,
      canvas2DContext,
      'green'
    )
    drawStraightLineFromPointAndSlope(
      segment.right,
      perpendicularSlope,
      canvas2DContext,
      'brown'
    )
  }
}

function* getAllSegments(points: Point[]) {
  for (let i = 0; i < points.length - 1; i++) {
    yield new Segment(points[i], points[i + 1])
  }
}

function getSlope(segment: Segment): number {
  return (segment.right.y - segment.left.y) / (segment.right.x - segment.left.x)
}

function getPerpendicularSlope(segment: Segment): number {
  return -1 / getSlope(segment)
}

function drawStraightLineFromPointAndSlope(
  point: Point,
  slope: number,
  canvas2DContext: CanvasRenderingContext2D,
  lineColor: string
): void {
  const ordinateAtOrigin = point.y - slope * point.x
  const ordinateAtCanvasRightLimit =
    slope * canvas2DContext.canvas.width + ordinateAtOrigin
  canvas2DContext.beginPath()
  canvas2DContext.moveTo(0, canvas2DContext.canvas.height - ordinateAtOrigin)
  canvas2DContext.lineTo(
    canvas2DContext.canvas.width,
    canvas2DContext.canvas.height - ordinateAtCanvasRightLimit
  )
  canvas2DContext.strokeStyle = lineColor
  canvas2DContext.stroke()
}

function drawVerticalLine(
  x: number,
  canvas2DContext: CanvasRenderingContext2D,
  lineColor: string
) {
  canvas2DContext.beginPath()
  canvas2DContext.moveTo(x, canvas2DContext.canvas.height)
  canvas2DContext.lineTo(x, 0)
  canvas2DContext.strokeStyle = lineColor
  canvas2DContext.stroke()
}

function drawVerticalLineFromBottomToY(
  x: number,
  y: number,
  canvas2DContext: CanvasRenderingContext2D,
  lineColor: string
) {
  canvas2DContext.beginPath()
  canvas2DContext.moveTo(x, y)
  canvas2DContext.lineTo(x, canvas2DContext.canvas.height)
  canvas2DContext.strokeStyle = lineColor
  canvas2DContext.stroke()
}

function drawHorizontalLine(
  y: number,
  canvas2DContext: CanvasRenderingContext2D,
  lineColor: string
) {
  y = canvas2DContext.canvas.height - y
  canvas2DContext.beginPath()
  canvas2DContext.moveTo(0, y)
  canvas2DContext.lineTo(canvas2DContext.canvas.width, y)
  canvas2DContext.strokeStyle = lineColor
  canvas2DContext.stroke()
}

function round(n: number, nbDecimals: number) {
  const powOf10 = Math.pow(10, nbDecimals)
  return Math.trunc(n * powOf10) / powOf10
}

function toggleConvexLandscapeVisibility() {
  displayConvexLandscape = !displayConvexLandscape
  drawCompleteLandscape(canvasLandscapePoints, canvas2DContext)
}
