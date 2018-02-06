$(function () {
    let HexagonGridCellModule = window.HTM.gridCells.HexagonGridCellModule
    let GridCellModuleRenderer = window.HTM.gridCells.GridCellModuleRenderer

    const minSpacing = 20,
        maxSpacing = 80,
        minOrientation = 0,
        maxOrientation = 45

    let GlobalConfig = function() {
        this.lite = true
        this.sdr = true
    };
    let config = new GlobalConfig();

    //////////
    // UTILS

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }

    function prepareDom() {
        $('body').html('');
    }

    function setupDatGui(modules, renderer) {
        let gui = new dat.GUI();
        let moduleFolders = [];

        gui.add(config, 'lite').onChange(function(value) {
            config.lite = value;
            renderer.render(config.lite);
        });

        gui.add(config, 'sdr').onChange(function(value) {
            config.sdr = value;
            d3.select('#encoding svg').remove()
            renderer.render(config.lite);
        });

        function updateAllControllerDisplays() {
            moduleFolders.forEach(function(folder) {
                for (let i in folder.__controllers) {
                    folder.__controllers[i].updateDisplay();
                }
            });
        }

        modules.forEach(function(module, i) {
            let folder = gui.addFolder('Module ' + module.id)
            // This is because of laziness.
            module.visible = true;
            folder.add(module, 'visible').onChange(function(value) {
                module.visible = value;
                renderer.render(config.lite);
            });
            module.solo = false;
            folder.add(module, 'solo').onChange(function(value) {
                modules.forEach(function(m) {
                    m.visible = ! value;
                    m.solo = false;
                });
                module.solo = value;
                module.visible = true;
                renderer.render(config.lite);
                updateAllControllerDisplays();
            });
            folder.add(module, 'spacing', minSpacing, maxSpacing).onChange(function(value) {
                module.spacing = value;
                renderer.render(config.lite);
            });
            folder.add(module, 'activeCells', 1, 10).onChange(function(value) {
                module.activeCells = value;
                renderer.render(config.lite);
            }).step(1);
            folder.add(module, 'orientation', minOrientation, maxOrientation).onChange(function(value) {
                module.orientation = value;
                renderer.render(config.lite);
            });
            folder.open();
            moduleFolders.push(folder);
        });
    }

    // END UTILS
    /////////////

    let gridCellModules = [];


    function run() {
        prepareDom();

        let module = new HexagonGridCellModule(2, 4, 3, 10, 100)
        module.setColor(100, 100, 255)
        module.activeCells = 2
        gridCellModules.push(module)

        module = new HexagonGridCellModule(1, 5, 4, 0, 60)
        module.setColor(100, 255, 100)
        module.activeCells = 3
        gridCellModules.push(module)

        module = new HexagonGridCellModule(0, 7, 6, 45, 30)
        module.setColor(255, 100 , 100)
        module.activeCells = 7
        gridCellModules.push(module)

        let renderer = new GridCellModuleRenderer(gridCellModules)

        renderer.prepareRender();
        setupDatGui(gridCellModules, renderer)

        renderer.render(config)

        if (renderer.worldPoints) {

            renderer.onWorld('mousemove', function() {
                renderer.renderFromWorld(config, d3.event.pageX, d3.event.pageY)
            });

            renderer.onOverlay('mousemove', function(_, i) {
                renderer.renderFromOverlay(i, config, d3.event.offsetX, d3.event.offsetY)
            })
        }
    }

    window.onload = run;
});
