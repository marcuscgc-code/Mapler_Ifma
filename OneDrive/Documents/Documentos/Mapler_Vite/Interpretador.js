// Arquivo: Interpretador.js (VERSÃO FINAL E COMPLETA)

import { Ambiente } from './ambiente.js';
import { Vetor } from './vetor.js';
import { ModuloChamavel } from './chamavel.js';
import { obterTipoDoValor, converterInputString } from './checadorTipos.js';
import { avaliarBinaria } from './calculadora.js';

export class Interpretador {
  constructor(eventosService) {
    this.eventosService = eventosService;
    this.ambiente = null;
    this.resolverInput = null;
  }

  async interpretar(ast) {
    if (!ast) {
      this.erro("Erro de sintaxe impediu a execucao.");
      return;
    }
    this.ambiente = new Ambiente();
    try {
      const declaracoes = ast.corpo.declaracoes;

      // 1ª Passada: Apenas declarações de variáveis e módulos
      for (const comando of declaracoes) {
        if (comando.tipo === "VarDeclaracoes" || comando.tipo === "Modulo") {
          await this.executarDeclaracao(comando);
        }
      }

      // 2ª Passada: Execução do resto do código
      for (const comando of declaracoes) {
        if (comando.tipo !== "VarDeclaracoes" && comando.tipo !== "Modulo") {
          await this.executarDeclaracao(comando);
        }
      }
    } catch (erro) {
      this.erro(erro.message);
    }
  }
  
  /**
   * Executa um bloco de declarações em um ambiente específico.
   * Garante que o ambiente anterior seja restaurado ao final.
   */
  async executarBloco(bloco, ambiente) {
    const ambienteAnterior = this.ambiente;
    try {
      // Troca para o novo ambiente (local do módulo)
      this.ambiente = ambiente;
      // Executa todos os comandos dentro do bloco
      for (const declaracao of bloco.declaracoes) {
        await this.executarDeclaracao(declaracao);
      }
    } finally {
      // Independentemente de erros, restaura o ambiente anterior ao sair do bloco.
      this.ambiente = ambienteAnterior;
    }
  }

  async executarDeclaracao(declaracao) {
    if (!declaracao) return;
    switch (declaracao.tipo) {
      case "VarDeclaracoes":
        for (const variavel of declaracao.variaveis) {
          let valorInicial = null;
          if (variavel.dimensoes && variavel.dimensoes.length > 0) {
            valorInicial = new Vetor(variavel.tipoDado.tipo, variavel.dimensoes);
          }
          this.ambiente.definir(variavel.nome.lexema, variavel.tipoDado.tipo, valorInicial);
        }
        break;
      case "Expressao":
        this.avaliarExpressao(declaracao.expressao);
        break;
      case "Escreva":
        const valores = declaracao.expressoes.map(expr => {
            const val = this.avaliarExpressao(expr);
            if (typeof val === 'boolean') return val ? 'verdadeiro' : 'falso';
            return val ?? 'nulo';
        });
        this.eventosService.notificar("ESCREVER", valores.join(""));
        break;
      case "Se":
        const condicaoSe = this.avaliarExpressao(declaracao.condicao);
        if (condicaoSe) {
            await this.executarBloco(declaracao.entao, this.ambiente);
        } else if (declaracao.senao) {
            await this.executarBloco(declaracao.senao, this.ambiente);
        }
        break;
      case "Enquanto":
        while (this.avaliarExpressao(declaracao.condicao)) {
          await this.executarBloco(declaracao.corpo, this.ambiente);
        }
        break;
      case "Repita":
        do {
          await this.executarBloco(declaracao.corpo, this.ambiente);
        } while (!this.avaliarExpressao(declaracao.condicao));
        break;
      case "Para":
        await this.avaliarExpressao(declaracao.atribuicao);
        while (this.avaliarExpressao(declaracao.condicao)) {
            await this.executarBloco(declaracao.corpo, this.ambiente);
            await this.avaliarExpressao(declaracao.incremento);
        }
        break;
      case "Ler": {
        const promiseDoInput = new Promise((resolve) => { this.resolverInput = resolve; });
        this.eventosService.notificar("INPUT_SOLICITADO");
        const valorLido = await promiseDoInput;
        const tipoVariavel = this.ambiente.tipos.get(declaracao.variavel.lexema);
        const valorConvertido = converterInputString(valorLido, tipoVariavel);
        this.ambiente.atribuir(declaracao.variavel, valorConvertido);
        break;
      }
      case "Modulo": {
        const modulo = new ModuloChamavel(declaracao);
        this.ambiente.definir(declaracao.nome.lexema, 'TIPO_MODULO', modulo);
        break;
      }
      case "ChamadaModulo": {
        const moduloChamavel = this.ambiente.obter(declaracao.nome);
        if (moduloChamavel && moduloChamavel instanceof ModuloChamavel) {
          await moduloChamavel.chamar(this, this.ambiente);
        } else {
          throw new Error(`Erro: '${declaracao.nome.lexema}' nao e um modulo chamavel.`);
        }
        break;
      }
      case "Bloco":
        await this.executarBloco(declaracao, this.ambiente);
        break;
      default:
        this.erro(`Declaracao desconhecida: ${declaracao.tipo}`);
    }
  }

  avaliarExpressao(expr) {
    if (!expr) return null;
    switch (expr.tipo) {
      case "Variavel":
        return this.ambiente.obter(expr.nome);
      case "Literal":
        return expr.valor;
      case "Binario": {
        const esquerda = this.avaliarExpressao(expr.esquerda);
        const direita = this.avaliarExpressao(expr.direita);
        return avaliarBinaria({ ...expr, esquerda, direita });
      }
      case "Atribuicao": {
        const valor = this.avaliarExpressao(expr.valor);
        this.ambiente.atribuir(expr.nome, valor);
        return valor;
      }
      case "VariavelArray": {
        const vetor = this.ambiente.obter(expr.nome);
        const indices = expr.indices.map(idx => this.avaliarExpressao(idx));
        return vetor.obter(indices);
      }
      case "AtribuicaoArray": {
        const valorAtribuir = this.avaliarExpressao(expr.valor);
        const vetor = this.ambiente.obter(expr.nome);
        const indices = expr.indices.map(idx => this.avaliarExpressao(idx));
        vetor.atribuir(indices, valorAtribuir);
        return valorAtribuir;
      }
      default:
        this.erro(`Expressão desconhecida: ${expr.tipo}`);
    }
  }

  erro(mensagem) {
    console.error("Erro de execução:", mensagem);
    if (this.eventosService) {
      this.eventosService.notificar("ERRO", mensagem);
    }
    throw new Error(mensagem);
  }
}