import { NavLink } from 'react-router-dom'
import { Package, Store, BarChart2, ClipboardCheck, ArrowLeftRight, LogOut, PackageCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/separacao-pedidos', label: 'Separação', icon: PackageCheck },
  { to: '/pedidos', label: 'Pedidos', icon: BarChart2 },
  { to: '/conferencia-estoque', label: 'Conferência', icon: ClipboardCheck },
  { to: '/movimentacoes-estoque', label: 'Movimentações', icon: ArrowLeftRight },
]

interface SidebarContentProps {
  onNavClick?: () => void
}

export function SidebarContent({ onNavClick }: SidebarContentProps) {
  const { user, signOut } = useAuthStore()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b">
        <h1 className="font-semibold text-base leading-tight">Operação Afluente</h1>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t space-y-2">
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  )
}
