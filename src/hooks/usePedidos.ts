import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BlingPedido, FiltrosPedidos, SkuRanking } from '@/types'

export function calcularDataInicio(periodo: string): string {
  const hoje = new Date()
  const map: Record<string, Date> = {
    hoje: new Date(new Date().setHours(0, 0, 0, 0)),
    '7d': new Date(Date.now() - 7 * 86400000),
    '30d': new Date(Date.now() - 30 * 86400000),
    mes_atual: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    mes_anterior: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
  }
  return (map[periodo] ?? map['30d']).toISOString().split('T')[0]
}

export function calcularDataFim(periodo: string): string | null {
  if (periodo === 'mes_anterior') {
    const hoje = new Date()
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
    return fim.toISOString().split('T')[0]
  }
  return null
}

export function usePedidos(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: ['pedidos', filtros],
    enabled: filtros.periodo !== 'personalizado' || (!!filtros.dataInicio && !!filtros.dataFim),
    queryFn: async (): Promise<BlingPedido[]> => {
      const dataInicio = filtros.periodo === 'personalizado'
        ? filtros.dataInicio!
        : calcularDataInicio(filtros.periodo)
      const dataFim = filtros.periodo === 'personalizado'
        ? (filtros.dataFim ?? null)
        : calcularDataFim(filtros.periodo)

      const PAGE_SIZE = 1000
      const todos: BlingPedido[] = []
      let from = 0

      while (true) {
        let query = supabase
          .from('bling_pedidos')
          .select(`
            id, data_pedido, data_saida, unidade_negocio_id,
            situacao_nome, total_pedido, total_produtos,
            contato_documento, contato_nome,
            bling_pedido_itens ( quantidade, item_codigo, item_descricao )
          `)
          .gte('data_pedido', dataInicio)
          .range(from, from + PAGE_SIZE - 1)

        if (dataFim) query = query.lte('data_pedido', dataFim)
        if (filtros.canais.length > 0) query = query.in('unidade_negocio_id', filtros.canais.map(Number))

        const { data, error } = await query
        if (error) throw error

        todos.push(...(data as BlingPedido[]))
        if (data.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }

      return todos
    },
  })
}

export function useSkusRanking(filtros: FiltrosPedidos) {
  return useQuery({
    queryKey: ['skus-ranking', filtros],
    queryFn: async (): Promise<SkuRanking[]> => {
      const { data, error } = await supabase
        .from('vw_skus_ranking')
        .select('*')
        .limit(10)
      if (error) throw error
      return data ?? []
    },
  })
}
