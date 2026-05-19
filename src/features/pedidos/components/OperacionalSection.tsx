import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { pct, dias } from '@/lib/formatters'

interface OperacionalSectionProps {
  taxaCancelamento: number
  prazoMedio: number | null
}

export function OperacionalSection({ taxaCancelamento, prazoMedio }: OperacionalSectionProps) {
  const items = [
    { label: 'Taxa Cancelamento', value: pct(taxaCancelamento) },
    { label: 'Prazo Médio Entrega', value: dias(prazoMedio) },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Operacional</h3>
      <div className="grid grid-cols-2 gap-4">
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
