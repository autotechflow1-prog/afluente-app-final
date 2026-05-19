import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const STATUS_TABS = [
  { key: 'separar',  label: 'A separar',    ids: [6, 21] as number[] | null },
  { key: 'todos',    label: 'Todos',         ids: null    as number[] | null },
  { key: '6',        label: 'Em aberto',     ids: [6]     as number[] | null },
  { key: '15',       label: 'Em andamento',  ids: [15]    as number[] | null },
  { key: '21',       label: 'Ag. envio',     ids: [21]    as number[] | null },
  { key: '9',        label: 'Atendido',      ids: [9]     as number[] | null },
  { key: '12',       label: 'Cancelado',     ids: [12]    as number[] | null },
]

interface StatusTabsProps {
  value: string
  onChange: (value: string) => void
}

export function StatusTabs({ value, onChange }: StatusTabsProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <Tabs value={value} onValueChange={onChange}>
        <TabsList className="w-max">
          {STATUS_TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs px-3">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
