import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface ResumoRodapeProps {
  totalPedidos: number
  separadosCount: number
  pecasSeparadas: number
}

export function ResumoRodape({ totalPedidos, separadosCount, pecasSeparadas }: ResumoRodapeProps) {
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{separadosCount}</span> de{' '}
          <span className="font-semibold text-foreground">{totalPedidos}</span> pedidos separados hoje
          {pecasSeparadas > 0 && (
            <> · <span className="font-semibold text-foreground">{pecasSeparadas} peças</span></>
          )}
        </p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/movimentacoes-estoque')}>
          Ver Movimentações →
        </Button>
      </div>
    </div>
  )
}
