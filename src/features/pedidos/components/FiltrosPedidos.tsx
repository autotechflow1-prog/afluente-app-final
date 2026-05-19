import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { CANAIS } from '@/lib/canais'
import type { FiltrosPedidos } from '@/types'

interface FiltrosPedidosProps {
  filtros: FiltrosPedidos
  onChange: (f: FiltrosPedidos) => void
}

const PERIODOS = [
  { value: 'hoje', label: 'Hoje' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'personalizado', label: 'Personalizado' },
]

export function FiltrosPedidos({ filtros, onChange }: FiltrosPedidosProps) {
  const canais = Object.entries(CANAIS)

  function handlePeriodo(v: string) {
    const base = { ...filtros, periodo: v as FiltrosPedidos['periodo'] }
    if (v !== 'personalizado') {
      delete base.dataInicio
      delete base.dataFim
    }
    onChange(base)
  }

  function toggleCanal(id: string) {
    const atual = filtros.canais
    const novos = atual.includes(id) ? atual.filter(c => c !== id) : [...atual, id]
    onChange({ ...filtros, canais: novos })
  }

  const labelCanais = filtros.canais.length === 0
    ? 'Todas as lojas'
    : filtros.canais.length === 1
      ? CANAIS[Number(filtros.canais[0])]?.nome ?? 'Loja'
      : `${filtros.canais.length} lojas`

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Select value={filtros.periodo} onValueChange={handlePeriodo}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtros.periodo === 'personalizado' && (
        <>
          <Input
            type="date"
            value={filtros.dataInicio ?? ''}
            onChange={(e) => onChange({ ...filtros, dataInicio: e.target.value })}
            className="w-36"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            value={filtros.dataFim ?? ''}
            onChange={(e) => onChange({ ...filtros, dataFim: e.target.value })}
            className="w-36"
          />
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-44 justify-between font-normal">
            <span className="truncate">{labelCanais}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44">
          {canais.map(([id, info]) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={filtros.canais.includes(id)}
              onCheckedChange={() => toggleCanal(id)}
            >
              {info.nome}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
