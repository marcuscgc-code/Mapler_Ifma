import { describe, it, expect } from 'vitest';
import { AnalisadorLexico } from '../lexico.js';
import { TiposToken } from '../tiposToken.js';
import { EventosService } from '../eventosService.js';
describe('AnalisadorLexico', () => {
  
  it('deve tokenizar uma sequencia simples de palavras-chave corretamente', () => {
    // Arrange
    const eventos = new EventosService();
    const lexico = new AnalisadorLexico(eventos);
    const codigo = 'variaveis inicio fim;';
    
    // Act
    const tokens = lexico.scanTokens(codigo);

    // Assert: Verificamos o resultado CORRETO
    // Esperamos 4 tokens do código + 1 EOF = 5
    expect(tokens).toHaveLength(5); 
    
    // Agora verificamos a ordem correta dos tokens
    expect(tokens[0].tipo).toBe(TiposToken.VARIAVEIS);
    expect(tokens[1].tipo).toBe(TiposToken.INICIO);
    expect(tokens[2].tipo).toBe(TiposToken.FIM); // Corrigido
    expect(tokens[3].tipo).toBe(TiposToken.PONTO_VIRGULA); // Corrigido
    expect(tokens[4].tipo).toBe(TiposToken.EOF);
  });

});