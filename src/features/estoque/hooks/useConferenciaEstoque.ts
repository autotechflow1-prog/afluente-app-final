import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { GrupoProduto } from '@/types'

const TAMANHO_MAP: Record<string, string> = {
  '01': 'P',
  '02': 'M',
  '03': 'G',
  '04': 'GG',
  '05': 'XG',
  '09': '04',
  '10': '06',
  '11': '08',
  '12': '10',
  '13': '12',
  '14': '14',
}

const ORDEM_TAMANHOS = ['P', 'M', 'G', 'GG', 'XG', '04', '06', '08', '10', '12', '14']

const getGrupoKey = (sku: string) => sku?.substring(0, 14) ?? ''
const getTamanho = (sku: string) => TAMANHO_MAP[sku.slice(-2)] ?? sku.slice(-2)

export interface VarSimples {
  codigo: string
  tamanho: string
  saldo: number
  reservado: number
  estoqueReal: number
}

export interface GrupoSimples {
  chave: string
  nome: string
  cor: string | null
  imagem: string | null
  variacoes: VarSimples[]
}

export interface GruposSimples {
  grupos: GrupoSimples[]
  totalPedidosAbertos: number
}

export function useGruposSimples() {
  return useQuery({
    queryKey: ['grupos-simples'],
    queryFn: async (): Promise<GruposSimples> => {
      const [produtosResult, pedidosResult] = await Promise.all([
        supabase
          .from('bling_products')
          .select('codigo, nome, cor, estoque_saldo, imagem_principal_url')
          .eq('ativo_frontend', true)
          .order('codigo'),
        supabase
          .from('bling_pedidos')
          .select('bling_id')
          .in('situacao_id', [6, 15, 21]),
      ])
      if (produtosResult.error) throw produtosResult.error
      if (pedidosResult.error) throw pedidosResult.error

      const blingIds = (pedidosResult.data ?? []).map(p => p.bling_id).filter((id): id is number => id != null)

      const reservasPorSku: Record<string, number> = {}
      if (blingIds.length > 0) {
        const { data: itensReservados, error: errItens } = await supabase
          .from('bling_pedido_itens')
          .select('item_codigo, quantidade')
          .in('pedido_bling_id', blingIds)
        if (errItens) throw errItens
        for (const item of itensReservados ?? []) {
          reservasPorSku[item.item_codigo] = (reservasPorSku[item.item_codigo] ?? 0) + Number(item.quantidade)
        }
      }

      const grupos: Record<string, GrupoSimples> = {}
      for (const item of produtosResult.data ?? []) {
        const chave = getGrupoKey(item.codigo)
        if (!grupos[chave]) {
          grupos[chave] = {
            chave,
            nome: item.nome,
            cor: item.cor ?? null,
            imagem: item.imagem_principal_url ?? null,
            variacoes: [],
          }
        }
        const saldo = Number(item.estoque_saldo ?? 0)
        const reservado = reservasPorSku[item.codigo] ?? 0
        grupos[chave].variacoes.push({
          codigo: item.codigo,
          tamanho: getTamanho(item.codigo),
          saldo,
          reservado,
          estoqueReal: saldo + reservado,
        })
      }

      Object.values(grupos).forEach(g => {
        g.variacoes.sort((a, b) => {
          const ia = ORDEM_TAMANHOS.indexOf(a.tamanho)
          const ib = ORDEM_TAMANHOS.indexOf(b.tamanho)
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        })
      })

      return {
        grupos: Object.entries(grupos)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, g]) => g),
        totalPedidosAbertos: blingIds.length,
      }
    },
  })
}

export function useGruposProdutos() {
  return useQuery({
    queryKey: ['grupos-produtos'],
    queryFn: async (): Promise<GrupoProduto[]> => {
      const { data, error } = await supabase
        .from('bling_products')
        .select('codigo, nome, cor, tamanho, estoque_saldo, imagem_principal_url')
        .eq('ativo_frontend', true)
        .order('codigo')
      if (error) throw error

      // Buscar reservas dos pedidos em aberto (6) e ag. envio (21)
      const reservasPorSku: Record<string, number> = {}
      const { data: pedidosAbertos } = await supabase
        .from('bling_pedidos')
        .select('bling_id')
        .in('situacao_id', [6, 21])

      if (pedidosAbertos?.length) {
        const blingIds = pedidosAbertos.map(p => p.bling_id)
        const { data: itensReservados } = await supabase
          .from('bling_pedido_itens')
          .select('item_codigo, quantidade')
          .in('pedido_bling_id', blingIds)

        for (const item of itensReservados ?? []) {
          reservasPorSku[item.item_codigo] =
            (reservasPorSku[item.item_codigo] ?? 0) + Number(item.quantidade)
        }
      }

      const grupos: Record<string, GrupoProduto> = {}
      for (const item of data ?? []) {
        const chave = getGrupoKey(item.codigo)
        if (!grupos[chave]) {
          grupos[chave] = {
            chave,
            nome: item.nome,
            cor: item.cor ?? null,
            imagem: item.imagem_principal_url ?? null,
            variacoes: [],
          }
        }
        const estoque_bling = Number(item.estoque_saldo ?? 0)
        const reservado = reservasPorSku[item.codigo] ?? 0
        grupos[chave].variacoes.push({
          sku: item.codigo,
          tamanho: getTamanho(item.codigo),
          estoque_bling,
          reservado,
          estoque_real: estoque_bling + reservado,
          contagem: null,
        })
      }

      Object.values(grupos).forEach(g => {
        g.variacoes.sort((a, b) => {
          const ia = ORDEM_TAMANHOS.indexOf(a.tamanho)
          const ib = ORDEM_TAMANHOS.indexOf(b.tamanho)
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        })
      })

      return Object.entries(grupos)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, g]) => g)
    },
  })
}

export function useConfirmarConferencia() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      grupo,
      contagens,
    }: {
      grupo: GrupoProduto
      contagens: Record<string, number>
    }) => {
      const ajustes = grupo.variacoes
        .filter(v => contagens[v.sku] !== undefined)
        .map(v => ({ v, divergencia: contagens[v.sku] - v.estoque_real }))
        .filter(({ divergencia }) => divergencia !== 0)

      if (ajustes.length === 0) return 0

      const { error } = await supabase.from('estoque_movimentacoes').insert(
        ajustes.map(({ v, divergencia }) => ({
          sku: v.sku,
          produto_nome: grupo.nome,
          cor: grupo.cor,
          tamanho: v.tamanho,
          tipo: 'ajuste',
          quantidade: Math.abs(divergencia),
          quantidade_anterior: v.estoque_real,
          quantidade_nova: contagens[v.sku],
          motivo:
            divergencia > 0
              ? 'Ajuste positivo — conferência física'
              : 'Ajuste negativo — conferência física',
          criado_por: user?.id ?? null,
        }))
      )
      if (error) throw error
      return ajustes.length
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grupos-produtos'] }),
  })
}
