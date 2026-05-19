import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { brl, pct } from '@/lib/formatters'

interface FinanceiroSectionProps {
  ticketMedio: number
  margemBruta: number
  receitaBruta: number
  totalClientes: number
}

export function FinanceiroSection({ ticketMedio, margemBruta, receitaBruta, totalClientes }: FinanceiroSectionProps) {
  const ltv = totalClientes > 0 ? receitaBruta / totalClientes : 0

  const items = [
    { label: 'Ticket Médio', value: brl(ticketMedio) },
    { label: 'Margem Bruta', value: pct(margemBruta) },
    { label: 'LTV Médio', value: brl(ltv) },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Financeiro</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
