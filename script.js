// Array para armazenar os pacientes
let listaPacientes = [];
let proximoTicket = 1;

// Elementos da página principal
const nomePacienteInput = document.getElementById('nomePaciente');
const botaoNormal = document.getElementById('botaoNormal');
const botaoPrioritario = document.getElementById('botaoPrioritario');
const listaPacientesUl = document.getElementById('listaPacientes');
const botaoChamar = document.getElementById('botaoChamar');

// Elemento da página de chamadas
const chamadaAtualDiv = document.getElementById('chamadaAtual');

// Funções para adicionar pacientes
function adicionarPaciente(tipo) {
    const nome = nomePacienteInput.value.trim();
    if (nome === '') return;

    const paciente = {
        ticket: proximoTicket++,
        nome,
        tipo
    };

    listaPacientes.push(paciente);
    atualizarLista();
    nomePacienteInput.value = '';
}

function atualizarLista() {
    listaPacientesUl.innerHTML = '';

    listaPacientes.forEach((paciente, index) => {
        const li = document.createElement('li');
        li.textContent = `${paciente.tipo}${paciente.ticket} - ${paciente.nome}`;
        li.className = paciente.tipo;
        listaPacientesUl.appendChild(li);
    });
}

function chamarPaciente() {
    if (listaPacientes.length === 0) return;

    const pacienteAtual = listaPacientes.shift();
    atualizarLista();
    enviarParaChamada(pacienteAtual);
}

function enviarParaChamada(paciente) {
    if (chamadaAtualDiv) {
        chamadaAtualDiv.textContent = `${paciente.tipo}${paciente.ticket} - ${paciente.nome}`;
        falar(`Paciente ${paciente.tipo}${paciente.ticket} - ${paciente.nome}`);
    } else {
        sessionStorage.setItem('chamadaAtual', JSON.stringify(paciente));
        window.open('chamada.html', '_blank');
    }
}

function falar(texto) {
    const msg = new SpeechSynthesisUtterance(texto);
    window.speechSynthesis.speak(msg);
}

// Eventos
botaoNormal.addEventListener('click', () => adicionarPaciente('N'));
botaoPrioritario.addEventListener('click', () => adicionarPaciente('P'));
botaoChamar.addEventListener('click', chamarPaciente);

// Carregar chamada atual na página de chamadas
if (chamadaAtualDiv) {
    const pacienteAtual = JSON.parse(sessionStorage.getItem('chamadaAtual'));
    if (pacienteAtual) {
        chamadaAtualDiv.textContent = `${pacienteAtual.tipo}${pacienteAtual.ticket} - ${pacienteAtual.nome}`;
        falar(`Paciente ${pacienteAtual.tipo}${pacienteAtual.ticket} - ${pacienteAtual.nome}`);
    }
}