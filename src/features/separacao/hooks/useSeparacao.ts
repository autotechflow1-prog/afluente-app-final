import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { getCanalInfo } from '@/lib/canais'

export interface ItemPedido {
  sku: string
  descricao: string
  quantidade: number
  tamanho: string
  cor: string
  imagem_url: string | null
}

export interface PedidoComItens {
  bling_id: number
  numero_bling: string
  unidade_negocio_id: number
  data_pedido: string
  contato_nome: string
  situacao_id: number
  itens: ItemPedido[]
  total_pecas: number
}

const STORAGE_KEY = `separacao_${new Date().toISOString().slice(0, 10)}`

export function useSeparacao(statusIds: number[] | null) {
  const { user } = useAuthStore()

  const queryKey = ['separacao-pedidos', statusIds ? [...statusIds].sort().join(',') : 'todos']

  const { data: porCanal = {}, isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<Record<number, PedidoComItens[]>> => {
      const baseQuery = supabase
        .from('bling_pedidos')
        .select('bling_id, numero_bling, unidade_negocio_id, data_pedido, contato_nome, situacao_id')
        .order('data_pedido', { ascending: false })

      const { data: pedidos, error: errPedidos } = await (
        statusIds !== null ? baseQuery.in('situacao_id', statusIds) : baseQuery
      )
      if (errPedidos) throw errPedidos
      if (!pedidos?.length) return {}

      const blingIds = pedidos.map(p => p.bling_id)
      const { data: rawItens, error: errItens } = await supabase
        .from('bling_pedido_itens')
        .select('item_codigo, item_descricao, quantidade, pedido_bling_id')
        .in('pedido_bling_id', blingIds)
      if (errItens) throw errItens

      const itens = rawItens ?? []

      const uniqueSkus = [...new Set(itens.map(i => i.item_codigo))]
      const { data: produtos } = await supabase
        .from('bling_products')
        .select('codigo, imagem_principal_url')
        .in('codigo', uniqueSkus)
      const imagemPorSku = new Map(
        (produtos ?? []).map(p => [p.codigo, (p.imagem_principal_url as string | null) ?? null])
      )

      const result: Record<number, PedidoComItens[]> = {}

      for (const pedido of pedidos) {
        const pedidoItens: ItemPedido[] = itens
          .filter(i => i.pedido_bling_id === pedido.bling_id)
          .map(i => ({
            sku: i.item_codigo,
            descricao: i.item_descricao,
            quantidade: Number(i.quantidade),
            tamanho: i.item_descricao.match(/Tamanho:([^;]+)/)?.[1] ?? '',
            cor: i.item_descricao.match(/Cor:([^;,]+)/)?.[1] ?? '',
            imagem_url: imagemPorSku.get(i.item_codigo) ?? null,
          }))

        const total_pecas = pedidoItens.reduce((s, i) => s + i.quantidade, 0)
        const canalId = pedido.unidade_negocio_id

        if (!result[canalId]) result[canalId] = []
        result[canalId].push({
          bling_id: pedido.bling_id,
          numero_bling: pedido.numero_bling,
          unidade_negocio_id: canalId,
          data_pedido: pedido.data_pedido,
          contato_nome: pedido.contato_nome,
          situacao_id: pedido.situacao_id,
          itens: pedidoItens,
          total_pecas,
        })
      }

      return result
    },
  })

  const [separados, setSeparados] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...separados]))
  }, [separados])

  const marcarSeparado = useCallback((numeroBling: string) => {
    setSeparados(prev => new Set([...prev, numeroBling]))
  }, [])

  const desmarcarSeparado = useCallback((numeroBling: string) => {
    setSeparados(prev => {
      const next = new Set(prev)
      next.delete(numeroBling)
      return next
    })
  }, [])

  const { mutateAsync: inserirMovimentacao } = useMutation({
    mutationFn: async (pedido: PedidoComItens) => {
      const canal = getCanalInfo(pedido.unidade_negocio_id)
      await Promise.all(
        pedido.itens.map(item =>
          supabase
            .from('estoque_movimentacoes')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert({
              sku: item.sku,
              produto_nome: item.descricao,
              tipo: 'separacao',
              quantidade: item.quantidade,
              motivo: `Separação pedido #${pedido.numero_bling}`,
              observacao: canal.nome,
              criado_por: user?.id ?? null,
            } as any)
            .then(({ error }) => {
              if (error) throw error
            })
        )
      )
    },
  })

  return {
    porCanal,
    isLoading,
    error,
    separados,
    marcarSeparado,
    desmarcarSeparado,
    inserirMovimentacao,
  }
}
