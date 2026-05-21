import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EntradaTamanhoInput } from './EntradaTamanhoInput'
import { useRegistrarEntrada } from '../hooks/useEntradaEstoque'
import type { GrupoEntrada } from '../hooks/useEntradaEstoque'

interface EntradaCardProps {
  grupo: GrupoEntrada
}

export function EntradaCard({ grupo }: EntradaCardProps) {
  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    Object.fromEntries(grupo.variacoes.map(v => [v.codigo, 0]))
  )
  const registrar = useRegistrarEntrada()
  const [registrado, setRegistrado] = useState(false)

  const temQuantidade = Object.values(quantidades).some(q => q > 0)

  function handleChange(codigo: string, valor: number) {
    setQuantidades(prev => ({ ...prev, [codigo]: valor }))
  }

  async function handleRegistrar() {
    try {
      const count = await registrar.mutateAsync({ grupo, quantidades })
      toast.success(`${count} variação${count !== 1 ? 'ões' : ''} registrada${count !== 1 ? 's' : ''} com sucesso`)
      setQuantidades(Object.fromEntries(grupo.variacoes.map(v => [v.codigo, 0])))
      setRegistrado(true)
      setTimeout(() => setRegistrado(false), 3000)
    } catch {
      toast.error('Erro ao registrar entrada')
    }
  }

  return (
    <Card className={registrado ? 'ring-2 ring-green-500' : ''}>
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
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{grupo.chave}</p>
            {grupo.cor && (
              <p className="text-xs text-muted-foreground">{grupo.cor}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {grupo.variacoes.map(v => (
            <EntradaTamanhoInput
              key={v.codigo}
              tamanho={v.tamanho}
              value={quantidades[v.codigo] ?? 0}
              onChange={val => handleChange(v.codigo, val)}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3">
        <Button
          size="sm"
          className="w-full"
          disabled={!temQuantidade || registrar.isPending}
          onClick={handleRegistrar}
        >
          {registrado ? 'Registrado ✓' : registrar.isPending ? 'Salvando...' : 'Registrar Entrada'}
        </Button>
      </CardFooter>
    </Card>
  )
}
