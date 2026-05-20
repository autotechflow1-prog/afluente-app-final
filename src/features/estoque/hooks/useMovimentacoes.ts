import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { EstoqueMovimentacao } from '@/types'

export function useMovimentacoes() {
  return useQuery({
    queryKey: ['movimentacoes'],
    queryFn: async (): Promise<EstoqueMovimentacao[]> => {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .select('*')
        .eq('motivo', 'entrada_manual')
        .order('criado_em', { ascending: false })
        .limit(500)
      if (error) throw error
      return (data ?? []) as EstoqueMovimentacao[]
    },
  })
}

export function useInserirMovimentacao() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      sku: string
      produto_nome: string
      cor?: string | null
      tamanho?: string
      tipo: 'entrada' | 'saida' | 'ajuste'
      quantidade: number
      quantidade_anterior: number
      quantidade_nova: number
      motivo: string
      observacao?: string
    }) => {
      const { error } = await supabase.from('estoque_movimentacoes').insert({
        ...payload,
        criado_por: user?.id ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['movimentacoes'] }),
  })
}
