import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const TAMANHO_MAP: Record<string, string> = {
  '01': 'P', '02': 'M', '03': 'G', '04': 'GG', '05': 'XG',
  '09': '04', '10': '06', '11': '08', '12': '10', '13': '12', '14': '14',
}
const ORDEM_TAMANHOS = ['P', 'M', 'G', 'GG', 'XG', '04', '06', '08', '10', '12', '14']
const getTamanho = (sku: string) => TAMANHO_MAP[sku.slice(-2)] ?? sku.slice(-2)
const getGrupoKey = (sku: string) => sku.substring(0, 14)

const DIAS_COBERTURA = 45

interface VariacaoProducao {
  codigo: string
  tamanho: string
  vendas: number
  estoqueAtual: number
  necessidade: number
  sugestao: number
}

interface GrupoProducao {
  chave: string
  nome: string
  cor: string | null
  imagem: string | null
  variacoes: VariacaoProducao[]
  totalSugestao: number
}

export function PlanejamentoProducaoPage() {
  const [totalPecas, setTotalPecas] = useState(1700)
  const [periodo, setPeriodo] = useState(60)
  const [calculando, setCalculando] = useState(false)
  const [grupos, setGrupos] = useState<GrupoProducao[]>([])
  const [calculado, setCalculado] = useState(false)

  const totalDistribuido = grupos.reduce((sum, g) => sum + g.totalSugestao, 0)
  const totalSkus = grupos.reduce((sum, g) => sum + g.variacoes.length, 0)
  const saldo = totalPecas - totalDistribuido

  async function handleCalcular() {
    setCalculando(true)
    setCalculado(false)
    try {
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - periodo)

      // Busca pedidos atendidos no período e produtos em paralelo
      const [pedidosResult, produtosResult] = await Promise.all([
        supabase
          .from('bling_pedidos')
          .select('bling_id')
          .gte('data_pedido', dataInicio.toISOString())
          .in('situacao_id', [9]),
        supabase
          .from('bling_products')
          .select('codigo, nome, cor, estoque_saldo, imagem_principal_url')
          .eq('ativo_frontend', true)
          .order('codigo'),
      ])
      if (pedidosResult.error) throw pedidosResult.error
      if (produtosResult.error) throw produtosResult.error

      const blingIds = (pedidosResult.data ?? [])
        .map(p => p.bling_id)
        .filter((id): id is number => id != null)

      const vendasPorSku: Record<string, number> = {}
      if (blingIds.length > 0) {
        const { data: itens, error: errItens } = await supabase
          .from('bling_pedido_itens')
          .select('item_codigo, quantidade')
          .in('pedido_bling_id', blingIds)
        if (errItens) throw errItens
        for (const item of itens ?? []) {
          vendasPorSku[item.item_codigo] = (vendasPorSku[item.item_codigo] ?? 0) + Number(item.quantidade)
        }
      }

      // Calcular necessidade por SKU e filtrar os relevantes
      interface SkuCalc {
        codigo: string
        nome: string
        cor: string | null
        imagem: string | null
        tamanho: string
        estoqueAtual: number
        vendas: number
        necessidade: number
        sugestao: number
        remainder: number
      }

      const skuItems: SkuCalc[] = []
      for (const p of produtosResult.data ?? []) {
        const vendas = vendasPorSku[p.codigo] ?? 0
        const estoqueAtual = Number(p.estoque_saldo ?? 0)
        const demandaDiaria = vendas / periodo
        const necessidade = Math.max(0, demandaDiaria * DIAS_COBERTURA - estoqueAtual)
        if (necessidade === 0 && vendas === 0) continue
        skuItems.push({
          codigo: p.codigo,
          nome: p.nome,
          cor: p.cor ?? null,
          imagem: p.imagem_principal_url ?? null,
          tamanho: getTamanho(p.codigo),
          estoqueAtual,
          vendas,
          necessidade,
          sugestao: 0,
          remainder: 0,
        })
      }

      // Distribuição proporcional com arredondamento por remainder
      const totalNecessidade = skuItems.reduce((sum, x) => sum + x.necessidade, 0)
      if (totalNecessidade > 0) {
        for (const item of skuItems) {
          const frac = (item.necessidade / totalNecessidade) * totalPecas
          item.sugestao = Math.floor(frac)
          item.remainder = frac - item.sugestao
        }
      }

      // Mínimo 2 para SKUs com ao menos 1 venda
      for (const item of skuItems) {
        if (item.vendas >= 1 && item.sugestao < 2) item.sugestao = 2
      }

      // Ajustar para bater exato em totalPecas (distribuir remainder)
      const totalFloor = skuItems.reduce((sum, x) => sum + x.sugestao, 0)
      const toDistribute = totalPecas - totalFloor
      if (toDistribute > 0) {
        const sorted = [...skuItems].sort((a, b) => b.remainder - a.remainder)
        for (let i = 0; i < toDistribute; i++) {
          sorted[i % sorted.length].sugestao += 1
        }
      }

      // Agrupar por prefixo de 14 chars do SKU
      const gruposMap: Record<string, GrupoProducao> = {}
      for (const item of skuItems) {
        const chave = getGrupoKey(item.codigo)
        if (!gruposMap[chave]) {
          gruposMap[chave] = {
            chave,
            nome: item.nome,
            cor: item.cor,
            imagem: item.imagem,
            variacoes: [],
            totalSugestao: 0,
          }
        }
        gruposMap[chave].variacoes.push({
          codigo: item.codigo,
          tamanho: item.tamanho,
          vendas: item.vendas,
          estoqueAtual: item.estoqueAtual,
          necessidade: item.necessidade,
          sugestao: item.sugestao,
        })
        gruposMap[chave].totalSugestao += item.sugestao
      }

      const result = Object.entries(gruposMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, g]) => {
          g.variacoes.sort((a, b) => {
            const ia = ORDEM_TAMANHOS.indexOf(a.tamanho)
            const ib = ORDEM_TAMANHOS.indexOf(b.tamanho)
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
          })
          return g
        })

      setGrupos(result)
      setCalculado(true)
    } catch {
      toast.error('Erro ao calcular planejamento')
    } finally {
      setCalculando(false)
    }
  }

  function handleExportar() {
    if (grupos.length === 0) return
    const rows = grupos.flatMap(g =>
      g.variacoes.map(v => ({
        SKU: v.codigo,
        Nome: g.nome,
        Cor: g.cor ?? '',
        Tamanho: v.tamanho,
        [`Vendas (${periodo}d)`]: v.vendas,
        'Estoque atual': v.estoqueAtual,
        Necessidade: Math.round(v.necessidade * 10) / 10,
        'Sugestão produção': v.sugestao,
      }))
    )
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Planejamento')
    XLSX.writeFile(wb, `planejamento-${periodo}d-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-4 pb-24">
      <h2 className="text-xl font-semibold">Planejamento de Produção</h2>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Total de peças disponíveis</label>
          <Input
            type="number"
            value={totalPecas}
            onChange={e => setTotalPecas(Math.max(1, Number(e.target.value)))}
            className="w-36"
            min={1}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Período de análise</label>
          <div className="flex gap-1">
            {[30, 60, 90].map(d => (
              <Button
                key={d}
                size="sm"
                variant="outline"
                className={cn(
                  periodo === d &&
                    'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                )}
                onClick={() => setPeriodo(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={handleCalcular} disabled={calculando}>
          {calculando ? 'Calculando...' : 'Calcular'}
        </Button>
        {calculado && grupos.length > 0 && (
          <Button variant="outline" onClick={handleExportar} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        )}
      </div>

      {/* Skeleton */}
      {calculando && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      )}

      {/* Resultados */}
      {!calculando && calculado && grupos.length === 0 && (
        <p className="text-center py-10 text-muted-foreground">
          Nenhum produto com necessidade de produção no período selecionado
        </p>
      )}

      {!calculando && calculado && grupos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map(g => (
            <Card key={g.chave}>
              <CardContent className="pt-4 pb-4 space-y-3">
                {/* Cabeçalho do card */}
                <div className="flex gap-3 justify-between items-start">
                  <div className="flex gap-3 min-w-0">
                    {g.imagem ? (
                      <img
                        src={g.imagem}
                        alt={g.nome}
                        className="w-12 h-12 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-2">{g.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{g.chave}</p>
                      {g.cor && <p className="text-xs text-muted-foreground">{g.cor}</p>}
                    </div>
                  </div>
                  <Badge className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
                    {g.totalSugestao} pç
                  </Badge>
                </div>

                {/* Tabela de tamanhos */}
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <td className="pr-2 pb-1 text-[11px] text-muted-foreground w-14" />
                        {g.variacoes.map(v => (
                          <td
                            key={v.codigo}
                            className="text-center font-semibold text-muted-foreground uppercase pb-1 px-1 min-w-[34px]"
                          >
                            {v.tamanho}
                          </td>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="pr-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
                          Vendas
                        </td>
                        {g.variacoes.map(v => (
                          <td key={v.codigo} className="text-center py-0.5 px-1 text-muted-foreground">
                            {v.vendas}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="pr-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
                          Estoque
                        </td>
                        {g.variacoes.map(v => (
                          <td key={v.codigo} className="text-center py-0.5 px-1 text-muted-foreground">
                            {v.estoqueAtual}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t">
                        <td className="pr-2 pt-1 pb-0.5 text-[11px] font-semibold whitespace-nowrap">
                          Produzir
                        </td>
                        {g.variacoes.map(v => (
                          <td
                            key={v.codigo}
                            className="text-center pt-1 pb-0.5 px-1 font-bold text-green-700 dark:text-green-400"
                          >
                            {v.sugestao}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rodapé fixo */}
      {calculado && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
          <div className="max-w-screen-xl mx-auto flex flex-wrap gap-x-5 gap-y-1 items-center text-sm">
            <span>
              Distribuído: <strong>{totalDistribuido}</strong> peças
            </span>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span>
              Disponível: <strong>{totalPecas}</strong> peças
            </span>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span>
              Saldo:{' '}
              <strong className={cn(saldo === 0 ? 'text-green-600' : 'text-destructive')}>
                {saldo > 0 ? `+${saldo}` : saldo} peças
              </strong>
            </span>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span>
              Modelos: <strong>{grupos.length}</strong>
            </span>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <span>
              SKUs: <strong>{totalSkus}</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
