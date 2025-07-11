import { describe, it, expect } from 'vitest';
import { AnalisadorLexico } from '../lexico.js';
import { AnalisadorSintatico } from '../sintatico.js';
import * as Decl from '../declaracao.js';
import { TiposToken } from '../tiposToken.js';
import { EventosService } from '../eventosService.js';

describe('AnalisadorSintatico', () => {

  // Preparamos as instâncias que serão usadas em todos os testes deste grupo
  const eventos = new EventosService();
  const lexico = new AnalisadorLexico(eventos);
  const sintatico = new AnalisadorSintatico(eventos);

  it('deve parsear uma declaracao de variavel simples corretamente', () => {
    // Arrange
    const codigo = `
        variaveis
            idade: inteiro;
        inicio
        fim.
    `;
    
    // Act
    const tokens = lexico.scanTokens(codigo);
    const ast = sintatico.parse(tokens);

    // Assert: Agora verificamos a ESTRUTURA da AST
    expect(ast).toBeDefined(); // Garante que a AST não é nula
    
    // Navegamos na árvore para encontrar o nó que queremos testar
    const declaracaoDeVariaveis = ast.corpo.declaracoes[0];
    
    // O nó principal deve ser do tipo VarDeclaracoes
    expect(declaracaoDeVariaveis).toBeInstanceOf(Decl.VarDeclaracoes);

    // Dentro dele, a primeira variável deve ser do tipo Var
    const variavelNode = declaracaoDeVariaveis.variaveis[0];
    expect(variavelNode).toBeInstanceOf(Decl.Var);

    // E finalmente, verificamos os detalhes do nó
    expect(variavelNode.nome.lexema).toBe('idade');
    expect(variavelNode.tipoDado.tipo).toBe(TiposToken.TIPO_INTEIRO);
  });

  // Adicione mais testes aqui...
   it('deve parsear uma declaracao de matriz corretamente', () => {
    // Arrange
    const codigo = `
        variaveis
            grade: vetor[3, 2] de inteiro;
        inicio
        fim.
    `;
    
    // Act
    const tokens = lexico.scanTokens(codigo);
    const ast = sintatico.parse(tokens);

    // Assert
    expect(ast).toBeDefined();
    
    // Navega na árvore para encontrar a declaração
    const declaracaoDeVariaveis = ast.corpo.declaracoes[0];
    const variavelNode = declaracaoDeVariaveis.variaveis[0];

    // Verifica os detalhes do nó
    expect(variavelNode).toBeInstanceOf(Decl.Var);
    expect(variavelNode.nome.lexema).toBe('grade');
    expect(variavelNode.tipoDado.tipo).toBe(TiposToken.TIPO_INTEIRO);

    // Este é o teste CRUCIAL para matrizes.
    // 'toEqual' é usado para comparar o conteúdo de arrays ou objetos.
    expect(variavelNode.dimensoes).toEqual([3, 2]);
  });


});