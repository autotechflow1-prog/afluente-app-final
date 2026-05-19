export interface BlingProduct {
  id: string
  bling_id?: number
  codigo: string
  nome: string
  tipo?: string
  situacao?: string
  categoria_bling_id?: number
  categoria_nome?: string
  preco?: number
  preco_custo?: number
  estoque_saldo?: number
  imagem_principal_url?: string
  is_variacao?: boolean
  produto_pai_bling_id?: number
  tamanho?: string
  cor?: string
  ativo_frontend: boolean
  atualizado_em?: string
}

export interface Marketplace {
  id: string
  nome: string
  ativo: boolean
}

export interface ProdutoMarketplaceStatus {
  id: string
  sku: string
  marketplace_id: string
  upload_feito: boolean
  especificacoes_ok: boolean
  descricao_ok: boolean
  fotos_ok: boolean
  preco_ok: boolean
  observacoes: string | null
  created_at?: string
  updated_at?: string
}

export interface BlingPedidoItem {
  id?: number
  pedido_bling_id?: number
  item_codigo: string
  item_descricao: string
  quantidade: number
  json_raw?: Record<string, unknown>
  criado_em?: string
}

export interface BlingPedido {
  id: number
  bling_id?: number
  numero_bling?: string
  data_pedido: string
  data_saida?: string
  total_produtos: number
  total_pedido: number
  contato_nome?: string
  contato_documento?: string
  situacao_id?: number
  situacao_nome?: string
  loja_bling_id?: number
  unidade_negocio_id: number
  json_raw?: Record<string, unknown>
  criado_em?: string
  bling_pedido_itens: BlingPedidoItem[]
}

export interface MarketplaceStatusEntry {
  sku: string
  marketplace_id: string
  upload_feito: boolean
  especificacoes_ok: boolean
  descricao_ok: boolean
  fotos_ok: boolean
  preco_ok: boolean
  observacoes: string | null
}

export interface ProdutoComStatus {
  id: string
  codigo: string
  nome: string
  cor?: string | null
  tamanho?: string | null
  categoria_nome?: string | null
  imagem_principal_url?: string | null
  status: Record<string, MarketplaceStatusEntry>
}

export interface MarketplaceViewData {
  produtos: ProdutoComStatus[]
  marketplaces: Marketplace[]
}

export interface SkuRanking {
  sku: string
  nome: string
  pecas_vendidas: number
  pedidos: number
  receita_estimada: number
  taxa_cancelamento: number
}

export interface VariacaoEstoque {
  sku: string
  tamanho: string
  estoque_bling: number
  reservado: number
  estoque_real: number
  contagem: number | null
}

export interface GrupoProduto {
  chave: string
  nome: string
  cor: string | null
  imagem: string | null
  variacoes: VariacaoEstoque[]
}

export interface EstoqueMovimentacao {
  id: string
  sku: string
  produto_nome: string
  cor?: string | null
  tamanho?: string | null
  tipo: 'entrada' | 'saida' | 'ajuste'
  quantidade: number
  quantidade_anterior: number
  quantidade_nova: number
  motivo: string
  observacao?: string | null
  criado_por?: string | null
  criado_em: string
}

export type PeriodoFiltro = 'hoje' | '7d' | '30d' | 'mes_atual' | 'mes_anterior' | 'personalizado'

export interface FiltrosPedidos {
  periodo: PeriodoFiltro
  canais: string[]
  dataInicio?: string
  dataFim?: string
}
