import { Link } from 'react-router-dom'
import { GraduationCap, Wallet, Bot, Clock, CalendarDays, CalendarHeart, ArrowRight, Sparkles } from 'lucide-react'

const modules = [
    {
        to: '/universidad',
        icon: GraduationCap,
        title: 'Gestor Universitario',
        description: 'Organiza tus tareas, entregas y apuntes por asignatura.',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-700',
    },
    {
        to: '/horario',
        icon: Clock,
        title: 'Horario de Clases',
        description: 'Visualiza y edita tu horario semanal de forma interactiva.',
        bgLight: 'bg-sky-50',
        textColor: 'text-sky-700',
    },
    {
        to: '/calendario',
        icon: CalendarDays,
        title: 'Calendario',
        description: 'Vista mensual unificada de tareas, clases y finanzas.',
        bgLight: 'bg-indigo-50',
        textColor: 'text-indigo-700',
    },
    {
        to: '/agenda',
        icon: CalendarHeart,
        title: 'Agenda de Festivos',
        description: 'Consulta los festivos oficiales de la Comunidad de Madrid.',
        bgLight: 'bg-rose-50',
        textColor: 'text-rose-700',
    },
    {
        to: '/finanzas',
        icon: Wallet,
        title: 'Control de Finanzas',
        description: 'Registra ingresos, gastos y visualiza tu balance.',
        bgLight: 'bg-emerald-50',
        textColor: 'text-emerald-700',
    },
    {
        to: '/ia',
        icon: Bot,
        title: 'Asesor IA',
        description: 'Chat inteligente para resolver tus dudas al instante.',
        bgLight: 'bg-violet-50',
        textColor: 'text-violet-700',
    },
]

export default function Dashboard() {
    const now = new Date()
    const greeting = now.getHours() < 12
        ? 'Buenos días'
        : now.getHours() < 18
            ? 'Buenas tardes'
            : 'Buenas noches'

    const dateStr = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    return (
        <div className="page-enter space-y-8">
            {/* ── Header ── */}
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium capitalize">
                    <Sparkles size={14} /> {dateStr}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                    {greeting} 👋
                </h1>
                <p className="text-gray-500">
                    Selecciona un módulo para comenzar.
                </p>
            </div>

            {/* ── Module Cards ── */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map(({ to, icon: Icon, title, description, bgLight, textColor }) => (
                    <Link
                        key={to}
                        to={to}
                        className="group glass-card-hover p-6 flex flex-col gap-4"
                    >
                        <div className={`w-12 h-12 rounded-xl ${bgLight} flex items-center justify-center`}>
                            <Icon size={24} className={textColor} strokeWidth={1.8} />
                        </div>
                        <div className="flex-1">
                            <h2 className="font-semibold text-gray-800 mb-1 group-hover:text-primary-700 transition-colors">
                                {title}
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {description}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            Abrir <ArrowRight size={14} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Quick Stats ── */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Resumen rápido
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <QuickStat label="Tareas pendientes" value={countTasks('pendiente')} color="text-amber-600" />
                    <QuickStat label="En curso" value={countTasks('en-curso')} color="text-blue-600" />
                    <QuickStat label="Completadas" value={countTasks('completado')} color="text-emerald-600" />
                    <QuickStat label="Balance" value={getBalance()} color="text-primary-600" isCurrency />
                </div>
            </div>
        </div>
    )
}

function QuickStat({ label, value, color, isCurrency }) {
    return (
        <div className="text-center sm:text-left">
            <p className={`text-2xl font-bold ${color}`}>
                {isCurrency ? `${value >= 0 ? '+' : ''}${value.toFixed(2)} €` : value}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
    )
}

function countTasks(status) {
    try {
        const tasks = JSON.parse(localStorage.getItem('calendario-tasks') || '[]')
        return tasks.filter(t => t.status === status).length
    } catch {
        return 0
    }
}

function getBalance() {
    try {
        const transactions = JSON.parse(localStorage.getItem('calendario-transactions') || '[]')
        return transactions.reduce((acc, t) => acc + (t.type === 'ingreso' ? t.amount : -t.amount), 0)
    } catch {
        return 0
    }
}
