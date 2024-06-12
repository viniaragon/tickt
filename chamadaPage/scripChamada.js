window.onload = function() {
    const datetimeElement = document.querySelector('.datetime');
    setInterval(() => {
        const now = new Date();
        datetimeElement.textContent = now.toLocaleString();
    }, 1000);
};

document.addEventListener("DOMContentLoaded", function() {
    const patientNameElement = document.querySelector('.patient-name');
    const welcomeMessageElement = document.querySelector('.welcome-message');
    const callPatientButton = document.getElementById('callPatient');

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
        if (message.type === 'call') {
            updateCalledPatient(message.patient, message.message);
            simulateClick(callPatientButton);
        }
    }

    function updateCalledPatient(patient, message) {
        patientNameElement.textContent = patient;
        welcomeMessageElement.textContent = message;
    }

    function simulateClick(button) {
        if (button) {
            button.click();
        }
    }

    callPatientButton.addEventListener('click', function() {
        const patientName = patientNameElement.textContent;
        const welcomeMessage = welcomeMessageElement.textContent;
        const utterance = new SpeechSynthesisUtterance(`${patientName}. ${welcomeMessage}`);
        speechSynthesis.speak(utterance);
    });
});
