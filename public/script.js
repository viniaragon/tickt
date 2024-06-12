document.addEventListener("DOMContentLoaded", function() {
    const normalButton = document.getElementById('normalButton');
    const priorityButton = document.getElementById('priorityButton');
    const resetButton = document.getElementById('resetButton');
    const inputField = document.getElementById('inputField');
    const listPacientes = document.getElementById('listPacientes');
    const listContent = document.querySelector('.list-content');
    let selectedElement = null;

    function connectWebSocket() {
        const ws = new WebSocket('ws://192.168.0.4:8080'); // Substitua <IP_DA_MAQUINA> pelo IP da sua máquina
    
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
            case 'reset':
                resetList();
                break;
            case 'remove':
                deselectListItem(false);
                updateList(message.data);
                break;
            case 'reorder':
                deselectListItem(false);
                updateList(message.data);
                break;
        }
    }

    normalButton.addEventListener('click', function() {
        addItem('normal');
    });

    priorityButton.addEventListener('click', function() {
        addItem('prioridade');
    });

    resetButton.addEventListener('click', function() {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'reset' }));
        } else {
            console.log('WebSocket não está aberto. Tentando reconectar...');
            ws = connectWebSocket();
        }
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
        if (selectedElement) {
            selectedElement.classList.add('selected');
        }

        if (sendToServer) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'select', index }));
            } else {
                console.log('WebSocket não está aberto. Tentando reconectar...');
                ws = connectWebSocket();
                ws.send(JSON.stringify({ type: 'select', index }));
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
                    ws.send(JSON.stringify({ type: 'deselect' }));
                }
            }
        }
    }

    function initializeList(data) {
        // Limpar lista existente antes de inicializar
        listPacientes.innerHTML = '';
        selectedElement = null;  // Resetar o elemento selecionado

        data.items.forEach((item) => {
            addListItem(item.text, item.priority);
        });

        if (data.selected !== null && data.selected < data.items.length) {
            selectListItem(data.selected, false);
        } else {
            deselectListItem(false);
        }
    }

    function updateList(data) {
        // Limpar lista existente antes de atualizar
        listPacientes.innerHTML = '';
        selectedElement = null;  // Resetar o elemento selecionado

        data.items.forEach((item) => {
            addListItem(item.text, item.priority);
        });

        if (data.selected !== null && data.selected < data.items.length) {
            selectListItem(data.selected, false);
        } else {
            deselectListItem(false);
        }
    }

    function resetList() {
        listPacientes.innerHTML = '';
        selectedElement = null;
    }

    function updateSelectionOnServer(index) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'select', index }));
        } else {
            console.log('WebSocket não está aberto. Tentando reconectar...');
            ws = connectWebSocket();
            ws.send(JSON.stringify({ type: 'select', index }));
        }
    }

    // Inicializa o SortableJS com os eventos de atualização e remoção
    new Sortable(listPacientes, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function(evt) {
            const itemRect = evt.item.getBoundingClientRect();
            const listRect = listContent.getBoundingClientRect();
            const margin = 10; // Margem de erro para considerar o item fora do contêiner
    
            // Verifica se o item está fora do contêiner .list-content com margem de erro
            if (
                itemRect.top < listRect.top - margin ||
                itemRect.left < listRect.left - margin ||
                itemRect.bottom > listRect.bottom + margin ||
                itemRect.right > listRect.right + margin
            ) {
                const itemText = evt.item.textContent;
                evt.item.remove();
    
                deselectListItem(false); // Deseleciona o item antes de removê-lo
    
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'remove', item: itemText }));
                } else {
                    console.log('WebSocket não está aberto. Tentando reconectar...');
                    ws = connectWebSocket();
                    ws.send(JSON.stringify({ type: 'remove', item: itemText }));
                }
            } else {
                const order = Array.from(listPacientes.children).map((item, index) => {
                    return {
                        text: item.textContent,
                        priority: item.className
                    };
                });
    
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'reorder', items: order }));
                } else {
                    console.log('WebSocket não está aberto. Tentando reconectar...');
                    ws = connectWebSocket();
                    ws.send(JSON.stringify({ type: 'reorder', items: order }));
                }
    
                // Atualiza a seleção no cliente e servidor
                const selectedIndex = Array.from(listPacientes.children).indexOf(selectedElement);
                if (selectedIndex !== -1) {
                    updateSelectionOnServer(selectedIndex);
                }
            }
        }
    });

    // Evento de arrastar para monitorar o início do arrasto
    listContent.addEventListener('dragstart', function(event) {
        event.dataTransfer.setData('text/plain', event.target.textContent);
    });

    // Evento de soltar para detectar se o item foi solto fora do contêiner
    document.addEventListener('drop', function(event) {
        event.preventDefault();
        const listContentRect = listContent.getBoundingClientRect();

        // Verifica se o item foi solto fora do contêiner
        if (
            event.clientX < listContentRect.left ||
            event.clientX > listContentRect.right ||
            event.clientY < listContentRect.top ||
            event.clientY > listContentRect.bottom
        ) {
            const itemText = event.dataTransfer.getData('text/plain');
            const items = Array.from(listPacientes.children);
            const itemToRemove = items.find(item => item.textContent === itemText);
            
            if (itemToRemove) {
                console.log('Item solto fora da lista, removendo:', itemToRemove.textContent);
                itemToRemove.remove();

                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'remove', item: itemText }));
                } else {
                    console.log('WebSocket não está aberto. Tentando reconectar...');
                    ws = connectWebSocket();
                    ws.send(JSON.stringify({ type: 'remove', item: itemText }));
                }
            }
        }
    });

    document.addEventListener('dragover', function(event) {
        event.preventDefault();
    });

    // Adiciona o evento de clique aos itens já existentes na lista (se necessário)
    const existingItems = listPacientes.getElementsByTagName('li');
    for (let item of existingItems) {
        item.addEventListener('click', toggleSelect);
    }
});
