import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Marketplace, MarketplaceStatusEntry, MarketplaceViewData } from '@/types'

export function useProdutosMarketplace() {
  return useQuery({
    queryKey: ['marketplace', 'produtos'],
    queryFn: async (): Promise<MarketplaceViewData> => {
      const { data: produtos, error: erroProdutos } = await supabase
        .from('bling_products')
        .select('id, codigo, nome, cor, tamanho, categoria_nome, imagem_principal_url')
        .eq('ativo_frontend', true)
        .order('codigo')
      if (erroProdutos) throw erroProdutos

      const skus = (produtos ?? []).map(p => p.codigo)

      const { data: statusList, error: erroStatus } = skus.length > 0
        ? await supabase
            .from('produto_marketplace_status')
            .select('sku, marketplace_id, upload_feito, especificacoes_ok, descricao_ok, fotos_ok, preco_ok, observacoes')
            .in('sku', skus)
        : { data: [] as MarketplaceStatusEntry[], error: null }
      if (erroStatus) throw erroStatus

      const { data: marketplaces, error: erroMkt } = await supabase
        .from('marketplaces')
        .select('id, nome')
      if (erroMkt) throw erroMkt

      console.log('produtos:', produtos)
      console.log('statusList:', statusList)
      console.log('marketplaces:', marketplaces)

      const produtosComStatus = (produtos ?? []).map(produto => ({
        ...produto,
        status: (marketplaces ?? []).reduce((acc, mkt) => {
          const s = (statusList ?? []).find(
            st => st.sku === produto.codigo && st.marketplace_id === mkt.id
          )
          acc[mkt.id] = s ?? {
            sku: produto.codigo,
            marketplace_id: mkt.id,
            upload_feito: false,
            especificacoes_ok: false,
            descricao_ok: false,
            fotos_ok: false,
            preco_ok: false,
            observacoes: null,
          }
          return acc
        }, {} as Record<string, MarketplaceStatusEntry>),
      }))

      return { produtos: produtosComStatus, marketplaces: (marketplaces ?? []) as unknown as Marketplace[] }
    },
  })
}

export function useMarketplaces() {
  return useQuery({
    queryKey: ['marketplaces'],
    queryFn: async (): Promise<Marketplace[]> => {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('*')
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpsertStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      sku: string
      marketplace_id: string
      [key: string]: unknown
    }) => {
      const { error } = await supabase
        .from('produto_marketplace_status')
        .upsert(payload, { onConflict: 'sku,marketplace_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace', 'produtos'] }),
  })
}

export function useCriarMarketplace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (nome: string) => {
      const { error } = await supabase
        .from('marketplaces')
        .insert({ nome, ativo: true })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketplaces'] })
      qc.invalidateQueries({ queryKey: ['marketplace', 'produtos'] })
    },
  })
}
