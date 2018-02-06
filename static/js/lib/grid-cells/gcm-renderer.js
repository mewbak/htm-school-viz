$(function () {

    function fillByHover(data) {
        if (data.point.hover) return data.rgb
        return 'none'
    }

    function fillByActiveGridCells(data) {
        let point = data.point
        if (! point.gridCell.isPadding && point.gridCell.isActive()) {
            return data.rgb
        }
        return 'none'
    }


    class GridCellModuleRenderer {
        constructor(modules) {
            this.modules = modules;
        }

        onWorld(eventName, handler) {
            d3.select('#world').on(eventName, handler);
        }

        onOverlay(eventName, handler) {
            d3.selectAll('#module-overlays svg').on(eventName, handler);
        }

        prepareRender() {
            let me = this;
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.$world = d3.select('body')
                .append('svg')
                .attr('id', 'world')
                .attr('width', this.width)
                .attr('height', this.height);
            this.$gcmPanel = d3.select('body')
                .append('ul')
                .attr('id', 'module-overlays')
            this.modules.forEach(function(module, i) {
                me.$gcmPanel
                    .append('li')
                    .append('svg')
                    .attr('id', 'module-overlay-' + i)
            });
            d3.select('body').append('div').attr('id', 'encoding')
        }

        _treatVoronoiCell(paths, texts, lite, fillFunction) {
            paths.attr("class", "cell")
                .attr("d", function(data, i) {
                    let point = data.point
                    let polygon = data.polygon
                    if (polygon && point.gridCell) {
                        let first = polygon[0];
                        let cmd = 'M ' + first[0] + ' ' + first[1] + ' ';
                        for (let j = 1; j < polygon.length; j++) {
                            cmd += 'L ' + polygon[j][0] + ' ' + polygon[j][1] + ' ';
                        }
                        cmd += 'L ' + first[0] + ' ' + first[1] + ' ';
                        return cmd;
                    }
                })
                .attr('stroke', '#d6d6d6')
                .attr('stroke-width', function(data) {
                    let out = 1
                    if (lite) out = 0
                    let point = data.point
                    if (point.gridCell.isPadding) out = 0
                    return out
                })
                .attr('fill', fillFunction)
                .attr('fill-opacity', 0.75)
            texts.attr('x', function(d) {
                    return d.point.x - 4
                })
                .attr('y', function(d) {
                    return d.point.y + 3
                })
                .attr('font-size', 12)
                .attr('fill', 'white')
                .text(function(d) {
                    let gc = d.point.gridCell
                    if (! gc.isPadding && gc.isActive())
                        return d.point.gridCell.id
                })
        }

        _renderVoronoiToElement(module, data, $target, lite, fillFunction) {
            // Update
            let paths = $target.selectAll('path').data(data)
            let texts = $target.selectAll('text').data(data)
            this._treatVoronoiCell(paths, texts, lite, fillFunction)

            // Enter
            let newPaths = paths.enter().append('path')
            let newTexts = texts.enter().append('text')
            this._treatVoronoiCell(newPaths, newTexts, lite, fillFunction)

            // Exit
            paths.exit().remove()
        }

        _createVoronoiData(points, voronoi, rgb) {
            let positions = points.map(function(p) {
                return [p.x, p.y];
            })
            let polygons = voronoi(positions).polygons()
            let data = points.map(function(p, i) {
                return {
                    point: points[i],
                    polygon: polygons[i],
                    rgb: rgb
                }
            })
            return data
        }

        _renderModuleOverlayCells(svgs, moduleIndex, lite, fillFunction, mouseX, mouseY) {
            let me = this
            this.overlayPoints = []
            let m = this.modules[moduleIndex]
            let spacing = m.spacing
            let origin = {x: spacing*3, y: spacing*3}
            let voronoi = d3.voronoi()
            let rgb = m.getColorString()

            let points = m.createOverlayPoints(origin)
            if (mouseX !== undefined && mouseY !== undefined) {
                m.intersectOverlay(mouseX, mouseY, points)
            }
            me.overlayPoints.push(points)

            let svg = d3.select(svgs.nodes()[moduleIndex])
            let width = Math.max(...points.map(function(p) { return p.x }))
            let height = Math.max(...points.map(function(p) { return p.y }))
            svg.attr('width', width)
               .attr('height', height)

            voronoi.extent([
                [0, 0],
                [width, height]
            ])

            let data = me._createVoronoiData(points, voronoi, rgb)
            me._renderVoronoiToElement(m, data, svg, lite, fillFunction)
        }

        _renderWorldCells(groups, lite, fillFunction, mouseX, mouseY) {
            let me = this;
            this.worldPoints = []
            let origin = {x: 0, y: 0}
            let width = this.width;
            let height = this.height;
            let voronoi = d3.voronoi();
            voronoi.extent([[origin.x, origin.x], [width, height]])

            this.modules.forEach(function(m, i) {
                if (! m.visible) {
                    me.worldPoints.push([])
                    return
                }

                let g = d3.select(groups.nodes()[i]);
                let rgb = m.getColorString()
                let points = m.createWorldPoints(origin, width, height);

                if (mouseX !== undefined && mouseY !== undefined) {
                    // If x/y are here, it means cursor is over the world so we
                    // need to intersect it.
                    m.intersectWorld(mouseX, mouseY, points)
                }

                me.worldPoints.push(points)

                let data = me._createVoronoiData(me.worldPoints[i], voronoi, rgb)
                me._renderVoronoiToElement(m, data, g, lite, fillFunction)
            });

        }

        render(config) {
            function treatGroups(groups) {
                groups.attr('id', function(m) {
                    return 'module-' + m.id;
                })
                    .attr('visibility', function(m) {
                        if (m.visible) return 'visible';
                        return 'hidden';
                    })
                    .attr('class', 'module-group');
            }

            // Update
            let groups = this.$world.selectAll('g').data(this.modules);
            treatGroups(groups);

            // Enter
            let coming = groups.enter().append('g');
            treatGroups(coming);

            // Exit
            groups.exit().remove();

            this.renderFromWorld(config, 500, 500)
            if (config.sdr)
                this.renderSdr()
        }

        renderFromWorld(config, mouseX, mouseY) {
            let me = this
            let groups = d3.selectAll('g.module-group');
            this._renderWorldCells(groups, config.lite, fillByHover, mouseX, mouseY);
            this.modules.forEach(function(module, i) {
                let svgs = d3.selectAll('#module-overlays svg');
                me._renderModuleOverlayCells(svgs, i, false, fillByActiveGridCells)
            })
            if (config.sdr)
                this.renderSdr()
        }

        renderFromOverlay(moduleIndex, config, mouseX, mouseY) {
            let me = this
            this.modules.forEach(function(module, i) {
                let x = undefined, y = undefined
                if (i == moduleIndex) {
                    x = mouseX
                    y = mouseY
                } else {
                    module.clearActiveGridCells()
                }
                let svgs = d3.selectAll('#module-overlays svg');
                me._renderModuleOverlayCells(svgs, moduleIndex, false, fillByActiveGridCells, x, y)
            })
            let groups = d3.selectAll('g.module-group');
            this._renderWorldCells(groups, config.lite, fillByActiveGridCells);
            if (config.sdr)
                this.renderSdr()
        }

        renderSdr() {
            let encoding = []
            this.modules.forEach(function(m) {
                encoding = encoding.concat(m.getEncoding())
            })
            SDR.draw(encoding, 'encoding', {
                spartan: true,
                size: 30
            });
        }
    }

    window.HTM.gridCells.GridCellModuleRenderer = GridCellModuleRenderer
});
