import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    GraduationCap,
    Wallet,
    Bot,
    Clock,
    CalendarDays,
    CalendarHeart,
    Menu,
    X,
    Plus,
    ClipboardList,
    MessageCircle,
    DollarSign,
    Timer,
    Zap,
} from 'lucide-react'
import { useState } from 'react'
import { useVillaSync } from '../hooks/useVilla'

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/universidad', icon: GraduationCap, label: 'Universidad' },
    { to: '/horario', icon: Clock, label: 'Horario' },
    { to: '/calendario', icon: CalendarDays, label: 'Calendario' },
    { to: '/agenda', icon: CalendarHeart, label: 'Agenda' },
    { to: '/finanzas', icon: Wallet, label: 'Finanzas' },
    { to: '/ia', icon: Bot, label: 'Asesor IA' },
]

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [fabOpen, setFabOpen] = useState(false)
    const navigate = useNavigate()

    // Register global exportarEstadoCalendario()
    useVillaSync()

    function fabAction(path, params) {
        setFabOpen(false)
        navigate(path, params ? { state: params } : undefined)
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-surface-50">
            {/* ── Mobile Header ── */}
            <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-surface-200 sticky top-0 z-50">
                <div className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Calendario" className="w-8 h-8 rounded-lg shadow-sm" />
                    <span className="font-semibold text-gray-800">Calendario</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="btn-ghost p-2"
                    aria-label="Menú"
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </header>

            {/* ── Mobile Overlay ── */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64
          bg-white/90 backdrop-blur-md border-r border-surface-200
          flex flex-col py-6 px-3
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-3 mb-8">
                    <img src="/logo.png" alt="Calendario" className="w-10 h-10 rounded-xl shadow-md" />
                    <div>
                        <h1 className="font-bold text-gray-800 leading-tight">Calendario</h1>
                        <p className="text-xs text-gray-400">Dashboard Universitario</p>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-surface-100 hover:text-gray-700'
                                }`
                            }
                        >
                            <Icon size={20} strokeWidth={1.8} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Villa sync indicator */}
                <div className="px-3 pb-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                        <Zap size={12} className="text-amber-500" />
                        <p className="text-[11px] text-indigo-600 font-medium">La Villa conectada</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-3 pt-2 border-t border-surface-200">
                    <p className="text-xs text-gray-400 text-center">v2.0 · La Villa 🏰</p>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="flex-1 min-h-screen pb-20 lg:pb-0">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Outlet />
                </div>
            </main>

            {/* ── Mobile Bottom Nav ── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-surface-200 px-2 py-1 safe-area-bottom">
                <div className="flex justify-around">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-medium transition-all duration-200
                ${isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`
                            }
                        >
                            <Icon size={20} strokeWidth={1.8} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* ── FAB Overlay ── */}
            {fabOpen && (
                <div
                    className="fixed inset-0 z-[70] bg-black/10 backdrop-blur-[2px]"
                    onClick={() => setFabOpen(false)}
                />
            )}

            {/* ── FAB Menu ── */}
            <div className="fixed bottom-24 lg:bottom-8 right-5 z-[80] flex flex-col items-end gap-3">
                <div className={`flex flex-col items-end gap-2 transition-all duration-300 origin-bottom ${fabOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4 pointer-events-none'}`}>
                    <FabItem
                        icon={MessageCircle}
                        label="Asesor IA"
                        color="bg-violet-500 hover:bg-violet-600"
                        onClick={() => fabAction('/ia')}
                    />
                    <FabItem
                        icon={Timer}
                        label="Modo Foco 25 min"
                        color="bg-indigo-500 hover:bg-indigo-600"
                        onClick={() => fabAction('/agenda')}
                    />
                    <FabItem
                        icon={ClipboardList}
                        label="Nueva tarea uni"
                        color="bg-blue-500 hover:bg-blue-600"
                        onClick={() => fabAction('/universidad', { openModal: true })}
                    />
                    <FabItem
                        icon={Plus}
                        label="Nota agenda"
                        color="bg-teal-500 hover:bg-teal-600"
                        onClick={() => fabAction('/agenda')}
                    />
                    <FabItem
                        icon={DollarSign}
                        label="Nuevo registro"
                        color="bg-emerald-500 hover:bg-emerald-600"
                        onClick={() => fabAction('/finanzas', { openModal: true })}
                    />
                    <FabItem
                        icon={Clock}
                        label="Añadir clase"
                        color="bg-sky-500 hover:bg-sky-600"
                        onClick={() => fabAction('/horario', { openModal: true })}
                    />
                </div>

                {/* Main FAB button */}
                <button
                    onClick={() => setFabOpen(!fabOpen)}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-elevated
                        flex items-center justify-center transition-all duration-300 hover:shadow-xl active:scale-95
                        ${fabOpen ? 'rotate-45' : 'rotate-0'}`}
                    aria-label="Acciones rápidas"
                >
                    <Plus size={24} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    )
}

function FabItem({ icon: Icon, label, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 group animate-fade-in"
        >
            <span className="bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-xl shadow-card opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {label}
            </span>
            <div className={`w-11 h-11 rounded-xl ${color} text-white flex items-center justify-center shadow-card transition-all hover:shadow-card-hover active:scale-95`}>
                <Icon size={18} strokeWidth={2} />
            </div>
        </button>
    )
}
