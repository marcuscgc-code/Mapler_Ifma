// main.js (VERSÃO DE DEPURAÇÃO)

import { AnalisadorLexico } from './lexico.js';
import { AnalisadorSintatico } from './sintatico.js';
import { EventosService } from './eventosService.js';
import { Interpretador } from './Interpretador.js';

window.astGerado = null;
window.interpretadorAtual = null;

const eventosService = new EventosService((tipo, mensagem) => {
  const consoleDiv = document.getElementById('saidaConsole');

  if (tipo === "ESCREVER") {
    consoleDiv.innerHTML += mensagem + "<br>";
  } else if (tipo === "ERRO") {
    console.error("ERRO NO EVENTO:", mensagem);
    consoleDiv.innerHTML += `<span style="color: red;">${mensagem}</span><br>`;
  } else if (tipo === "INPUT_SOLICITADO") {
    console.log("[main.js] Evento INPUT_SOLICITADO recebido. Abrindo prompt...");
    const userInput = prompt("Digite um valor:");
    console.log(`[main.js] Usuário digitou: '${userInput}'. Verificando interpretador...`);
    
    if (window.interpretadorAtual && typeof window.interpretadorAtual.resolverInput === 'function') {
      console.log("[main.js] Interpretador encontrado. Chamando resolverInput...");
      window.interpretadorAtual.resolverInput(userInput);
      console.log("[main.js] resolverInput chamado com sucesso.");
    } else {
      console.error("[main.js] ERRO: Nao foi possivel encontrar o interpretador ou a funcao resolverInput.");
    }
  }
});

const lexico = new AnalisadorLexico(eventosService);
const sintatico = new AnalisadorSintatico(eventosService);

window.interpretar = function interpretar() {
  window.astGerado = null;
  const editor = document.getElementById('codigoPortugol');
  const saida = document.getElementById('saida');
  const consoleDiv = document.getElementById('saidaConsole');

  saida.textContent = '';
  consoleDiv.innerHTML = '';

  try {
    const tokens = lexico.scanTokens(editor.value);
    const ast = sintatico.parse(tokens);
    if (!ast) {
        saida.textContent = 'Erro de sintaxe. Verifique o console de saida.';
        return;
    }
    window.astGerado = ast;
    saida.textContent = JSON.stringify(ast, null, 2);
  } catch (e) {
    saida.textContent = `Erro inesperado durante a analise: ${e.message}`;
  }
};

document.getElementById('interpretarBtn').addEventListener('click', () => {
  window.interpretar();
});

document.getElementById('executarBtn').addEventListener('click', async () => {
  if (!window.astGerado) {
    alert('AST não gerada! Primeiro clique em Interpretar.');
    return;
  }
  document.getElementById('saidaConsole').innerHTML = '';
  window.interpretadorAtual = new Interpretador(eventosService);
  
  try {
    console.log("[main.js] Iniciando a interpretação...");
    await window.interpretadorAtual.interpretar(window.astGerado);
    console.log("[main.js] Interpretação concluída.");
  } catch (e) {
      eventosService.notificar("ERRO", e.message);
  } finally {
      console.log("[main.js] Bloco finally: limpando interpretadorAtual.");
      window.interpretadorAtual = null;
  }
});