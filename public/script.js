document.addEventListener("DOMContentLoaded", function() {
    // Seleção de elementos do DOM
    const normalButton = document.getElementById('normalButton');
    const priorityButton = document.getElementById('priorityButton');
    const resetButton = document.getElementById('resetButton');
    const inputField = document.getElementById('inputField');
    const listPacientes = document.getElementById('listPacientes');
    const listContent = document.querySelector('.list-content');
    const deletPatientButton = document.getElementById('deletPatientButton');
    const callPatientButton = document.querySelector('.call-patient-button');
    let selectedElement = null;
    
    // Contadores para diferentes tipos de pacientes
    let contadorOrdenGeral = 0;
    let contadorOrdenNormal = 0;
    let contadorOrdemPriority = 0;

    // Função para conectar ao WebSocket
    function connectWebSocket() {
        const ws = new WebSocket('wss://' + window.location.host); // Use wss:// para conexão segura
    
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
    
    // Inicializar WebSocket
    let ws = connectWebSocket();

    // Função para processar mensagens recebidas via WebSocket
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

    // Adicionar eventos aos botões
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

    deletPatientButton.addEventListener('click', function() {
        if (selectedElement) {
            const itemText = selectedElement.textContent;
            selectedElement.remove();
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'remove', item: itemText }));
            } else {
                console.log('WebSocket não está aberto. Tentando reconectar...');
                ws = connectWebSocket();
                ws.send(JSON.stringify({ type: 'remove', item: itemText }));
            }
            selectedElement = null; // Resetar o elemento selecionado
        } else {
            alert('Nenhum paciente selecionado para exclusão.');
        }
    });

    callPatientButton.addEventListener('click', function() {
        if (selectedElement) {
            const selectedPatient = selectedElement.textContent;
            const welcomeMessage = "Por favor, dirija-se à sala 1"; // Mensagem de boas-vindas fixa
            
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'call', patient: selectedPatient, message: welcomeMessage }));
            } else {
                console.log('WebSocket não está aberto. Tentando reconectar...');
                ws = connectWebSocket();
                ws.send(JSON.stringify({ type: 'call', patient: selectedPatient, message: welcomeMessage }));
            }
        } else {
            alert('Nenhum paciente selecionado para chamar.');
        }
    });

    // Função para adicionar item à lista
    function addItem(priority) {
        const inputValue = inputField.value.trim();
        if (inputValue === '') {
            alert('Por favor, insira um valor.');
            return;
        }

        let contadorAtual;
        let prefixo;
        if (priority === 'normal') {
            contadorOrdenNormal++;
            contadorAtual = contadorOrdenNormal;
            prefixo = 'N';
        } else {
            contadorOrdemPriority++;
            contadorAtual = contadorOrdemPriority;
            prefixo = 'P';
        }

        contadorOrdenGeral++;
        const itemText = `${contadorOrdenGeral} ${prefixo}${contadorAtual} ${inputValue}`;

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'add', item: itemText, priority }));
        } else {
            console.log('WebSocket não está aberto. Tentando reconectar...');
            ws = connectWebSocket();
        }
        inputField.value = '';
    }

    // Função para adicionar item na interface da lista
    function addListItem(text, priority) {
        const listItem = document.createElement('li');
        listItem.textContent = text;
        listItem.setAttribute('class', priority);
        listItem.addEventListener('click', toggleSelect);
        listPacientes.appendChild(listItem);
    }

    // Função para alternar a seleção de itens na lista
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

    // Função para selecionar item na lista
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

    // Função para deselecionar item na lista
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

    // Função para inicializar a lista com dados recebidos via WebSocket
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

    // Função para atualizar a lista com novos dados
    function updateList(data) {
        listPacientes.innerHTML = '';
        selectedElement = null;  // Resetar o elemento selecionado
    
        // Resetar contadores
        contadorOrdenGeral = 0;
        contadorOrdenNormal = 0;
        contadorOrdemPriority = 0;
    
        data.items.forEach((item) => {
            contadorOrdenGeral++;
            let prefixo, contadorAtual;
    
            if (item.priority.includes('normal')) {
                contadorOrdenNormal++;
                contadorAtual = contadorOrdenNormal;
                prefixo = 'N';
            } else {
                contadorOrdemPriority++;
                contadorAtual = contadorOrdemPriority;
                prefixo = 'P';
            }
    
            const itemText = `${contadorOrdenGeral} ${prefixo}${contadorAtual} ${item.text.split(' ').slice(2).join(' ')}`;
            item.priority = item.priority.replace(' selected', '');
            addListItem(itemText, item.priority);
        });
    
        if (data.selected !== null && data.selected < data.items.length) {
            selectListItem(data.selected, false);
        } else {
            deselectListItem(false);
        }
    }

    // Função para resetar a lista
    function resetList() {
        listPacientes.innerHTML = '';
        selectedElement = null;
        // Resetar os contadores
        contadorOrdenGeral = 0;
        contadorOrdenNormal = 0;
        contadorOrdemPriority = 0;
    }

    // Função para atualizar seleção no servidor
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
    
                // Recalcula os índices após a reorganização
                recalculateIndices(order);
    
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
    
    // Função para recalcular índices dos itens após a reorganização
    function recalculateIndices(items) {
        let contadorOrdenGeral = 0;
        let contadorOrdenNormal = 0;
        let contadorOrdemPriority = 0;
    
        items.forEach((item, index) => {
            contadorOrdenGeral++;
            let prefixo, contadorAtual;
    
            if (item.priority.includes('normal')) {
                contadorOrdenNormal++;
                contadorAtual = contadorOrdenNormal;
                prefixo = 'N';
            } else {
                contadorOrdemPriority++;
                contadorAtual = contadorOrdemPriority;
                prefixo = 'P';
            }
    
            item.text = `${contadorOrdenGeral} ${prefixo}${contadorAtual} ${item.text.split(' ').slice(2).join(' ')}`;
            // Remove 'selected' class if present
            item.priority = item.priority.replace(' selected', '');
        });
    
        // Atualiza os itens na lista
        listPacientes.innerHTML = '';
        items.forEach((item) => {
            addListItem(item.text, item.priority);
        });
    }

    // Eventos de arrastar e soltar para monitorar o início e fim do arrasto
    listContent.addEventListener('dragstart', function(event) {
        event.dataTransfer.setData('text/plain', event.target.textContent);
    });

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
