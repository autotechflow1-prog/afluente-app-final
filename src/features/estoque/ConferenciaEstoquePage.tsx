import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { FileText, X } from 'lucide-react'
import { useGruposSimples } from './hooks/useConferenciaEstoque'
import { ConferenciaCardSimples } from './components/ConferenciaCardSimples'

const ORDEM_TAMANHOS = ['P', 'M', 'G', 'GG', 'XG', '04', '06', '08', '10', '12', '14']

interface TamanhoResultado {
  codigo: string
  tamanho: string
  saldo: number
}

interface GrupoResultado {
  chave: string
  nome: string
  cor: string | null
  imagem: string | null
  skuBase: string
  tamanhos: TamanhoResultado[]
  countNFs: number
}

interface Resultados {
  grupos: GrupoResultado[]
  totalNFs: number
}

export function ConferenciaEstoquePage() {
  // Filtro de data
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [modoFiltro, setModoFiltro] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<Resultados | null>(null)

  // Modo 1 — todos os produtos
  const { data: gruposData, isLoading } = useGruposSimples()
  const todos = gruposData?.grupos ?? []
  const totalAbertos = gruposData?.totalPedidosAbertos ?? 0
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [busca, setBusca] = useState('')
  const [corFiltro, setCorFiltro] = useState('todas')

  const cores = useMemo(() => {
    const set = new Set(todos.map(g => g.cor).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [todos])

  const gruposFiltrados = useMemo(() => {
    return todos.filter(g => {
      const matchBusca =
        !busca ||
        g.nome.toLowerCase().includes(busca.toLowerCase()) ||
        g.variacoes.some(v => v.codigo.toLowerCase().includes(busca.toLowerCase()))
      const matchCor = corFiltro === 'todas' || g.cor === corFiltro
      return matchBusca && matchCor
    })
  }, [todos, busca, corFiltro])

  function handleContagem(sku: string, valor: number) {
    setContagens(prev => ({ ...prev, [sku]: valor }))
  }

  function handleLimpar() {
    setModoFiltro(false)
    setResultados(null)
    setDataInicial('')
    setDataFinal('')
  }

  async function handleBuscar() {
    if (!dataInicial || !dataFinal) {
      toast.error('Informe data inicial e final')
      return
    }
    setBuscando(true)
    setModoFiltro(true)
    setResultados(null)
    try {
      // Passo 1: paralelo — pedidos com NF + entradas manuais
      const [pedidosNFResult, entradasResult] = await Promise.all([
        supabase
          .from('bling_pedidos')
          .select('bling_id, numero_nf, data_emissao_nf')
          .gte('data_emissao_nf', dataInicial)
          .lte('data_emissao_nf', dataFinal + 'T23:59:59')
          .not('numero_nf', 'is', null),
        supabase
          .from('estoque_movimentacoes')
          .select('sku, quantidade, criado_em')
          .eq('motivo', 'entrada_manual')
          .gte('criado_em', dataInicial)
          .lte('criado_em', dataFinal + 'T23:59:59'),
      ])
      if (pedidosNFResult.error) throw pedidosNFResult.error
      if (entradasResult.error) throw entradasResult.error

      const pedidosComNF = pedidosNFResult.data ?? []
      const entradas = entradasResult.data ?? []

      // Passo 2: itens dos pedidos com NF (para cruzar SKUs)
      const pedidoIds = pedidosComNF
        .map(p => p.bling_id)
        .filter((id): id is number => id != null)

      let itensPedidos: { item_codigo: string; pedido_bling_id: number }[] = []
      if (pedidoIds.length > 0) {
        const { data: itens, error: errItens } = await supabase
          .from('bling_pedido_itens')
          .select('item_codigo, pedido_bling_id')
          .in('pedido_bling_id', pedidoIds)
        if (errItens) throw errItens
        itensPedidos = itens ?? []
      }

      // Conjuntos de SKUs: NF e entrada
      const skusNF = new Set(itensPedidos.map(i => i.item_codigo))
      const skusEntrada = new Set(entradas.map(e => e.sku))
      const todosSKUs = [...new Set([...skusNF, ...skusEntrada])]

      if (todosSKUs.length === 0) {
        setResultados({ grupos: [], totalNFs: pedidosComNF.length })
        return
      }

      // Passo 3a: produto_pai_bling_id dos SKUs com movimentação
      const { data: produtosComMov, error: errPais } = await supabase
        .from('bling_products')
        .select('produto_pai_bling_id')
        .in('codigo', todosSKUs)
      if (errPais) throw errPais

      const paisIds = [
        ...new Set(
          (produtosComMov ?? [])
            .map(p => p.produto_pai_bling_id)
            .filter((id): id is number => id != null)
        ),
      ]

      if (paisIds.length === 0) {
        setResultados({ grupos: [], totalNFs: pedidosComNF.length })
        return
      }

      // Passo 3b: TODOS os tamanhos desses grupos
      const { data: produtos, error: errProd } = await supabase
        .from('bling_products')
        .select('codigo, nome, cor, tamanho, estoque_saldo, imagem_principal_url')
        .in('produto_pai_bling_id', paisIds)
        .eq('ativo_frontend', true)
        .order('codigo')
      if (errProd) throw errProd

      // Mapa NF: pedido_id → numero_nf, depois sku → Set<numero_nf>
      const pedidoToNF: Record<number, string> = {}
      for (const p of pedidosComNF) {
        if (p.bling_id != null && p.numero_nf) pedidoToNF[p.bling_id] = p.numero_nf
      }
      const skuToNFs: Record<string, Set<string>> = {}
      for (const item of itensPedidos) {
        const nf = pedidoToNF[item.pedido_bling_id]
        if (nf) {
          if (!skuToNFs[item.item_codigo]) skuToNFs[item.item_codigo] = new Set()
          skuToNFs[item.item_codigo].add(nf)
        }
      }

      // Agrupar por primeiros 14 chars do SKU (produto até a cor)
      const grupos: Record<string, GrupoResultado> = {}
      for (const p of produtos ?? []) {
        const chave = p.codigo.substring(0, 14)
        if (!grupos[chave]) {
          grupos[chave] = {
            chave,
            nome: p.nome,
            cor: p.cor ?? null,
            imagem: p.imagem_principal_url ?? null,
            skuBase: chave,
            tamanhos: [],
            countNFs: 0,
          }
        }
        grupos[chave].tamanhos.push({
          codigo: p.codigo,
          tamanho: p.tamanho ?? '—',
          saldo: Number(p.estoque_saldo ?? 0),
        })
      }

      // Ordenar tamanhos e calcular NFs únicas por grupo
      for (const g of Object.values(grupos)) {
        g.tamanhos.sort((a, b) => {
          const ia = ORDEM_TAMANHOS.indexOf(a.tamanho)
          const ib = ORDEM_TAMANHOS.indexOf(b.tamanho)
          if (ia !== -1 && ib !== -1) return ia - ib
          if (ia !== -1) return -1
          if (ib !== -1) return 1
          const na = parseInt(a.tamanho, 10)
          const nb = parseInt(b.tamanho, 10)
          if (!isNaN(na) && !isNaN(nb)) return na - nb
          return a.tamanho.localeCompare(b.tamanho)
        })
        const nfSet = new Set<string>()
        for (const t of g.tamanhos) {
          for (const nf of skuToNFs[t.codigo] ?? []) nfSet.add(nf)
        }
        g.countNFs = nfSet.size
      }

      setResultados({
        grupos: Object.entries(grupos)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, g]) => g),
        totalNFs: pedidosComNF.length,
      })
    } catch {
      toast.error('Erro ao buscar dados do período')
      setModoFiltro(false)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Conferência de Estoque</h2>
        {!modoFiltro && (
          <p className="text-sm text-muted-foreground">{todos.length} produtos</p>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-1.5">
          <span className="font-bold">{totalAbertos}</span>
          pedido{totalAbertos !== 1 ? 's' : ''} em aberto / aguardando envio
        </Badge>
      </div>

      {/* Filtro de período */}
      <div className="flex gap-2 flex-wrap items-end">
        <div className="flex flex-col gap-1">
          <Label htmlFor="data-inicial" className="text-xs text-muted-foreground">Data Inicial</Label>
          <Input
            id="data-inicial"
            type="date"
            value={dataInicial}
            onChange={e => setDataInicial(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="data-final" className="text-xs text-muted-foreground">Data Final</Label>
          <Input
            id="data-final"
            type="date"
            value={dataFinal}
            onChange={e => setDataFinal(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={handleBuscar} disabled={buscando} size="sm">
          {buscando ? 'Buscando...' : 'Buscar'}
        </Button>
        {modoFiltro && (
          <Button size="sm" variant="ghost" onClick={handleLimpar} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Limpar filtro
          </Button>
        )}
      </div>

      {/* ── MODO 1: todos os produtos ── */}
      {!modoFiltro && (
        <>
          <div className="flex gap-2 flex-wrap items-center">
            <Input
              placeholder="Buscar nome ou SKU..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-56"
            />
            <Select value={corFiltro} onValueChange={setCorFiltro}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Cor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as cores</SelectItem>
                {cores.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          )}

          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gruposFiltrados.length === 0 && (
                <p className="col-span-full text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado
                </p>
              )}
              {gruposFiltrados.map(g => (
                <ConferenciaCardSimples
                  key={g.chave}
                  grupo={g}
                  contagens={contagens}
                  onContagem={handleContagem}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── MODO 2: produtos com movimentação no período ── */}
      {modoFiltro && (
        <>
          {buscando && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          )}

          {!buscando && resultados !== null && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  {resultados.grupos.length} produto{resultados.grupos.length !== 1 ? 's' : ''} com movimentação
                </p>
                {resultados.totalNFs > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {resultados.totalNFs} NF{resultados.totalNFs !== 1 ? 's' : ''} emitida{resultados.totalNFs !== 1 ? 's' : ''} no período
                  </Badge>
                )}
              </div>

              {resultados.grupos.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">
                  Nenhum produto com movimentação no período selecionado
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resultados.grupos.map(g => (
                    <Card key={g.chave}>
                      <CardContent className="pt-4 pb-4 space-y-3">
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
                              {g.skuBase && (
                                <p className="text-xs text-muted-foreground mt-0.5">SKU: {g.skuBase}</p>
                              )}
                              {g.cor && (
                                <p className="text-xs text-muted-foreground">Cor: {g.cor}</p>
                              )}
                            </div>
                          </div>
                          {g.countNFs > 0 && (
                            <Badge variant="outline" className="shrink-0 gap-1 text-xs whitespace-nowrap">
                              <FileText className="h-3 w-3" />
                              {g.countNFs} NF{g.countNFs !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {g.tamanhos.map(t => (
                            <div key={t.codigo} className="flex flex-col items-center gap-0.5">
                              <span className="text-[11px] font-medium text-muted-foreground uppercase">
                                {t.tamanho}
                              </span>
                              <span className="text-xs font-bold">{t.saldo}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
