// Arquivo: Interpretador.js (VERSÃO CORRIGIDA)
import { Vetor } from '../vetor.js';
import { Ambiente } from '../ambiente.js';
// Em Interpretador.js
import { obterTipoDoValor, converterInputString } from '../checadorTipos.js'; // <-- importe a nova função
export class Interpretador {
  constructor(eventosService) {
    this.eventosService = eventosService;
    // O ambiente será criado a cada nova interpretação.
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
      for (const comando of declaracoes) {
        if (comando.tipo === "VarDeclaracoes" || comando.tipo === "Modulo") {
          await this.executarDeclaracao(comando);
        }
      }
      for (const comando of declaracoes) {
        if (comando.tipo !== "VarDeclaracoes" && comando.tipo !== "Modulo") {
          await this.executarDeclaracao(comando);
        }
      }
    } catch (erro) {
      this.erro(erro.message);
    }
  }
 // Cole esta função dentro da sua classe Interpretador, em Interpretador.js

 async executarBloco(bloco, ambiente) {
  // A implementação de um 'bloco' na sua AST é um objeto 
  // com uma propriedade 'declaracoes' que é um array.
  for (const declaracao of bloco.declaracoes) {
    // Executa cada comando dentro do bloco
    await this.executarDeclaracao(declaracao);
  }
}

  // Em Interpretador.js

  async executarDeclaracao(declaracao) {
    // Verificação de segurança
    if (!declaracao) return;

    // O SWITCH COMPLETO com todos os cases necessários
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
        // A lógica do 'para' já está contida na AST, então só precisamos executar
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

  executarPara(decl) {
    this.avaliarExpressao(decl.inicializacao);
    while (this.avaliarExpressao(decl.condicao)) {
      this.executarDeclaracao(decl.corpo);
      this.avaliarExpressao(decl.incremento);
    }
  }
  
  executarSe(decl) {
    const condicao = this.avaliarExpressao(decl.condicao);
    const bloco = condicao ? decl.entao : decl.senao;
    if (bloco && bloco.declaracoes) {
      this.executarDeclaracao(bloco);
    }
  }

  avaliarExpressao(expr) {
    if (!expr) return null;

    switch (expr.tipo) {
      case "ExpParentizada":
        return this.avaliarExpressao(expr.grupo.expressao);

      case "Literal":
        return expr.valor;

      case "Variavel":
        return this.ambiente.obter(expr.nome);

       case "VariavelArray": {
        // Pega o objeto Vetor do ambiente
        const vetor = this.ambiente.obter(expr.nome);
        // Avalia os indices passados (ex: [1, 2])
        const indices = expr.indices.map(idx => this.avaliarExpressao(idx));
        // Delega a lógica de obter o valor para a própria classe Vetor
        return vetor.obter(indices);
      }

      case "Atribuicao":
        const valor = this.avaliarExpressao(expr.valor);
        this.ambiente.atribuir(expr.nome, valor);
        return valor;

     case "AtribuicaoArray": {
        const valorAtribuir = this.avaliarExpressao(expr.valor);
        // Pega o objeto Vetor do ambiente
        const vetor = this.ambiente.obter(expr.nome);
        // Avalia os indices
        const indices = expr.indices.map(idx => this.avaliarExpressao(idx));
        // Delega a lógica de atribuir para a própria classe Vetor
        vetor.atribuir(indices, valorAtribuir);
        return valorAtribuir;
      }

      case "Binario":
        const esquerda = this.avaliarExpressao(expr.esquerda);
        const direita = this.avaliarExpressao(expr.direita);
        return this.avaliarOperacaoBinaria(expr.operador.tipo, esquerda, direita);

      default:
        this.erro(`Expressão desconhecida: ${expr.tipo}`);
    }
  }
  
  avaliarOperacaoBinaria(operadorTipo, esquerda, direita) {
    switch (operadorTipo) {
      case "MAIS": return esquerda + direita;
      case "MENOS": return esquerda - direita;
      case "ASTERISCO": return esquerda * direita;
      case "BARRA": return esquerda / direita;
      // Usando igualdade estrita para evitar problemas
      case "IGUAL": return esquerda === direita;
      case "DIFERENTE": return esquerda !== direita;
      case "MAIOR_QUE": return esquerda > direita;
      case "MENOR_QUE": return esquerda < direita;
      case "MAIOR_IGUAL": return esquerda >= direita;
      case "MENOR_IGUAL": return esquerda <= direita;
      default:
        this.erro(`Operador binário não implementado: ${operadorTipo}`);
    }
  }

  exibirSaida(valor) {
    if (this.eventosService) {
      this.eventosService.notificar("ESCREVER", valor);
    } else {
      console.log(valor);
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