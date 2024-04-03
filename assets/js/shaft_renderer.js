const ROW_MAX  = 20
const COL_MAX  = 40
const DEFAULT  = 4
const BUFFER   = 25
const PADDING  = 5;
const WIDTH    = 1500;
const HEIGHT   = 1000;
/*
    Konva is in (c,r) format by default
    where (y,x) represent the horizontal & vertical axis respectively 
*/
const stage = new Konva.Stage({
    container: 'konva-container',
    width: 1250,
    height: 650,
    draggable: false
});
const rectLayer   = new Konva.Layer();

const cmain       = 'black'
const cmainFill   = 'white'
const calternate  = 'blue'
const calternativeFill = '#0080FF'
const cgreen      = 'green'

let num_pedals = DEFAULT
let num_shafts = DEFAULT
let select_row     = null
let highlightGroup = null

function initCanvas() {
    //stage.container().style.backgroundColor = 'green';
    drawWeaveDraft()
    linkEvents()
}

function drawWeaveDraft() {
    let idx = 0
    
    //Draw Threading & Create Array (s x n)
    var threadingGroup = new Konva.Group({
        x: 5, 
        y: 5,
        id: 'threadingGroup',
        width: 1000,
        height: 250
    });

    for (let i = 0; i < COL_MAX; i++) {
        for (let j = 0; j < num_shafts; j++) {
            createRectangle(idx++, i, j, threadingGroup)
        }
    }
    window.ndarray.createArray(num_shafts, COL_MAX, 0)

    //Draw TieUp & Create Array (s x p)
    var tieUpGroup = new Konva.Group({
        x: 1025, 
        y: 5,
        id: 'tieUpGroup', 
        width: 400,
        height: 400
    });

    for (let i = 0; i < num_pedals; i++) {
        for (let j = 0; j < num_shafts; j++) {
            createRectangle(idx++, i, j, tieUpGroup)
        }
    }
    window.ndarray.createArray(num_shafts, num_pedals, 1)
    
    //Draw Threadling & Create Array (p x t)
    var treadlingGroup = new Konva.Group({
        x: 1025, 
        y: num_shafts*BUFFER*1.13,
        id: 'treadlingGroup', 
        width: 400,
        height: 600
    });

    for (let i = 0; i < num_pedals; i++) {
        for (let j = 0; j < ROW_MAX; j++) {
            createRectangle(idx++, i, j, treadlingGroup)
        }
    }
    window.ndarray.createArray(ROW_MAX, num_pedals, 2)

    //Draw Drawdown & Create Array  (n x t)
    var drawdownGroup = new Konva.Group({
        x: 5, 
        y: num_shafts*BUFFER*1.13,
        id: 'drawdownGroup', 
        width: 800,
        height: 800
    });

    for (let i = 0; i < COL_MAX; i++) {
        for (let j = 0; j < ROW_MAX; j++) {
            createRectangle(idx++, i, j, drawdownGroup)
        }
    }
    window.ndarray.createArray(ROW_MAX, COL_MAX, 3)
    
    //Mirror Group on Top of Drawdown Group
    highlightGroup = new Konva.Group({
        x: 5, 
        y: num_shafts*BUFFER*1.13,
        id: 'highlightGroup', 
        width: 800,
        height: 800
    });

    drawScrollBars()

    rectLayer.add(threadingGroup);
    rectLayer.add(tieUpGroup);
    rectLayer.add(treadlingGroup);
    rectLayer.add(drawdownGroup);
    rectLayer.add(highlightGroup);
    stage.add(rectLayer);
}

//Link Canvas Events
function linkEvents() {
    stage.on('click', function (e) {
        //Error Handling
        if(typeof e.target.id() == 'string') {
            console.log("Error Handler: Clicked on Invalid Canvas Location")
            return
        }

        //Decompose Event
        let text_obj = e.target
        let obj_id   = 'rect_' + text_obj.id().toString()
        let cRect    = stage.find("."+obj_id)[0]

        //Disable Toggling for Drawdown Matrix
        if(cRect.getAncestors()[0].id() == 'drawdownGroup'){
            console.log("Error Handler: Cannot Toggle Drawdown Matrix")
            return
        }
        //console.log("cRect = ", cRect.getAncestors()[0].id())
        //console.log("printing cRect (", cRect.y()/BUFFER,",",cRect.x()/BUFFER,")")

        let state = toggleObj(text_obj, cRect)
        updateMatrixElement(cRect, state)
        
        rectLayer.draw()
    })

    //Update Drawdown
    window.ndarray.onDrawdownUpdate((value) => {
        //Get All Text Obj in DrawdownGroup
        var drawdownGroupItems = stage.find(node => {
            return node.getAncestors()[0].id() === 'drawdownGroup' 
                && node.getClassName() === 'Text'
        });

        drawdownGroupItems.forEach((element) => {
            let obj_id   = 'rect_' + element.id().toString()
            let cRect    = stage.find("."+obj_id)[0]
            
            var y = element.getAttr('y')/BUFFER
            var x = element.getAttr('x')/BUFFER
            if(element.text() !== value[y][x].toString()){
                //Passing (y,x)
                updateObj(element, cRect, value[y][x])
            }
        })        
    })

    var sendConfigBtn = document.getElementById('send-config-btn')
    sendConfigBtn.onclick = (event) => {
        //TODO: Send Threading Config Command
        //window.ndarray.multiplyMatrix()
    }
}

//Update Matrix
function updateMatrixElement(pRect, pState) {
    var row   = pRect.y()/BUFFER
    var col   = pRect.x()/BUFFER
    var group = pRect.getAncestors()[0].id()
    
    switch(group) {
        case 'threadingGroup':
            window.ndarray.updateMatrix(row, col, pState, 0)
            break;
        case 'tieUpGroup':
            window.ndarray.updateMatrix(row, col, pState, 1)
            break;
        case 'treadlingGroup':
            window.ndarray.updateMatrix(row, col, pState, 2)
            break;
        case 'drawdownGroup':
            window.ndarray.updateMatrix(row, col, pState, 3)
            break;
    }
}

//Toggle Rect & Text Obj
function toggleObj(pText, pRect) {
    var bool = null

    //Handle Click on Text
    if(pText.text() == '0') {
        bool = 1
        pText.text('1')
        pText.fill(calternate)
    } else if(pText.text() == '1') {
        bool = 0
        pText.text('0')
        pText.fill(cmain)
    }

    //Handle Click on Rect
    if (pRect.fill() == cmainFill) {
        pRect.fill(calternativeFill)
    } else if (pRect.fill() == calternativeFill) {
        pRect.fill(cmainFill);
    }

    return bool
}

//Manual Config Rect & Text Obj
function updateObj(pText, pRect, value) {
    //Handle Click on Text & Rect
    if(value === 0) {
        pText.text('0')
        pText.fill(cmain)
        pRect.fill(cmainFill)
    } else if(value === 1) {
        pText.text('1')
        pText.fill(calternate)
        pRect.fill(calternativeFill)
    }

    rectLayer.draw()
}

//Create Rectangle with Label
function createRectangle(i, x, y, group) {
    var name = "rect_" + i.toString()
    
    rect = new Konva.Rect({
        width: 25,
        height: 25,
        name: name,
        cornerRadius: 1,
        x: x*BUFFER,
        y: y*BUFFER,
        fill: cmainFill,
        stroke: cmain,
        strokeWidth: 1,
        zindex: 0
    })
    
    label = new Konva.Text({
        text:'0',
        id: i,
        x: x*BUFFER,
        y: y*BUFFER,
        fontSize: 18,
        fontFamily: 'Calibri',
        fill: cmain,
        width: 25,
        padding: 5,
        align: 'center',
        zindex: 10
    })

    group.add(rect)
    group.add(label)
}

//Read & Apply Shaft & Pedal Input
function configShaftsPedals() {
    var shaft_form = document.getElementById('shafts-input')
    var pedal_form = document.getElementById('pedals-input')

    num_shafts = parseInt(shaft_form.value)
    num_pedals = parseInt(pedal_form.value)

    stage.destroyChildren()
    drawWeaveDraft()
}

//Highlight Current Row to Weave
function highlightRow(pRow) {
    if(pRow == 1  && (select_row == null || select_row+1 > 19)) {
        select_row = 0
    } else if (pRow == -1 && (select_row == null || select_row-1 < 0)) {
        select_row = 19
    } else if (pRow == 1 && select_row+1 <= 19) {
        select_row++;
    } else if (pRow == -1 && select_row-1 >= 0) {
        select_row--;
    } else if (pRow == 0) {
        var row_form = document.getElementById('row-select-input')
        //console.log("blank entry", parseInt(row_form.value))
        select_row   = parseInt(row_form.value)
    }

    highlightGroup.destroyChildren()

    rect = new Konva.Rect({
        width: 25*COL_MAX,
        height: 25,
        cornerRadius: 1,
        x: 0*BUFFER,
        y: select_row*BUFFER,
        stroke: 'blue',
        strokeWidth: 3,
        zindex: 15
    })

    highlightGroup.add(rect)
}

function drawScrollBars() {
    var scrollLayers = new Konva.Layer();
    stage.add(scrollLayers);

    var verticalBar = new Konva.Rect({
        width: 10,
        height: 100,
        fill: 'grey',
        opacity: 0.8,
        x: stage.width() - PADDING - 10,
        y: PADDING,
        draggable: true,
        dragBoundFunc: function (pos) {
            pos.x = stage.width() - PADDING - 10;
            pos.y = Math.max(
            Math.min(pos.y, stage.height() - this.height() - PADDING),PADDING);
            return pos;
        },
    });

    verticalBar.on('dragmove', function () {
        // delta in %
        const availableHeight =
            stage.height() - PADDING * 2 - verticalBar.height();
        var delta = (verticalBar.y() - PADDING) / availableHeight;

        rectLayer.y(-(HEIGHT - stage.height()) * delta);
    });
    scrollLayers.add(verticalBar);

    var horizontalBar = new Konva.Rect({
    width: 100,
    height: 10,
    fill: 'grey',
    opacity: 0.8,
    x: PADDING,
    y: stage.height() - PADDING - 10,
    draggable: true,
    dragBoundFunc: function (pos) {
        pos.x = Math.max(
        Math.min(pos.x, stage.width() - this.width() - PADDING),PADDING);
        pos.y = stage.height() - PADDING - 10;
        return pos;
    },
    });

    scrollLayers.add(horizontalBar);

    horizontalBar.on('dragmove', function () {
    // delta in %
    const availableWidth =
        stage.width() - PADDING * 2 - horizontalBar.width();
    var delta = (horizontalBar.x() - PADDING) / availableWidth;

    rectLayer.x(-(WIDTH - stage.width()) * delta);
    });

    stage.on('wheel', function (e) {
        // prevent parent scrolling
        e.evt.preventDefault();
        const dx = e.evt.deltaX;
        const dy = e.evt.deltaY;

        const minX = -(WIDTH - stage.width());
        const maxX = 0;

        const x = Math.max(minX, Math.min(rectLayer.x() - dx, maxX));

        const minY = -(HEIGHT - stage.height());
        const maxY = 0;

        const y = Math.max(minY, Math.min(rectLayer.y() - dy, maxY));
        rectLayer.position({ x, y });

        const availableHeight =
          stage.height() - PADDING * 2 - verticalBar.height();
        const vy =
          (rectLayer.y() / (-HEIGHT + stage.height())) * availableHeight + PADDING;
        verticalBar.y(vy);

        const availableWidth =
          stage.width() - PADDING * 2 - horizontalBar.width();

        const hx =
          (rectLayer.x() / (-WIDTH + stage.width())) * availableWidth + PADDING;
        horizontalBar.x(hx);
      });
}

//Execute
initCanvas()