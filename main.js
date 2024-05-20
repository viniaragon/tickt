const patientNameInput = document.getElementById('patientNameInput');
const btnNormal = document.getElementById('btnNormal');
const btnPrioritario = document.getElementById('btnPrioritario');
const btnChamar = document.getElementById('btnChamar');
const waitingList = document.getElementById('waitingList');

let ticketNumber = 1;
let waitingPatients = [];

function addPatient(priority) {
    const name = patientNameInput.value.trim();
    if (name === '') return;

    const ticket = `${priority === 'normal' ? 'N' : 'P'}${ticketNumber}`;
    const patient = { ticket, name, priority };
    waitingPatients.push(patient);

    updateWaitingList();
    ticketNumber++;
    patientNameInput.value = '';
}

function updateWaitingList() {
    waitingList.innerHTML = '';
    waitingPatients.forEach(patient => {
        const li = document.createElement('li');
        li.classList.add(patient.priority);
        li.textContent
        const li = document.createElement('li');
        li.classList.add(patient.priority);
        li.textContent = `${patient.ticket} - ${patient.name}`;
        waitingList.appendChild(li);
    });
}

function chamarPaciente() {
    if (waitingPatients.length === 0) return;

    const calledPatient = waitingPatients.shift();
    updateWaitingList();

    sessionStorage.setItem('calledPatient', JSON.stringify(calledPatient));
    window.open('chamada.html', 'Chamada', 'width=400,height=300');
}

btnNormal.addEventListener('click', () => addPatient('normal'));
btnPrioritario.addEventListener('click', () => addPatient('prioritario'));
btnChamar.addEventListener('click', chamarPaciente);