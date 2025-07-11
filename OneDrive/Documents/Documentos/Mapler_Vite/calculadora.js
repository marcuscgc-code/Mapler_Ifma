function checarOperandosNumericos(operador, esquerda, direita) {
    if (typeof esquerda !== 'number' || typeof direita !== 'number') {
        throw new Error(`Erro de tipo: O operador '${operador}' exige operandos numericos.`);
    }
}

/**
 * Avalia uma expressão binária (com dois operandos).
 * @param {object} expr O nó da AST para a expressão binária. Contém `esquerda`, `direita` e `operador`.
 * @returns O resultado da operação.
 */
export function avaliarBinaria(expr) {
    const { operador, esquerda, direita } = expr;

    switch (operador.tipo) {
        case "MAIS":
            // Permite soma de números OU concatenação, mas não misturado.
            if (typeof esquerda === 'number' && typeof direita === 'number') {
                return esquerda + direita;
            }
            if (typeof esquerda === 'string' || typeof direita === 'string') {
                return String(esquerda) + String(direita);
            }
            throw new Error("Operador '+' so pode ser usado com dois numeros ou duas cadeias.");

        case "MENOS":
            checarOperandosNumericos(operador.lexema, esquerda, direita);
            return esquerda - direita;
        case "ASTERISCO":
            checarOperandosNumericos(operador.lexema, esquerda, direita);
            return esquerda * direita;
        case "BARRA":
            checarOperandosNumericos(operador.lexema, esquerda, direita);
            if (direita === 0) {
                throw new Error("Erro: Divisao por zero.");
            }
            return esquerda / direita;

        // Comparações
        case "IGUAL":
            return esquerda === direita;
        case "DIFERENTE":
            return esquerda !== direita;
        case "MAIOR_QUE":
            checarOperandosNumericos(operador.lexema, esquerda, direita);
            return esquerda > direita;
        case "MENOR_QUE":
            checarOperandosNumericos(operador.lexema, esquerda, direita);
            return esquerda < direita;
        case "MAIOR_IGUAL":
            checarOperandosNumericos(operador.lexema, esquerda, direita);
            return esquerda >= direita;
        case "MENOR_IGUAL":
            checarOperandosNumericos(operador.lexema, esquerda, direita);
            return esquerda <= direita;
        
        default:
            throw new Error(`Operador binario desconhecido: ${operador.tipo}`);
    }
}

/**
 * Avalia uma expressão unária (com um operando).
 * @param {object} expr O nó da AST para a expressão unária.
 * @returns O resultado da operação.
 */
export function avaliarUnaria(expr) {
    const { operador, direita } = expr;
    
    switch (operador.tipo) {
        case 'MENOS':
            if (typeof direita !== 'number') {
                throw new Error("Erro de tipo: Operador '-' so pode ser usado com numeros.");
            }
            return -direita;
        case 'NAO':
             // A negação funciona com qualquer valor (lógica "truthy"/"falsy" do JS)
            return !direita;
        default:
            throw new Error(`Operador unario desconhecido: ${operador.tipo}`);
    }
}