document.addEventListener("DOMContentLoaded", function() {
    const normalButton = document.getElementById('normalButton');
    const priorityButton = document.getElementById('priorityButton');
    const inputField = document.getElementById('inputField');
    const listPacientes = document.getElementById('listPacientes');
    const listContent = document.querySelector('.list-content');
    let selectedElement = null;

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

        const listItem = document.createElement('li');
        listItem.textContent = inputValue;
        listItem.setAttribute('class', priority);
        listItem.addEventListener('click', toggleSelect);

        listPacientes.appendChild(listItem);
        inputField.value = '';
    }

    function toggleSelect(event) {
        const listItem = event.target;

        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }

        if (selectedElement === listItem) {
            selectedElement = null;
        } else {
            listItem.classList.add('selected');
            selectedElement = listItem;
        }
        event.stopPropagation(); // Impede que o evento clique se propague para o div .list-content
    }

    listContent.addEventListener('click', function(event) {
        if (!event.target.matches('li')) {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
            }
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
