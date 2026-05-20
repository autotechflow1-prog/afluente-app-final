import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const ORDEM_TAMANHOS = ['P', 'M', 'G', 'GG', 'XG']

export interface VariacaoEntrada {
  codigo: string
  tamanho: string
}

export interface GrupoEntrada {
  chave: string
  nome: string
  cor: string | null
  imagem: string | null
  categoria: string | null
  variacoes: VariacaoEntrada[]
}

export function useProdutosEntrada() {
  return useQuery({
    queryKey: ['produtos-entrada'],
    queryFn: async (): Promise<GrupoEntrada[]> => {
      const { data, error } = await supabase
        .from('bling_products')
        .select('produto_pai_bling_id, codigo, nome, cor, tamanho, categoria_nome, imagem_principal_url')
        .eq('ativo_frontend', true)
        .order('nome')
      if (error) throw error

      const grupos: Record<string, GrupoEntrada> = {}
      for (const item of data ?? []) {
        const chave = String(item.produto_pai_bling_id ?? item.codigo)
        if (!grupos[chave]) {
          grupos[chave] = {
            chave,
            nome: item.nome,
            cor: item.cor ?? null,
            imagem: item.imagem_principal_url ?? null,
            categoria: item.categoria_nome ?? null,
            variacoes: [],
          }
        }
        grupos[chave].variacoes.push({
          codigo: item.codigo,
          tamanho: item.tamanho ?? '—',
        })
      }

      Object.values(grupos).forEach(g => {
        g.variacoes.sort((a, b) => {
          const ia = ORDEM_TAMANHOS.indexOf(a.tamanho)
          const ib = ORDEM_TAMANHOS.indexOf(b.tamanho)
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        })
      })

      return Object.values(grupos)
    },
  })
}

export function useRegistrarEntrada() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      grupo,
      quantidades,
    }: {
      grupo: GrupoEntrada
      quantidades: Record<string, number>
    }) => {
      const variacoesComQtd = grupo.variacoes.filter(v => (quantidades[v.codigo] ?? 0) > 0)
      if (variacoesComQtd.length === 0) throw new Error('Nenhuma quantidade informada')

      const { error: errInsert } = await supabase.from('estoque_movimentacoes').insert(
        variacoesComQtd.map(v => ({
          sku: v.codigo,
          produto_nome: grupo.nome,
          cor: grupo.cor,
          tamanho: v.tamanho,
          tipo: 'entrada',
          quantidade: quantidades[v.codigo],
          quantidade_anterior: null,
          quantidade_nova: null,
          motivo: 'entrada_manual',
          observacao: null,
        }))
      )
      if (errInsert) throw errInsert

      const skus = variacoesComQtd.map(v => v.codigo)
      const { data: saldos, error: errSaldos } = await supabase
        .from('bling_products')
        .select('codigo, estoque_saldo')
        .in('codigo', skus)
      if (errSaldos) throw errSaldos

      const saldoMap: Record<string, number> = {}
      for (const s of saldos ?? []) {
        saldoMap[s.codigo] = Number(s.estoque_saldo ?? 0)
      }

      await Promise.all(
        variacoesComQtd.map(v =>
          supabase
            .from('bling_products')
            .update({ estoque_saldo: saldoMap[v.codigo] + quantidades[v.codigo] })
            .eq('codigo', v.codigo)
        )
      )

      return variacoesComQtd.length
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produtos-entrada'] })
      qc.invalidateQueries({ queryKey: ['grupos-produtos'] })
      qc.invalidateQueries({ queryKey: ['movimentacoes'] })
    },
  })
}
