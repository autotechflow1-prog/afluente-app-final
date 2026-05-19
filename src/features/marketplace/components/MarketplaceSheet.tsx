import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCriarMarketplace } from '@/hooks/useMarketplace'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export function MarketplaceSheet() {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const criar = useCriarMarketplace()

  function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!nome.trim()) return
    criar.mutate(nome.trim(), {
      onSuccess: () => {
        toast.success(`Marketplace "${nome}" criado`)
        setNome('')
        setOpen(false)
      },
      onError: () => toast.error('Erro ao criar marketplace'),
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> Marketplace
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Novo Marketplace</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSalvar} className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex: Amazon"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={criar.isPending}>
            {criar.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
