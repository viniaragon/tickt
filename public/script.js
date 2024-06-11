document.addEventListener("DOMContentLoaded", function() {
    const normalButton = document.getElementById('normalButton');
    const priorityButton = document.getElementById('priorityButton');
    const inputField = document.getElementById('inputField');
    const listPacientes = document.getElementById('listPacientes');
    const listContent = document.querySelector('.list-content');
    let selectedElement = null;
    let isLocalChange = false;

    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = function(event) {
        const reader = new FileReader();
        reader.onload = function() {
            const message = JSON.parse(reader.result);
            if (message.origin !== 'local') {
                switch (message.type) {
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
        };
        reader.readAsText(event.data);
    };

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

        isLocalChange = true;
        addListItem(inputValue, priority, true);
        inputField.value = '';
    }

    function addListItem(text, priority, sendToServer) {
        const listItem = document.createElement('li');
        listItem.textContent = text;
        listItem.setAttribute('class', priority);
        listItem.addEventListener('click', toggleSelect);
        listPacientes.appendChild(listItem);

        if (sendToServer && isLocalChange) {
            isLocalChange = false;
            ws.send(JSON.stringify({ type: 'add', item: text, priority, origin: 'local' }));
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
            ws.send(JSON.stringify({ type: 'select', index, origin: 'local' }));
        }
    }

    function deselectListItem(sendToServer) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;

            if (sendToServer) {
                ws.send(JSON.stringify({ type: 'deselect', origin: 'local' }));
            }
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
