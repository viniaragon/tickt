const calledPatientElement = document.getElementById('calledPatient');

function announcePatient(patient) {
    const utterance = new SpeechSynthesisUtterance(`${patient.ticket} - ${patient.name}`);
    speechSynthesis.speak(utterance);
}

function displayCalledPatient() {
    const calledPatient = JSON.parse(sessionStorage.getItem('calledPatient'));
    if (calledPatient) {
        calledPatientElement.textContent = `${calledPatient.ticket} - ${calledPatient.name}`;
        announcePatient(calledPatient);
    }
}

displayCalledPatient();