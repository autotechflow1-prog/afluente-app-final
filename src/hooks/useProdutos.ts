import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BlingProduct } from '@/types'

export function useProdutos() {
  return useQuery({
    queryKey: ['produtos'],
    queryFn: async (): Promise<BlingProduct[]> => {
      const { data, error } = await supabase
        .from('bling_products')
        .select('id, codigo, nome, cor, tamanho, categoria_nome, preco, preco_custo, estoque_saldo, imagem_principal_url, ativo_frontend')
        .order('codigo')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useToggleAtivo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ativo_frontend }: { id: string; ativo_frontend: boolean }) => {
      const { error } = await supabase
        .from('bling_products')
        .update({ ativo_frontend })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['produtos'] }),
  })
}
