document.addEventListener("DOMContentLoaded", function() {
    const normalButton = document.getElementById('normalButton');
    const priorityButton = document.getElementById('priorityButton');
    const inputField = document.getElementById('inputField');
    const listPacientes = document.getElementById('listPacientes');
    const listContent = document.querySelector('.list-content');
    let selectedElement = null;

    function connectWebSocket() {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = function() {
            console.log('Conexão WebSocket estabelecida.');
        };

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

        ws.onclose = function() {
            console.log('Conexão WebSocket fechada. Tentando reconectar em 1 segundo...');
            setTimeout(connectWebSocket, 1000);
        };

        ws.onerror = function(error) {
            console.log('Erro no WebSocket:', error);
            ws.close();
        };

        return ws;
    }

    let ws = connectWebSocket();

    function processMessage(data) {
        const message = JSON.parse(data);
        switch (message.type) {
            case 'init':
                initializeList(message.data);
                break;
            case 'update':
                updateList(message.data);
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

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'add', item: inputValue, priority }));
        } else {
            console.log('WebSocket não está aberto. Tentando reconectar...');
            ws = connectWebSocket();
        }
        inputField.value = '';
    }

    function addListItem(text, priority) {
        const listItem = document.createElement('li');
        listItem.textContent = text;
        listItem.setAttribute('class', priority);
        listItem.addEventListener('click', toggleSelect);
        listPacientes.appendChild(listItem);
    }

    function toggleSelect(event) {
        const listItem = event.target;

        if (selectedElement) {
            selectedElement.classList.remove('selected');
            if (selectedElement === listItem) {
                selectedElement = null;
                deselectListItem(true);
                return;
            }
        }

        listItem.classList.add('selected');
        selectedElement = listItem;
        selectListItem(Array.from(listPacientes.children).indexOf(listItem), true);
        event.stopPropagation(); // Impede que o evento clique se propague para o div .list-content
    }

    function selectListItem(index, sendToServer) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        selectedElement = listPacientes.children[index];
        selectedElement.classList.add('selected');

        if (sendToServer) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'select', index }));
            } else {
                console.log('WebSocket não está aberto. Tentando reconectar...');
                ws = connectWebSocket();
            }
        }
    }

    function deselectListItem(sendToServer) {
        if (selectedElement) {
            selectedElement.classList.remove('selected');
            selectedElement = null;

            if (sendToServer) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'deselect' }));
                } else {
                    console.log('WebSocket não está aberto. Tentando reconectar...');
                    ws = connectWebSocket();
                }
            }
        }
    }

    function initializeList(data) {
        // Limpar lista existente antes de inicializar
        listPacientes.innerHTML = '';
        data.items.forEach((item) => {
            addListItem(item.text, item.priority);
        });
        if (data.selected !== null) {
            selectListItem(data.selected, false);
        }
    }

    function updateList(data) {
        // Limpar lista existente antes de atualizar
        listPacientes.innerHTML = '';
        data.items.forEach((item) => {
            addListItem(item.text, item.priority);
        });
        if (data.selected !== null) {
            selectListItem(data.selected, false);
        }
    }

    // Inicializa o SortableJS com o evento de atualização da ordem
    new Sortable(listPacientes, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function(evt) {
            const order = Array.from(listPacientes.children).map((item) => {
                return {
                    text: item.textContent,
                    priority: item.getAttribute('class')
                };
            });

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'reorder', items: order }));
            } else {
                console.log('WebSocket não está aberto. Tentando reconectar...');
                ws = connectWebSocket();
            }
        }
    });

    listContent.addEventListener('click', function(event) {
        if (!event.target.matches('li')) {
            deselectListItem(true);
        }
    });

    // Adiciona o evento de clique aos itens já existentes na lista (se necessário)
    const existingItems = listPacientes.getElementsByTagName('li');
    for (let item of existingItems) {
        item.addEventListener('click', toggleSelect);
    }
});
