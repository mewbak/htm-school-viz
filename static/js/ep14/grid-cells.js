$(function () {
    // let GridCellModule = window.HTM.utils.gridCells.GridCellModule;
    let HexagonGridCellModule = window.HTM.gridCells.HexagonGridCellModule
    let SquareGridCellModule = window.HTM.gridCells.SquareGridCellModule
    let RandomGridCellModule = window.HTM.gridCells.RandomGridCellModule
    let GridCellModuleRenderer = window.HTM.gridCells.GridCellModuleRenderer

    let GlobalConfig = function() {
        this.lite = false;
    };
    let config = new GlobalConfig();

    //////////
    // UTILS

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
    }

    // END UTILS
    /////////////

    let gridCellModules = [];

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

        function updateAllControllerDisplays() {
            moduleFolders.forEach(function(folder) {
                for (let i in folder.__controllers) {
                    folder.__controllers[i].updateDisplay();
                }
            });
        }

        modules.forEach(function(module, i) {
            let folder = gui.addFolder('Module ' + module.id)
            let type = {type: module.type}
            folder.add(type, 'type', ['square', 'hex', 'random']).onChange(function(value) {
                let replacementModule;
                if (value == 'square') {
                    replacementModule = new SquareGridCellModule(
                        module.id, module.xDim, module.yDim,
                        module.orientation, module.spacing
                    )
                } else if (value == 'hex') {
                    replacementModule = new HexagonGridCellModule(
                        module.id, module.xDim, module.yDim,
                        module.orientation, module.spacing
                    )
                } else if (value == 'random') {
                    replacementModule = new RandomGridCellModule(module.id, 100, 20)
                }
                modules[i] = replacementModule
                renderer.render(config.lite)
                gui.destroy()
                setupDatGui(modules, renderer)
            });
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
            folder.add(module, 'spacing', 10, 100).onChange(function(value) {
                module.spacing = value;
                renderer.render(config.lite);
            });
            folder.add(module, 'orientation', 0, 30).onChange(function(value) {
                module.orientation = value;
                renderer.render(config.lite);
            });
            folder.open();
            moduleFolders.push(folder);
        });
    }

    function run() {
        prepareDom();

        let GridCellModuleType = HexagonGridCellModule

        let numModules = 5;
        if (numModules > 5) config.lite = true;
        if (numModules == 1) {
            let module = new GridCellModuleType(0, 3, 3, 30, 100);
            // let module = new RandomGridCellModule(0, 100)
            gridCellModules.push(module);
        } else {
            while (gridCellModules.length < numModules) {
                let id = gridCellModules.length;
                let xDim= getRandomInt(3, 6);
                let yDim = getRandomInt(3, 6);
                let spacing= getRandomInt(30, 200);
                let orientation = getRandomInt(0, 30);
                let r = getRandomInt(0, 155);
                let g = getRandomInt(0, 155);
                let b = getRandomInt(0, 155);
                let module = new GridCellModuleType(id, xDim, yDim, orientation, spacing);
                module.setColor(r, g, b)
                gridCellModules.push(module);
            }
        }

        let renderer = new GridCellModuleRenderer(gridCellModules);

        renderer.prepareRender();

        renderer.on('mousemove', function() {
            gridCellModules.forEach(function(module) {
                module.intersect(d3.event.pageX, d3.event.pageY);
                renderer.render(config.lite);
            });
        });

        setupDatGui(gridCellModules, renderer);
        renderer.render(config.lite);

    }

    window.onload = run;
});
