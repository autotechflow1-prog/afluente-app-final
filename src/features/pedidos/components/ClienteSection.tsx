import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { num, pct, brl } from '@/lib/formatters'

interface ClienteSectionProps {
  totalClientes: number
  taxaRecompra: number
  receitaBruta: number
  totalPedidos: number
}

export function ClienteSection({ totalClientes, taxaRecompra, receitaBruta, totalPedidos }: ClienteSectionProps) {
  const ltv = totalClientes > 0 ? receitaBruta / totalClientes : 0

  const items = [
    { label: 'Clientes Únicos', value: num(totalClientes) },
    { label: 'Taxa de Recompra', value: pct(taxaRecompra) },
    { label: 'LTV Médio', value: brl(ltv) },
    { label: 'Pedidos por Cliente', value: (totalClientes > 0 ? (totalPedidos / totalClientes).toFixed(1) : '0') },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Clientes</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
