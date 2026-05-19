import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ProdutoCard } from './components/ProdutoCard'
import { useGruposProdutos } from './hooks/useConferenciaEstoque'

export function ConferenciaEstoquePage() {
  const { data: grupos = [], isLoading } = useGruposProdutos()
  const [contagens, setContagens] = useState<Record<string, number>>({})
  const [busca, setBusca] = useState('')
  const [corFiltro, setCorFiltro] = useState('todas')
  const [soDivergencia, setSoDivergencia] = useState(false)

  const cores = useMemo(() => {
    const set = new Set(grupos.map(g => g.cor).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [grupos])

  const temContagens = Object.keys(contagens).length > 0

  const gruposFiltrados = useMemo(() => {
    return grupos.filter(g => {
      const matchBusca =
        !busca ||
        g.nome.toLowerCase().includes(busca.toLowerCase()) ||
        g.variacoes.some(v => v.sku.toLowerCase().includes(busca.toLowerCase()))
      const matchCor = corFiltro === 'todas' || g.cor === corFiltro
      const matchDiv =
        !soDivergencia ||
        g.variacoes.some(
          v => contagens[v.sku] !== undefined && contagens[v.sku] !== v.estoque_real
        )
      return matchBusca && matchCor && matchDiv
    })
  }, [grupos, busca, corFiltro, soDivergencia, contagens])

  function handleContagem(codigo: string, valor: number) {
    setContagens(prev => ({ ...prev, [codigo]: valor }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Conferência de Estoque</h2>
        <p className="text-sm text-muted-foreground">{grupos.length} produtos</p>
      </div>

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
        {temContagens && (
          <div className="flex items-center gap-2">
            <Switch
              id="divergencia"
              checked={soDivergencia}
              onCheckedChange={setSoDivergencia}
            />
            <Label htmlFor="divergencia" className="text-sm cursor-pointer">
              Só divergências
            </Label>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
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
            <ProdutoCard
              key={g.chave}
              grupo={g}
              contagens={contagens}
              onContagem={handleContagem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
