import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { MovimentacaoTable } from './components/MovimentacaoTable'
import { MovimentacaoSheet } from './components/MovimentacaoSheet'
import { useMovimentacoes } from './hooks/useMovimentacoes'

export function MovimentacoesEstoquePage() {
  const { data: movimentacoes = [], isLoading } = useMovimentacoes()
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('todos')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [defaultTipo, setDefaultTipo] = useState<'entrada' | 'saida' | 'ajuste'>('entrada')

  function openSheet(tipo: 'entrada' | 'saida' | 'ajuste') {
    setDefaultTipo(tipo)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Movimentações de Estoque</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openSheet('entrada')}>
            <ArrowDownCircle className="h-4 w-4 mr-1 text-green-600" />
            Nova Entrada
          </Button>
          <Button size="sm" variant="outline" onClick={() => openSheet('saida')}>
            <ArrowUpCircle className="h-4 w-4 mr-1 text-destructive" />
            Nova Saída
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Buscar SKU ou produto..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-56"
        />
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entrada</SelectItem>
            <SelectItem value="saida">Saída</SelectItem>
            <SelectItem value="ajuste">Ajuste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MovimentacaoTable
        movimentacoes={movimentacoes}
        isLoading={isLoading}
        busca={busca}
        tipoFiltro={tipoFiltro}
      />

      <MovimentacaoSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        defaultTipo={defaultTipo}
      />
    </div>
  )
}
