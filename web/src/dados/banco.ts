// Banco local (IndexedDB via Dexie). As tabelas espelham o contrato (@tetrarreme/contrato);
// o app funciona 100% sem internet. Movimentações são append-only: nunca editar nem apagar.
import Dexie from 'dexie'
import type { EntityTable, Table } from 'dexie'
import type { Importacao, Movimentacao, Produto, ProdutoAlias, Unidade } from '@tetrarreme/contrato'

/** Resposta de uma pessoa a uma possível duplicidade (R8). */
export interface DecisaoDuplicidade {
  /** `chavePar(produtoA, produtoB)`: o mesmo par em qualquer ordem. */
  chave: string
  produtoA: string
  produtoB: string
  decisao: 'mesmo' | 'diferente'
  decidido_em: string
}

/** Cadastro da propriedade: funcionários (sempre pseudonimizados) e destinos das retiradas. */
export interface ItemCadastro {
  id?: number
  tipo: 'funcionario' | 'destino'
  nome: string
}

/** Preferências guardadas no aparelho (perfil escolhido, funcionário atual, tema). */
export interface Preferencia {
  chave: string
  valor: string
}

export type BancoMonitora = Dexie & {
  unidades: EntityTable<Unidade, 'id'>
  produtos: EntityTable<Produto, 'id'>
  apelidos: Table<ProdutoAlias, [string, string]>
  importacoes: EntityTable<Importacao, 'id'>
  movimentacoes: EntityTable<Movimentacao, 'id'>
  decisoes_duplicidade: EntityTable<DecisaoDuplicidade, 'chave'>
  cadastro: EntityTable<ItemCadastro, 'id'>
  preferencias: EntityTable<Preferencia, 'chave'>
}

export function criarBanco(nome = 'monitora'): BancoMonitora {
  const db = new Dexie(nome) as BancoMonitora
  db.version(1).stores({
    unidades: 'id',
    produtos: 'id, nome_canonico, categoria',
    apelidos: '[nome_original+produto_id], produto_id',
    importacoes: 'id',
    movimentacoes: 'id, produto_id, data, importacao_id, dispositivo',
    decisoes_duplicidade: 'chave',
    cadastro: '++id, tipo',
    preferencias: 'chave',
  })
  return db
}
