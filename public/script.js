document.addEventListener("DOMContentLoaded", function() {
    const normalButton = document.getElementById('normalButton');
    const priorityButton = document.getElementById('priorityButton');
    const inputField = document.getElementById('inputField');
    const listPacientes = document.getElementById('listPacientes');
    const listContent = document.querySelector('.list-content');
    let selectedElement = null;

    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = function(event) {
        if (typeof event.data === 'string') {
            processMessage(event.data);
        } else {
            const reader = new FileReader();
            reader.onload = function() {
                processMessage(reader.result);
            };
            reader.readAsText(event.data);
        }
    };

    function processMessage(data) {
        const message = JSON.parse(data);
        switch (message.type) {
            case 'init':
                initializeList(message.data);
                break;
            case 'add':
                addListItem(message.item, message.priority, false);
                break;
            case 'select':
                selectListItem(message.index, false);
                break;
            case 'deselect':
                deselectListItem(false);
                break;
        }
    }

    normalButton.addEventListener('click', function() {
        addItem('normal');
    });

    priorityButton.addEventListener('click', function() {
        addItem('prioridade');
    });

    function addItem(priority) {
        const inputValue = inputField.value.trim();
        if (inputValue === '') {
            alert('Por favor, insira um valor.');
            return;
        }

        addListItem(inputValue, priority, true);
        inputField.value = '';
    }

    function addListItem(text, priority, sendToServer) {
        const listItem = document.createElement('li');
        listItem.textContent = text;
        listItem.setAttribute('class', priority);
        listItem.addEventListener('click', toggleSelect);
        listPacientes.appendChild(listItem);

        if (sendToServer) {
            ws.send(JSON.stringify({ type: 'add', item: text, priority }));
        }
    }

    function toggleSelect(event) {
        const listItem = event.target;

        if (selectedElement) {
            selectedElement.classList.remove('selected');
            deselectListItem(true);
        }

        if (selectedElement === listItem) {
            selectedElement = null;
        } else {
            listItem.classList.add('selected');
            selectedElement = listItem;
            selectListItem(Array.from(listPacientes.children).indexOf(listItem), true);
        }
        event.stopPropagation(); // Impede que o evento clique se propague para o div .list-content
    }

    function selectListItem(index, sendToServer) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedElement = listPacientes.children[index];
        selectedElement.classList.add('selected');

        if (sendToServer) {
            ws.send(JSON.stringify({ type: 'select', index }));
        }
    }

    function deselectListItem(sendToServer) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;

            if (sendToServer) {
                ws.send(JSON.stringify({ type: 'deselect' }));
            }
        }
    }

    function initializeList(data) {
        data.items.forEach((item) => {
            addListItem(item.text, item.priority, false);
        });
        if (data.selected !== null) {
            selectListItem(data.selected, false);
        }
    }

    listContent.addEventListener('click', function(event) {
        if (!event.target.matches('li')) {
            deselectListItem(true);
        }
    });

    // Inicializa o SortableJS
    new Sortable(listPacientes, {
        animation: 150,
        ghostClass: 'sortable-ghost'
    });

    // Adiciona o evento de clique aos itens já existentes na lista (se necessário)
    const existingItems = listPacientes.getElementsByTagName('li');
    for (let item of existingItems) {
        item.addEventListener('click', toggleSelect);
    }
});
