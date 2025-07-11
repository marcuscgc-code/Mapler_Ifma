// Arquivo: chamavel.js

import { Ambiente } from "./ambiente.js";

/**
 * Representa um objeto "chamável", como um módulo ou função.
 */
export class ModuloChamavel {
    // O construtor guarda a "planta" do módulo (o nó da AST)
    constructor(declaracao) {
        this.declaracao = declaracao;
    }

    // O método 'chamar' é onde a mágica do escopo acontece.
    async chamar(interpretador, ambientePai) {
        // 1. Cria um novo ambiente específico para a execução deste módulo.
        const ambienteLocal = new Ambiente(ambientePai);

        // 2. Pede ao interpretador para executar o corpo do módulo DENTRO deste novo ambiente.
        await interpretador.executarBloco(this.declaracao.corpo, ambienteLocal);
    }
}