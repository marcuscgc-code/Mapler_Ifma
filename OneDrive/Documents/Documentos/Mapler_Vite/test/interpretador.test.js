import { describe, it, expect, vi } from 'vitest';
import { Interpretador } from '../Interpretador.js';
import { AnalisadorLexico } from '../lexico.js';
import { AnalisadorSintatico } from '../sintatico.js';
import { EventosService } from '../eventosService.js';

// Função auxiliar para não repetir código. Ela executa o pipeline completo.
async function executarCodigo(codigo) {
    const mockCallback = vi.fn(); // Cria um "espião" para observar os eventos
    const eventos = new EventosService(mockCallback);
    const lexico = new AnalisadorLexico(eventos);
    const sintatico = new AnalisadorSintatico(eventos);
    const interpretador = new Interpretador(eventos);

    const tokens = lexico.scanTokens(codigo);
    const ast = sintatico.parse(tokens);
    
    // Como o 'interpretar' agora é assíncrono, precisamos usar 'await'
    await interpretador.interpretar(ast);

    // Retornamos o espião para que o teste possa verificar o que aconteceu
    return mockCallback;
}

describe('Interpretador - Banco de Testes Automatizado', () => {

    it('Teste 1: Deve lidar com tipos de dados e operações corretamente', async () => {
        const codigo = `
            variaveis
                resultado: inteiro;
            inicio
                resultado <- 5 + 2 * 3; // = 11
                escrever "Resultado: ", resultado;
            fim.
        `;
        const mockSaida = await executarCodigo(codigo);
        expect(mockSaida).toHaveBeenCalledWith("ESCREVER", "Resultado: 11");
    });

    it('Teste 2: Deve executar a estrutura SE/SENAO corretamente', async () => {
        const codigo = `
            variaveis media: real; inicio
            media <- 5.0;
            se media >= 7.0 entao
                escrever "APROVADO";
            senao
                escrever "REPROVADO";
            fim se;
        `;
        const mockSaida = await executarCodigo(codigo);
        expect(mockSaida).toHaveBeenCalledWith("ESCREVER", "REPROVADO");
    });

    it('Teste 3: Deve executar o laço ENQUANTO corretamente', async () => {
        const codigo = `
            variaveis contador: inteiro; inicio
            contador <- 1;
            enquanto contador <= 3 faca
                escrever "C: ", contador;
                contador <- contador + 1;
            fim enquanto;
        `;
        const mockSaida = await executarCodigo(codigo);
        expect(mockSaida).toHaveBeenCalledTimes(3);
        expect(mockSaida).toHaveBeenNthCalledWith(1, "ESCREVER", "C: 1");
        expect(mockSaida).toHaveBeenNthCalledWith(2, "ESCREVER", "C: 2");
        expect(mockSaida).toHaveBeenNthCalledWith(3, "ESCREVER", "C: 3");
    });

    it('Teste 6: Deve atribuir e acessar vetores (1D) corretamente', async () => {
        const codigo = `
            variaveis notas: vetor[4] de real; i: inteiro; inicio
            para i de 0 ate 3 faca
                notas[i] <- i + 5.0;
            fim para;
            escrever notas[2]; // Deve ser 2 + 5.0 = 7
        `;
        const mockSaida = await executarCodigo(codigo);
        expect(mockSaida).toHaveBeenCalledWith("ESCREVER", 7);
    });

});