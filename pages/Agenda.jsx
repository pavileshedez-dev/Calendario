import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useVillaSync, computeVillaState } from '../hooks/useVilla'
import {
    CalendarHeart, PartyPopper, MapPin, Flag, Landmark, Clock,
    ChevronRight, ChevronDown, ChevronUp, Plus, CheckCircle2,
    Circle, Trash2, ListTodo, CalendarPlus, X, StickyNote,
    Sparkles, GraduationCap, Zap, Timer, AlertTriangle,
    Download, RefreshCw, BookOpen,
} from 'lucide-react'

// ── Asignaturas Plan Logopedia (INMUTABLE) ──
const ASIGNATURAS = [
    "Adquisición y Desarrollo del Lenguaje",
    "Estadística I",
    "Estadística II",
    "Trastornos de la Voz y de la Audición",
    "Trastornos Estructurales de las Funciones Orofaciales",
    "Trastornos del Desarrollo y del Aprendizaje",
    "Trastornos del Lenguaje de Etiología Neurológica",
    "Trastornos del Lenguaje en Problemas Psicopatológicos",
    "Evaluación I",
    "Evaluación II",
    "Exploración de la Audición y de la Voz",
]

function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ── Festivos Comunidad de Madrid 2026 ──
const HOLIDAYS = [
    { date: '2026-01-01', name: 'Año Nuevo', type: 'nacional' },
    { date: '2026-01-06', name: 'Día de Reyes', type: 'nacional' },
    { date: '2026-04-02', name: 'Jueves Santo', type: 'autonomico' },
    { date: '2026-04-03', name: 'Viernes Santo', type: 'nacional' },
    { date: '2026-05-01', name: 'Día del Trabajo', type: 'nacional' },
    { date: '2026-05-02', name: 'Fiesta de la Comunidad de Madrid', type: 'autonomico' },
    { date: '2026-08-15', name: 'Asunción de la Virgen', type: 'nacional' },
    { date: '2026-10-12', name: 'Fiesta Nacional de España', type: 'nacional' },
    { date: '2026-11-01', name: 'Todos los Santos', type: 'nacional' },
    { date: '2026-11-09', name: 'La Almudena', type: 'local' },
    { date: '2026-12-06', name: 'Día de la Constitución', type: 'nacional' },
    { date: '2026-12-08', name: 'Inmaculada Concepción', type: 'nacional' },
    { date: '2026-12-25', name: 'Navidad', type: 'nacional' },
]

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const TYPE_CONFIG = {
    nacional: { label: 'Nacional', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: Flag, dot: 'bg-blue-500' },
    autonomico: { label: 'Autonómico', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', icon: Landmark, dot: 'bg-purple-500' },
    local: { label: 'Local', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: MapPin, dot: 'bg-amber-500' },
    personal: { label: 'Personal', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-100', icon: GraduationCap, dot: 'bg-teal-500' },
}

const CUSTOM_TYPES = [
    { key: 'personal', label: 'Huelga / Facultad / Otro' },
    { key: 'local', label: 'Festivo local' },
    { key: 'autonomico', label: 'Festivo autonómico' },
    { key: 'nacional', label: 'Festivo nacional' },
]

const FILTER_OPTIONS = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'completed', label: 'Completadas' },
    { key: 'exams', label: '📅 Exámenes' },
]

// ════════════════════════════════════════
// Autocomplete de asignaturas tipo RENFE
// ════════════════════════════════════════
function AsignaturaAutocomplete({ value, onChange, placeholder = 'Buscar asignatura…', required }) {
    const [query, setQuery] = useState(value || '')
    const [open, setOpen] = useState(false)
    const [focused, setFocused] = useState(false)
    const wrapperRef = useRef(null)

    const suggestions = useMemo(() => {
        if (!query.trim()) return []
        const q = normalize(query)
        return ASIGNATURAS.filter(a => normalize(a).includes(q))
    }, [query])

    useEffect(() => {
        function handleClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    function select(asig) {
        setQuery(asig)
        onChange(asig)
        setOpen(false)
    }

    function handleChange(e) {
        setQuery(e.target.value)
        onChange('')    // reset valid value until selection
        setOpen(true)
    }

    function handleBlur() {
        setFocused(false)
        // If typed matches exactly, accept
        const exact = ASIGNATURAS.find(a => normalize(a) === normalize(query))
        if (exact) { onChange(exact); setQuery(exact) }
    }

    return (
        <div ref={wrapperRef} className="relative">
            <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => { setFocused(true); setOpen(true) }}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="input-field pl-9 pr-3"
                autoComplete="off"
                required={required}
            />
            {open && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-surface-200 rounded-xl shadow-elevated max-h-56 overflow-y-auto animate-fade-in">
                    {suggestions.map(a => (
                        <li key={a}>
                            <button
                                type="button"
                                onMouseDown={() => select(a)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            >
                                {a}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {open && query.length > 1 && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-red-100 rounded-xl shadow-elevated px-4 py-3 text-sm text-red-500 animate-fade-in">
                    ⚠ No coincide con ninguna asignatura oficial
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════
// Medidor de Energía Gamificado
// ════════════════════════════════════════
function EnergyMeter({ value, max = 20 }) {
    const pct = Math.min((value / max) * 100, 100)
    const color = pct < 30 ? 'from-amber-400 to-orange-500' : pct < 70 ? 'from-blue-400 to-indigo-500' : 'from-emerald-400 to-teal-500'
    return (
        <div className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <Zap size={12} className="text-amber-500" /> Energía La Villa
                </span>
                <span className="text-sm font-bold text-gray-700">{value} / {max}</span>
            </div>
            <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <p className="text-[10px] text-gray-400">
                {pct < 30 ? '¡Ánimo! Completa tareas para ganar energía.' : pct < 70 ? 'Buen ritmo. ¡Sigue así!' : '¡Energía al máximo! 🔥'}
            </p>
        </div>
    )
}

// ════════════════════════════════════════
// Temporizador Modo Foco (25 min)
// ════════════════════════════════════════
function FocusTimer({ onFinish }) {
    const DURACION = 25 * 60 // 25 min en segundos
    const [segundos, setSegundos] = useState(DURACION)
    const [activo, setActivo] = useState(false)
    const [asignatura, setAsignatura] = useState('')
    const [done, setDone] = useState(false)
    const intervalRef = useRef(null)

    const min = String(Math.floor(segundos / 60)).padStart(2, '0')
    const sec = String(segundos % 60).padStart(2, '0')
    const pct = ((DURACION - segundos) / DURACION) * 100

    useEffect(() => {
        if (activo && segundos > 0) {
            intervalRef.current = setInterval(() => setSegundos(s => s - 1), 1000)
        } else if (segundos === 0 && activo) {
            clearInterval(intervalRef.current)
            setActivo(false)
            setDone(true)
            onFinish(asignatura)
        }
        return () => clearInterval(intervalRef.current)
    }, [activo, segundos])

    function toggle() {
        setActivo(a => !a)
    }

    function reset() {
        clearInterval(intervalRef.current)
        setActivo(false)
        setSegundos(DURACION)
        setDone(false)
    }

    return (
        <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Timer size={16} className="text-indigo-500" />
                    Modo Foco · 25 min
                </h3>
                {done && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-semibold animate-fade-in">
                        +25 min · +2⚡
                    </span>
                )}
            </div>

            {/* Asignatura selector */}
            <AsignaturaAutocomplete
                value={asignatura}
                onChange={setAsignatura}
                placeholder="Vincular a asignatura (opcional)…"
            />

            {/* Timer display */}
            <div className="relative flex items-center justify-center py-4">
                <svg className="absolute w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#e9ecf5" strokeWidth="8" />
                    <circle
                        cx="50" cy="50" r="44" fill="none"
                        stroke={done ? '#10b981' : '#4c6ef5'} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${276 * pct / 100} 276`}
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="text-center z-10">
                    <p className={`text-3xl font-bold font-mono ${done ? 'text-emerald-600' : 'text-gray-800'}`}>
                        {done ? '✓' : `${min}:${sec}`}
                    </p>
                    {done && <p className="text-xs text-emerald-600 font-semibold mt-1">¡Sesión completada!</p>}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={toggle}
                    disabled={done}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activo
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } disabled:opacity-40`}
                >
                    {activo ? '⏸ Pausar' : done ? '✓ Completado' : '▶ Iniciar'}
                </button>
                <button
                    type="button"
                    onClick={reset}
                    className="px-3 py-2.5 rounded-xl bg-surface-100 text-gray-500 hover:bg-surface-200 transition-all"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {asignatura && (
                <p className="text-[11px] text-gray-400 text-center">
                    📚 {asignatura}
                </p>
            )}
        </div>
    )
}

// ════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ════════════════════════════════════════
export default function Agenda() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = formatDateKey(today)

    // ── State ──
    const [tasks, setTasks] = useLocalStorage('agenda-tasks', [])
    const [customHolidays, setCustomHolidays] = useLocalStorage('agenda-custom-holidays', [])
    const [energia, setEnergia] = useLocalStorage('villa-energia', 0)
    const [minutosFoco, setMinutosFoco] = useLocalStorage('villa-minutos-foco', 0)

    // Form state
    const [showForm, setShowForm] = useState(false)
    const [taskTitle, setTaskTitle] = useState('')
    const [taskDescription, setTaskDescription] = useState('')
    const [taskDueDate, setTaskDueDate] = useState(todayKey)
    const [taskAsig, setTaskAsig] = useState('')
    const [taskHighPriority, setTaskHighPriority] = useState(false)
    const [taskIsExam, setTaskIsExam] = useState(false)
    const [filter, setFilter] = useState('all')
    const [quickText, setQuickText] = useState('')
    const [holidaysExpanded, setHolidaysExpanded] = useState(true)
    const [showTimerSection, setShowTimerSection] = useState(false)

    // Holiday form
    const [showHolidayForm, setShowHolidayForm] = useState(false)
    const [holidayName, setHolidayName] = useState('')
    const [holidayDate, setHolidayDate] = useState(todayKey)
    const [holidayType, setHolidayType] = useState('personal')
    const [holidayIsStrike, setHolidayIsStrike] = useState(false)

    // Villa sync
    const { sync, descargarEstado } = useVillaSync()

    // Auto-sync on any data change
    useEffect(() => { sync() }, [tasks, customHolidays, energia, minutosFoco])

    // ── Holidays merged ──
    const allHolidays = useMemo(() => {
        const merged = [...HOLIDAYS, ...customHolidays]
        merged.sort((a, b) => a.date.localeCompare(b.date))
        return merged
    }, [customHolidays])

    const nextHoliday = useMemo(() =>
        allHolidays.find(h => new Date(h.date + 'T00:00:00') >= today) || null
        , [allHolidays])

    const daysUntilNext = useMemo(() => {
        if (!nextHoliday) return null
        const target = new Date(nextHoliday.date + 'T00:00:00')
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
    }, [nextHoliday])

    const groupedByMonth = useMemo(() => {
        const groups = {}
        allHolidays.forEach(h => {
            const month = parseInt(h.date.split('-')[1], 10) - 1
            if (!groups[month]) groups[month] = []
            groups[month].push(h)
        })
        return groups
    }, [allHolidays])

    // ── Próximo examen ──
    const proximoExamen = useMemo(() => {
        return tasks
            .filter(t => t.isExam && !t.completed && t.dueDate >= todayKey)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] || null
    }, [tasks])

    const diasHastaExamen = useMemo(() => {
        if (!proximoExamen) return null
        const d = new Date(proximoExamen.dueDate + 'T00:00:00')
        return Math.ceil((d - today) / (1000 * 60 * 60 * 24))
    }, [proximoExamen])

    // ── Task helpers ──
    function addTask(title, description, dueDate, asig, highPriority, isExam) {
        if (!title.trim()) return
        // Validate asignatura if provided
        if (asig && !ASIGNATURAS.includes(asig)) {
            alert('⚠ La asignatura no pertenece al Plan de Logopedia. Selecciona una de la lista.')
            return
        }
        const newTask = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            title: title.trim(),
            description: description.trim(),
            dueDate: dueDate || todayKey,
            completed: false,
            highPriority: !!highPriority,
            isExam: !!isExam,
            asignatura: asig || null,
            createdAt: new Date().toISOString(),
        }
        setTasks(prev => [newTask, ...prev])
    }

    function toggleTask(id) {
        setTasks(prev => prev.map(t => {
            if (t.id !== id) return t
            const nowCompleted = !t.completed
            if (nowCompleted) setEnergia(e => e + 1) // +1 energía al completar
            return { ...t, completed: nowCompleted }
        }))
    }

    function deleteTask(id) {
        setTasks(prev => prev.filter(t => t.id !== id))
    }

    // ── Holiday helpers ──
    function addCustomHoliday(e) {
        e.preventDefault()
        if (!holidayName.trim() || !holidayDate) return
        const newHoliday = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            date: holidayDate,
            name: holidayName.trim(),
            type: holidayType,
            custom: true,
            isStrike: holidayIsStrike,
        }
        setCustomHolidays(prev => [...prev, newHoliday])
        setHolidayName('')
        setHolidayDate(todayKey)
        setHolidayType('personal')
        setHolidayIsStrike(false)
        setShowHolidayForm(false)
    }

    function deleteCustomHoliday(id) {
        setCustomHolidays(prev => prev.filter(h => h.id !== id))
    }

    function handleQuickAdd(e) {
        e.preventDefault()
        if (!quickText.trim()) return
        addTask(quickText, '', todayKey, '', false, false)
        setQuickText('')
    }

    function handleFormSubmit(e) {
        e.preventDefault()
        addTask(taskTitle, taskDescription, taskDueDate, taskAsig, taskHighPriority, taskIsExam)
        setTaskTitle('')
        setTaskDescription('')
        setTaskDueDate(todayKey)
        setTaskAsig('')
        setTaskHighPriority(false)
        setTaskIsExam(false)
        setShowForm(false)
    }

    // Focus timer finish
    function handleTimerFinish(asig) {
        setMinutosFoco(m => m + 25)
        setEnergia(e => e + 2)
    }

    // ── Filtered tasks ──
    const filteredTasks = useMemo(() => {
        let result = [...tasks]
        if (filter === 'pending') result = result.filter(t => !t.completed)
        if (filter === 'completed') result = result.filter(t => t.completed)
        if (filter === 'exams') result = result.filter(t => t.isExam)
        return result
    }, [tasks, filter])

    const todayTasks = filteredTasks.filter(t => t.dueDate === todayKey)
    const upcomingTasks = filteredTasks.filter(t => t.dueDate > todayKey)
    const pastTasks = filteredTasks.filter(t => t.dueDate < todayKey)

    const pendingCount = tasks.filter(t => !t.completed).length
    const completedCount = tasks.filter(t => t.completed).length
    const examCount = tasks.filter(t => t.isExam && !t.completed).length

    return (
        <div className="page-enter space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <ListTodo size={28} className="text-indigo-500" strokeWidth={1.8} />
                        Mi Agenda
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Organiza tus tareas, exámenes y sesiones de estudio.
                    </p>
                </div>
                <button
                    onClick={descargarEstado}
                    title="Sincronizar con La Villa"
                    className="btn-secondary text-xs flex items-center gap-1.5 shrink-0"
                >
                    <Download size={13} />
                    Sincronizar Villa
                </button>
            </div>

            {/* Energy meter */}
            <EnergyMeter value={energia} />

            {/* Próximo examen banner */}
            {proximoExamen && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 border border-rose-100 animate-fade-in">
                    <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-rose-700 truncate">
                            📅 {proximoExamen.title}
                        </p>
                        <p className="text-xs text-rose-500">
                            {diasHastaExamen === 0 ? '¡Es hoy!' : diasHastaExamen === 1 ? 'Mañana' : `en ${diasHastaExamen} días`}
                            {proximoExamen.asignatura && ` · ${proximoExamen.asignatura}`}
                        </p>
                    </div>
                    <span className="text-lg font-bold text-rose-600 shrink-0">
                        {diasHastaExamen === 0 ? '🔴' : diasHastaExamen <= 3 ? '🟠' : '🟡'}
                    </span>
                </div>
            )}

            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-2">
                <div className="glass-card p-3 text-center">
                    <p className="text-xl font-bold text-indigo-600">{tasks.length}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Total</p>
                </div>
                <div className="glass-card p-3 text-center">
                    <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Pendientes</p>
                </div>
                <div className="glass-card p-3 text-center">
                    <p className="text-xl font-bold text-emerald-500">{completedCount}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Completadas</p>
                </div>
                <div className="glass-card p-3 text-center">
                    <p className="text-xl font-bold text-rose-500">{examCount}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Exámenes</p>
                </div>
            </div>

            {/* Focus Timer toggle */}
            <button
                onClick={() => setShowTimerSection(s => !s)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:text-indigo-700 transition-all duration-200 text-sm font-medium"
            >
                <Timer size={16} />
                {showTimerSection ? 'Ocultar temporizador' : 'Modo Foco · 25 min'}
            </button>

            {showTimerSection && (
                <div className="animate-slide-up">
                    <FocusTimer onFinish={handleTimerFinish} />
                </div>
            )}

            {/* Quick Add */}
            <form onSubmit={handleQuickAdd} className="flex gap-2">
                <div className="relative flex-1">
                    <StickyNote size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={quickText}
                        onChange={e => setQuickText(e.target.value)}
                        placeholder="Añadir nota rápida para hoy…"
                        className="input-field pl-10"
                    />
                </div>
                <button type="submit" className="btn-primary px-4" disabled={!quickText.trim()}>
                    <Plus size={18} />
                </button>
            </form>

            {/* Detailed form toggle */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-surface-200 text-gray-400 hover:border-primary-300 hover:text-primary-600 transition-all duration-200"
                >
                    <CalendarPlus size={18} />
                    <span className="text-sm font-medium">Crear tarea / examen con fecha</span>
                </button>
            )}

            {/* Detailed form */}
            {showForm && (
                <form onSubmit={handleFormSubmit} className="glass-card p-5 space-y-4 animate-slide-up">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Sparkles size={16} className="text-primary-500" />
                            Nueva tarea
                        </h3>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-ghost p-1.5">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Título *</label>
                        <input
                            type="text"
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            placeholder="¿Qué necesitas hacer?"
                            className="input-field"
                            autoFocus
                            required
                        />
                    </div>

                    {/* Asignatura autocomplete */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Asignatura (Plan Logopedia)</label>
                        <AsignaturaAutocomplete
                            value={taskAsig}
                            onChange={setTaskAsig}
                            placeholder="Buscar asignatura oficial…"
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Descripción (opcional)</label>
                        <textarea
                            value={taskDescription}
                            onChange={e => setTaskDescription(e.target.value)}
                            placeholder="Notas o detalles adicionales…"
                            rows={2}
                            className="input-field resize-none"
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={taskDueDate}
                            onChange={e => setTaskDueDate(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="flex gap-3">
                        {/* Alta Prioridad toggle */}
                        <button
                            type="button"
                            onClick={() => setTaskHighPriority(p => !p)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${taskHighPriority
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-surface-50 border-surface-200 text-gray-400 hover:border-amber-200'
                                }`}
                        >
                            <Zap size={13} className={taskHighPriority ? 'text-amber-500' : ''} />
                            Alta Prioridad
                        </button>

                        {/* Es Examen checkbox */}
                        <button
                            type="button"
                            onClick={() => setTaskIsExam(p => !p)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${taskIsExam
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : 'bg-surface-50 border-surface-200 text-gray-400 hover:border-rose-200'
                                }`}
                        >
                            <AlertTriangle size={13} className={taskIsExam ? 'text-rose-500' : ''} />
                            Examen / Entrega
                        </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button type="submit" className="btn-primary flex-1" disabled={!taskTitle.trim()}>
                            <Plus size={16} /> Crear tarea
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Filter tabs */}
            <div className="flex gap-1 bg-surface-100 p-1 rounded-xl">
                {FILTER_OPTIONS.map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setFilter(opt.key)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${filter === opt.key
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Task lists */}
            {todayTasks.length > 0 && (
                <TaskSection
                    title="Hoy"
                    icon={<Sparkles size={14} className="text-primary-500" />}
                    tasks={todayTasks}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    accent="primary"
                    today={today}
                />
            )}
            {upcomingTasks.length > 0 && (
                <TaskSection
                    title="Próximas"
                    icon={<CalendarPlus size={14} className="text-blue-500" />}
                    tasks={upcomingTasks}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    accent="blue"
                    today={today}
                />
            )}
            {pastTasks.length > 0 && (
                <TaskSection
                    title="Pasadas"
                    icon={<Clock size={14} className="text-gray-400" />}
                    tasks={pastTasks}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                    accent="gray"
                    today={today}
                />
            )}

            {filteredTasks.length === 0 && (
                <div className="glass-card p-8 text-center">
                    <ListTodo size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">
                        {filter === 'all' ? 'Aún no tienes tareas. ¡Añade una arriba!'
                            : filter === 'pending' ? 'No hay tareas pendientes. ¡Buen trabajo! 🎉'
                                : filter === 'completed' ? 'No hay tareas completadas aún.'
                                    : 'No hay exámenes registrados.'}
                    </p>
                </div>
            )}

            {/* ═══ FESTIVOS ═══ */}
            <div className="pt-4 border-t border-surface-200">
                <button
                    onClick={() => setHolidaysExpanded(!holidaysExpanded)}
                    className="w-full flex items-center justify-between mb-4"
                >
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <CalendarHeart size={24} className="text-rose-500" strokeWidth={1.8} />
                            Festivos
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5 text-left">Comunidad de Madrid — 2026</p>
                    </div>
                    {holidaysExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </button>

                {holidaysExpanded && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Next Holiday Card */}
                        {nextHoliday && (
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-700 text-white p-6 shadow-elevated">
                                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium mb-3">
                                        <PartyPopper size={16} /> Próximo festivo
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">{nextHoliday.name}</h2>
                                    <p className="text-white/80 text-sm mb-4">{formatDateLong(nextHoliday.date)}</p>
                                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
                                        <Clock size={16} />
                                        <span className="font-semibold text-lg">
                                            {daysUntilNext === 0 ? '¡Es hoy! 🎉' : daysUntilNext === 1 ? 'Mañana' : `${daysUntilNext} días`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add holiday form */}
                        {!showHolidayForm ? (
                            <button
                                onClick={() => setShowHolidayForm(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-surface-200 text-gray-400 hover:border-teal-300 hover:text-teal-600 transition-all duration-200"
                            >
                                <Plus size={18} />
                                <span className="text-sm font-medium">Añadir festivo / huelga</span>
                            </button>
                        ) : (
                            <form onSubmit={addCustomHoliday} className="glass-card p-5 space-y-4 animate-slide-up">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <GraduationCap size={16} className="text-teal-500" />
                                        Nuevo festivo / huelga
                                    </h3>
                                    <button type="button" onClick={() => setShowHolidayForm(false)} className="btn-ghost p-1.5">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={holidayName}
                                        onChange={e => setHolidayName(e.target.value)}
                                        placeholder="Ej: Huelga General, Día sin clase..."
                                        className="input-field"
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            value={holidayDate}
                                            onChange={e => setHolidayDate(e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                                        <select
                                            value={holidayType}
                                            onChange={e => setHolidayType(e.target.value)}
                                            className="input-field"
                                        >
                                            {CUSTOM_TYPES.map(t => (
                                                <option key={t.key} value={t.key}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* ¿Es huelga? */}
                                <button
                                    type="button"
                                    onClick={() => setHolidayIsStrike(s => !s)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${holidayIsStrike
                                        ? 'bg-red-50 border-red-300 text-red-700'
                                        : 'bg-surface-50 border-surface-200 text-gray-400 hover:border-red-200'
                                        }`}
                                >
                                    <AlertTriangle size={13} className={holidayIsStrike ? 'text-red-500' : ''} />
                                    Marcar como Huelga General (tachará clases e immunidad de racha)
                                </button>

                                <div className="flex gap-2 pt-1">
                                    <button type="submit" className="btn-primary flex-1" disabled={!holidayName.trim()}>
                                        <Plus size={16} /> Añadir
                                    </button>
                                    <button type="button" onClick={() => setShowHolidayForm(false)} className="btn-secondary">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Type legend */}
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                                <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                                    {cfg.label}
                                </div>
                            ))}
                            <div className="flex items-center gap-1.5 text-xs text-red-400">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                Huelga
                            </div>
                        </div>

                        {/* Holidays by month */}
                        <div className="space-y-4">
                            {Object.entries(groupedByMonth).map(([monthIdx, holidays]) => (
                                <div key={monthIdx} className="glass-card overflow-hidden">
                                    <div className="px-5 py-3 bg-surface-50 border-b border-surface-200">
                                        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                                            {MONTHS[monthIdx]}
                                        </h3>
                                    </div>
                                    <div className="divide-y divide-surface-100">
                                        {holidays.map((h, idx) => {
                                            const cfg = TYPE_CONFIG[h.type] || TYPE_CONFIG.personal
                                            const Icon = cfg.icon
                                            const d = new Date(h.date + 'T00:00:00')
                                            const isPast = d < today
                                            const isToday = d.getTime() === today.getTime()
                                            const isStrike = h.isStrike

                                            return (
                                                <div
                                                    key={h.id || h.date + idx}
                                                    className={`flex items-center gap-4 px-5 py-4 transition-colors
                                                        ${isStrike ? 'bg-red-50/60' : isToday ? 'bg-primary-50/60' : 'hover:bg-surface-50'}
                                                        ${isPast ? 'opacity-50' : ''}
                                                    `}
                                                >
                                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center
                                                        ${isStrike ? 'bg-red-100 border border-red-200' : isToday ? 'bg-primary-600 text-white shadow-md' : `${cfg.bg} ${cfg.border} border`}
                                                    `}>
                                                        <span className={`text-lg font-bold leading-none ${isStrike ? 'text-red-700' : isToday ? '' : cfg.text}`}>
                                                            {d.getDate()}
                                                        </span>
                                                        <span className={`text-[10px] font-medium uppercase leading-none mt-0.5 ${isStrike ? 'text-red-500' : isToday ? 'text-white/80' : 'text-gray-400'}`}>
                                                            {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold truncate ${isStrike ? 'text-red-700 line-through' : isToday ? 'text-primary-700' : 'text-gray-800'}`}>
                                                            {h.name}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <Icon size={12} className={isStrike ? 'text-red-500' : cfg.text} />
                                                            <span className={`text-xs font-medium ${isStrike ? 'text-red-500' : cfg.text}`}>
                                                                {isStrike ? 'Huelga — clases tachadas' : cfg.label}
                                                            </span>
                                                            {h.custom && <span className="text-[10px] text-teal-500 font-medium ml-1">· Personalizado</span>}
                                                        </div>
                                                    </div>

                                                    {h.custom && (
                                                        <button
                                                            onClick={() => deleteCustomHoliday(h.id)}
                                                            className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}

                                                    {isToday ? (
                                                        <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2.5 py-1 rounded-lg whitespace-nowrap">¡Hoy! 🎉</span>
                                                    ) : isPast ? (
                                                        <span className="text-xs text-gray-400">Pasado</span>
                                                    ) : !h.custom ? (
                                                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                                                    ) : null}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center py-4">
                            <p className="text-xs text-gray-400">
                                📍 Festivos oficiales + personalizados · Comunidad de Madrid · 2026
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════
//  Task Section + Item
// ═══════════════════════════════════════

function TaskSection({ title, icon, tasks, onToggle, onDelete, accent, today }) {
    // Normal tasks as text list, high-priority as visual blocks
    const normalTasks = tasks.filter(t => !t.highPriority)
    const priorityTasks = tasks.filter(t => t.highPriority)

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                {icon} {title}
            </p>

            {/* High-priority visual blocks */}
            {priorityTasks.length > 0 && (
                <div className="space-y-2">
                    {priorityTasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} accent={accent} today={today} />
                    ))}
                </div>
            )}

            {/* Normal tasks as compact text list */}
            {normalTasks.length > 0 && (
                <div className="glass-card divide-y divide-surface-100 overflow-hidden">
                    {normalTasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} accent={accent} today={today} compact />
                    ))}
                </div>
            )}
        </div>
    )
}

function TaskItem({ task, onToggle, onDelete, accent, today, compact = false }) {
    const [expanded, setExpanded] = useState(false)
    const d = new Date(task.dueDate + 'T00:00:00')
    const isToday = task.dueDate === formatDateKey(today)
    const isPast = d < today && !isToday

    if (compact) {
        // Texto plano para notas normales
        return (
            <div className={`flex items-center gap-3 px-4 py-2.5 ${isPast && !task.completed ? 'opacity-60' : ''}`}>
                <button onClick={() => onToggle(task.id)} className="flex-shrink-0 transition-transform active:scale-90">
                    {task.completed
                        ? <CheckCircle2 size={18} className="text-emerald-500" />
                        : <Circle size={18} className="text-gray-300 hover:text-primary-400 transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {task.title}
                        {task.asignatura && <span className="ml-1 text-[10px] text-indigo-400">· {task.asignatura.split(' ').slice(0, 2).join(' ')}</span>}
                    </p>
                </div>
                {task.isExam && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-semibold shrink-0">📅 Examen</span>}
                <span className="text-[11px] text-gray-400 shrink-0">{isToday ? 'Hoy' : formatDateShort(task.dueDate)}</span>
                <button onClick={() => onDelete(task.id)} className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-red-400 transition-all">
                    <Trash2 size={13} />
                </button>
            </div>
        )
    }

    // Visual block para alta prioridad
    const accentColors = {
        primary: { bg: task.completed ? 'bg-emerald-50' : 'bg-amber-50', border: task.completed ? 'border-emerald-200' : 'border-amber-300' },
        blue: { bg: task.completed ? 'bg-emerald-50' : 'bg-amber-50', border: task.completed ? 'border-emerald-200' : 'border-amber-300' },
        gray: { bg: task.completed ? 'bg-emerald-50' : 'bg-amber-50/60', border: task.completed ? 'border-emerald-200' : 'border-amber-200' },
    }
    const colors = accentColors[accent] || accentColors.gray

    return (
        <div className={`${colors.bg} border-2 ${colors.border} rounded-xl transition-all duration-200 ${isPast && !task.completed ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => onToggle(task.id)} className="flex-shrink-0 transition-transform active:scale-90">
                    {task.completed
                        ? <CheckCircle2 size={22} className="text-emerald-500" />
                        : <Circle size={22} className="text-amber-400 hover:text-amber-500 transition-colors" />}
                </button>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => task.description && setExpanded(!expanded)}>
                    <div className="flex items-center gap-2">
                        <Zap size={12} className="text-amber-500 shrink-0" />
                        <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                        </p>
                        {task.isExam && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-semibold shrink-0">📅 Examen</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">{isToday ? 'Hoy' : formatDateShort(task.dueDate)}</span>
                        {task.asignatura && <span className="text-[11px] text-indigo-500 font-medium">· {task.asignatura}</span>}
                        {task.description && <span className="text-[11px] text-gray-300">· {expanded ? 'Ocultar' : 'Ver más'}</span>}
                    </div>
                </div>
                <button onClick={() => onDelete(task.id)} className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all">
                    <Trash2 size={15} />
                </button>
            </div>
            {expanded && task.description && (
                <div className="px-4 pb-3 pl-[52px]">
                    <p className="text-xs text-gray-500 leading-relaxed bg-white/60 rounded-lg p-2.5">{task.description}</p>
                </div>
            )}
        </div>
    )
}

// ── Helpers ──
function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateLong(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
