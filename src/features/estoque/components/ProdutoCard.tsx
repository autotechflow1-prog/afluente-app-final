import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TamanhoInput } from './TamanhoInput'
import { useConfirmarConferencia } from '../hooks/useConferenciaEstoque'
import type { GrupoProduto } from '@/types'

interface ProdutoCardProps {
  grupo: GrupoProduto
  contagens: Record<string, number>
  onContagem: (sku: string, valor: number) => void
}

export function ProdutoCard({ grupo, contagens, onContagem }: ProdutoCardProps) {
  const confirmar = useConfirmarConferencia()
  const [confirmado, setConfirmado] = useState(false)

  async function handleConfirmar() {
    const contagensGrupo = Object.fromEntries(
      grupo.variacoes
        .filter(v => contagens[v.sku] !== undefined)
        .map(v => [v.sku, contagens[v.sku]])
    )
    try {
      const ajustes = await confirmar.mutateAsync({ grupo, contagens: contagensGrupo })
      if (ajustes === 0) {
        toast.success('Estoque conferido — sem divergências')
      } else {
        toast.success(`${ajustes} ajuste${ajustes > 1 ? 's' : ''} registrado${ajustes > 1 ? 's' : ''}`)
      }
      setConfirmado(true)
    } catch {
      toast.error('Erro ao registrar conferência')
    }
  }

  const temContagem = grupo.variacoes.some(v => contagens[v.sku] !== undefined)
  const temReservas = grupo.variacoes.some(v => v.reservado > 0)

  return (
    <Card className={confirmado ? 'opacity-60' : ''}>
      <CardContent className="pt-4 pb-2 space-y-3">
        <div className="flex gap-3">
          {grupo.imagem ? (
            <img
              src={grupo.imagem}
              alt={grupo.nome}
              className="w-14 h-14 object-cover rounded shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded bg-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight line-clamp-2">{grupo.nome}</p>
            {grupo.cor && (
              <p className="text-xs text-muted-foreground mt-0.5">{grupo.cor}</p>
            )}
            <p className="text-[11px] font-mono text-muted-foreground mt-1">SKU: {grupo.chave}</p>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-green-600 font-semibold">● Real</span>
          <span className="text-muted-foreground">● Bling</span>
          {temReservas && <span className="text-amber-600">● Reservado</span>}
        </div>

        <div className="flex flex-wrap gap-3 justify-start">
          {grupo.variacoes.map(v => (
            <TamanhoInput
              key={v.sku}
              tamanho={v.tamanho}
              estoqueBling={v.estoque_bling}
              estoqueReal={v.estoque_real}
              reservado={v.reservado}
              value={contagens[v.sku]}
              onChange={(val) => onContagem(v.sku, val)}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3">
        <Button
          size="sm"
          className="w-full"
          disabled={!temContagem || confirmar.isPending || confirmado}
          onClick={handleConfirmar}
        >
          {confirmado ? 'Conferido ✓' : confirmar.isPending ? 'Salvando...' : 'Confirmar conferência'}
        </Button>
      </CardFooter>
    </Card>
  )
}
