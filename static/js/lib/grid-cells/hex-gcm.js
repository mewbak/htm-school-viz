$(function () {

    let GridCell = window.HTM.gridCells.GridCell
    let GridCellModule = window.HTM.gridCells.GridCellModule

    class HexagonGridCellModule extends GridCellModule {

        constructor(id, xDim, yDim, orientation, spacing) {
            super(id, xDim * yDim, orientation)
            this.xDim = xDim
            this.yDim = yDim
            this.spacing = spacing
            this.gridCells = this.createGridCells()
        }

        createGridCells() {
            let cells = []
            for (let x = 0; x < this.xDim; x++) {
                for (let y = 0; y < this.yDim; y++) {
                    cells.push(new GridCell(x, y))
                }
            }
            return cells
        }

        intersect(x, y) {
            let cellsByDistance = this.getGridCellsByDistance(x, y, this.points)
            let cellsToChoose = 1
            this.clearActiveGridCells()
            cellsByDistance.slice(0, cellsToChoose).forEach(function(gridCell) {
                gridCell.activate()
            })
        }


        _getGridCellAt(x, y) {
            for (let i = 0; i < this.gridCells.length; i++) {
                let cell = this.gridCells[i];
                if (cell.x == x && cell.y == y)
                    return cell
            }
            debugger;
        }

        createPoints(origin, w, h) {
            // Start rendering points at the origin by rendering grid cell modules
            // over the entire space, leaving enough room for rotation.
            let startAt = {x: origin.x - w, y: origin.y - h},
                endAt = {x: origin.x + (2 * w), y: origin.y + (2 * h)}
            let x = startAt.x,
                y = startAt.y
            let gridx = 0,
                gridy = 0
            let pointId = 0
            let points = []
            while (y <= endAt.y) {
                gridx = 0
                while (x <= endAt.x) {
                    // Shift every other row to get a pseudo hex grid
                    let xmod = x
                    let ymod = y
                    xmod += y / 2;
                    // ymod = y - (this.length - Math.sin(60 * (Math.PI / 180)));
                    ymod = y - (y * 0.1);
                    // Rotate, using center as origin.
                    let rotatedPoint = GridCellModule.translatePoint(
                        xmod, ymod, origin.x, origin.y, this.orientation + 30
                    );
                    let point = {
                        id: pointId++,
                        x: rotatedPoint.x,
                        y: rotatedPoint.y,
                        gridCell: this._getGridCellAt(gridx, gridy),
                        alpha: 0.1
                    }
                    // Only save points that are currently on the screen, within a
                    // buffer defined by the grid spacing
                    if (point.x >= origin.x - this.spacing &&
                        point.x <= origin.x + w + this.spacing &&
                        point.y >= origin.y - this.spacing &&
                        point.y <= origin.y + h + this.spacing) {
                        points.push(point)
                    }
                    x += this.spacing
                    gridx++
                    // This resets the grid cell module x dimension so it tiles.
                    if (gridx > this.xDim - 1) gridx = 0
                }
                // Reset X to walk through the next row
                x = 0
                y += this.spacing
                gridy++
                // This resets the grid cell module y dimension so it tiles.
                if (gridy > this.yDim - 1) gridy = 0
            }
            return points
        }
    }

    window.HTM.gridCells.HexagonGridCellModule = HexagonGridCellModule

})
