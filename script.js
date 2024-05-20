document.querySelectorAll('.draggable').forEach(item => {
    item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData("shape", event.target.dataset.shape);
    });
});

const canvas = document.getElementById('canvas');
canvas.addEventListener('dragover', (event) => {
    event.preventDefault();
});

canvas.addEventListener('drop', (event) => {
    event.preventDefault();
    const shapeType = event.dataTransfer.getData("shape");
    const shape = createShape(shapeType);
    shape.style.left = event.offsetX + 'px';
    shape.style.top = event.offsetY + 'px';
    canvas.appendChild(shape);
    selectShape(shape);
});

function createShape(type) {
    const el = document.createElement('div');
    el.className = 'shape';
    switch (type) {
        case 'square':
            el.style.width = '100px';
            el.style.height = '100px';
            el.style.backgroundColor = 'red';
            break;
        case 'circle':
            el.style.width = '100px';
            el.style.height = '100px';
            el.style.backgroundColor = 'blue';
            el.style.borderRadius = '50%';
            break;
        case 'triangle':
            el.style.width = '0';
            el.style.height = '0';
            el.style.borderLeft = '50px solid transparent';
            el.style.borderRight = '50px solid transparent';
            el.style.borderBottom = '100px solid green';
            break;
    }
    el.draggable = true;
    el.addEventListener('dragstart', shapeDragStart);
    el.addEventListener('click', () => selectShape(el));
    return el;
}

let selectedShape = null;

function selectShape(shape) {
    if (selectedShape) {
        selectedShape.classList.remove('selected');
    }
    selectedShape = shape;
    shape.classList.add('selected');
    updatePropertiesPanel();
}

function updatePropertiesPanel() {
    if (selectedShape) {
        const rect = selectedShape.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        document.getElementById('width').value = rect.width.toFixed(2);
        document.getElementById('height').value = rect.height.toFixed(2);
        document.getElementById('position-x').value = ((selectedShape.offsetLeft / canvasRect.width) * 100).toFixed(2);
        document.getElementById('position-y').value = ((selectedShape.offsetTop / canvasRect.height) * 100).toFixed(2);
    }
}

function shapeDragStart(event) {
    event.dataTransfer.setData("text/plain", 'move');
    event.dataTransfer.setData("shape-id", event.target.dataset.id);
}

canvas.addEventListener('dragover', (event) => {
    event.preventDefault();
});

canvas.addEventListener('drop', (event) => {
    event.preventDefault();
    const shapeId = event.dataTransfer.getData("shape-id");
    if (shapeId) {
        const shape = document.querySelector(`[data-id="${shapeId}"]`);
        const canvasRect = canvas.getBoundingClientRect();
        shape.style.left = (event.clientX - canvasRect.left - (shape.offsetWidth / 2)) + 'px';
        shape.style.top = (event.clientY - canvasRect.top - (shape.offsetHeight / 2)) + 'px';
        updatePropertiesPanel();
    }
});

// Listen for changes in the properties panel
document.getElementById('properties-form').addEventListener('input', (event) => {
    if (selectedShape) {
        const rect = canvas.getBoundingClientRect();
        switch (event.target.id) {
            case 'width':
                selectedShape.style.width = event.target.value + 'px';
                break;
            case 'height':
                selectedShape.style.height = event.target.value + 'px';
                break;
            case 'position-x':
                selectedShape.style.left = (rect.width * (event.target.value / 100)) + 'px';
                break;
            case 'position-y':
                selectedShape.style.top = (rect.height * (event.target.value / 100)) + 'px';
                break;
        }
    }
});