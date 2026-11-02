import { useState, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useVillaSync } from '../hooks/useVilla'
import {
    CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Clock,
    ArrowUpCircle, ArrowDownCircle, GraduationCap, Wallet, ListTodo,
    CheckCircle2, PartyPopper, CalendarHeart, AlertTriangle, Zap,
} from 'lucide-react'

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

const OFFICIAL_HOLIDAY_DATES = new Set(HOLIDAYS.map(h => h.date))

const DAYS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function Calendario() {
    const [tasks] = useLocalStorage('calendario-tasks', [])
    const [transactions] = useLocalStorage('calendario-transactions', [])
    const [horario] = useLocalStorage('calendario-horario', [])
    const [agendaTasks] = useLocalStorage('agenda-tasks', [])
    const [customHolidays] = useLocalStorage('agenda-custom-holidays', [])

    const { descargarEstado } = useVillaSync()

    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [selectedDate, setSelectedDate] = useState(null)

    const calendarDays = useMemo(() => buildCalendar(currentYear, currentMonth), [currentYear, currentMonth])

    // ── Strike days set ──
    const strikeDates = useMemo(() => new Set(
        customHolidays.filter(h => h.isStrike).map(h => h.date)
    ), [customHolidays])

    // ── All exempt dates (holidays + custom + strikes) ──
    const exemptDates = useMemo(() => {
        const s = new Set(OFFICIAL_HOLIDAY_DATES)
        customHolidays.forEach(h => s.add(h.date))
        return s
    }, [customHolidays])

    // ── Events map ──
    const eventsMap = useMemo(() => {
        const map = {}

        tasks.forEach(task => {
            if (!task.dueDate) return
            const key = task.dueDate
            if (!map[key]) map[key] = []
            map[key].push({
                type: 'task', title: task.title, subtitle: task.asignatura,
                status: task.status,
                color: task.status === 'completado' ? 'emerald' : task.status === 'en-curso' ? 'blue' : 'amber',
            })
        })

        transactions.forEach(tx => {
            const d = new Date(tx.date)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            if (!map[key]) map[key] = []
            map[key].push({
                type: 'transaction', title: tx.description,
                subtitle: `${tx.type === 'ingreso' ? '+' : '-'}${tx.amount.toFixed(2)} €`,
                txType: tx.type,
                color: tx.type === 'ingreso' ? 'emerald' : 'red',
            })
        })

        // Agenda tasks — high-priority ones appear as visual blocks
        agendaTasks.forEach(at => {
            if (!at.dueDate) return
            const key = at.dueDate
            if (!map[key]) map[key] = []
            map[key].push({
                type: 'agenda', title: at.title,
                subtitle: at.completed ? 'Completada' : 'Pendiente',
                status: at.completed ? 'completado' : 'pendiente',
                highPriority: at.highPriority,
                isExam: at.isExam,
                asignatura: at.asignatura,
                color: at.isExam ? 'rose' : at.completed ? 'emerald' : at.highPriority ? 'amber' : 'violet',
            })
        })

        HOLIDAYS.forEach(h => {
            const key = h.date
            if (!map[key]) map[key] = []
            map[key].push({ type: 'holiday', title: h.name, subtitle: h.type === 'nacional' ? 'Nacional' : h.type === 'autonomico' ? 'Autonómico' : 'Local', color: 'rose' })
        })

        customHolidays.forEach(h => {
            const key = h.date
            if (!map[key]) map[key] = []
            map[key].push({
                type: 'holiday', title: h.name,
                subtitle: h.isStrike ? 'Huelga' : 'Personalizado',
                color: h.isStrike ? 'red' : 'teal',
                custom: true, isStrike: h.isStrike,
            })
        })

        return map
    }, [tasks, transactions, agendaTasks, customHolidays])

    // ── Classes for selected day (respecting strikes) ──
    const selectedDayClasses = useMemo(() => {
        if (!selectedDate) return []
        if (strikeDates.has(selectedDate)) return [] // Huelga: no classes
        if (exemptDates.has(selectedDate)) return []
        const d = new Date(selectedDate)
        const jsDay = d.getDay()
        const dayIdx = jsDay === 0 ? -1 : jsDay - 1
        if (dayIdx < 0 || dayIdx > 4) return []
        return horario.filter(c => c.day === dayIdx).sort((a, b) => a.startHour - b.startHour)
    }, [selectedDate, horario, strikeDates, exemptDates])

    function prevMonth() {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1) }
        else setCurrentMonth(currentMonth - 1)
        setSelectedDate(null)
    }

    function nextMonth() {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1) }
        else setCurrentMonth(currentMonth + 1)
        setSelectedDate(null)
    }

    const todayKey = formatDate(today)

    return (
        <div className="page-enter space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarDays size={28} className="text-indigo-600" strokeWidth={1.8} />
                        Calendario
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Vista unificada de tareas, clases y finanzas.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDate(formatDate(today)) }}
                        className="btn-secondary text-sm">
                        Hoy
                    </button>
                    <button onClick={descargarEstado} className="btn-secondary text-sm flex items-center gap-1.5">
                        <Zap size={13} className="text-amber-500" /> Sync Villa
                    </button>
                </div>
            </div>

            {/* Month Nav */}
            <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeft size={20} /></button>
                <h2 className="text-lg font-bold text-gray-800">{MONTHS[currentMonth]} {currentYear}</h2>
                <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRight size={20} /></button>
            </div>

            {/* Calendar Grid */}
            <div className="glass-card overflow-hidden">
                <div className="grid grid-cols-7 border-b border-surface-200">
                    {DAYS_HEADER.map(d => (
                        <div key={d} className="p-2 text-center text-xs font-semibold text-gray-400 bg-surface-50">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {calendarDays.map((day, i) => {
                        const dateKey = day ? formatDate(new Date(currentYear, currentMonth, day)) : null
                        const events = dateKey ? eventsMap[dateKey] || [] : []
                        const isToday = dateKey === todayKey
                        const isSelected = dateKey === selectedDate
                        const isWeekend = i % 7 >= 5
                        const isOfficialHoliday = dateKey && OFFICIAL_HOLIDAY_DATES.has(dateKey)
                        const isCustomHoliday = dateKey && customHolidays.some(h => h.date === dateKey && !h.isStrike)
                        const isStrike = dateKey && strikeDates.has(dateKey)

                        // ── Cell background logic ──
                        let cellBg = ''
                        if (isStrike) cellBg = 'bg-red-50'
                        else if (isOfficialHoliday || isCustomHoliday) cellBg = 'bg-blue-50/60'
                        else if (isWeekend && day) cellBg = 'bg-surface-50/50'

                        // High-priority agenda events for this day
                        const highPriorityEvents = events.filter(e => e.type === 'agenda' && e.highPriority && !e.status !== 'completado')
                        const examEvents = events.filter(e => e.type === 'agenda' && e.isExam)

                        return (
                            <div
                                key={i}
                                onClick={() => day && setSelectedDate(dateKey)}
                                className={`min-h-[64px] sm:min-h-[80px] p-1.5 border-b border-r border-surface-100 transition-colors cursor-pointer
                                    ${!day ? 'bg-surface-50/30' : cellBg}
                                    ${isSelected ? 'ring-1 ring-inset ring-primary-300 bg-primary-50' : day ? 'hover:bg-surface-50' : ''}
                                `}
                            >
                                {day && (
                                    <>
                                        <div className={`text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full mx-auto sm:mx-0
                                            ${isToday ? 'bg-primary-600 text-white' : isStrike ? 'text-red-500' : isOfficialHoliday ? 'text-blue-600' : 'text-gray-500'}
                                        `}>
                                            {day}
                                        </div>

                                        {/* Strike indicator */}
                                        {isStrike && (
                                            <div className="hidden sm:block text-[9px] text-red-400 font-semibold truncate px-0.5">🚫 Huelga</div>
                                        )}

                                        {/* Desktop events */}
                                        <div className="hidden sm:flex flex-col gap-0.5">
                                            {/* Exam events first */}
                                            {examEvents.slice(0, 1).map((ev, j) => (
                                                <div key={'e' + j} className="text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-rose-100 text-rose-700 font-semibold">
                                                    📅 {ev.title}
                                                </div>
                                            ))}
                                            {/* High-priority blocks */}
                                            {highPriorityEvents.filter(e => !e.isExam).slice(0, 1).map((ev, j) => (
                                                <div key={'h' + j} className="text-[10px] leading-tight px-1 py-0.5 rounded truncate bg-amber-100 text-amber-700 font-semibold">
                                                    ⚡ {ev.title}
                                                </div>
                                            ))}
                                            {/* Normal events */}
                                            {events.filter(e => !(e.type === 'agenda' && (e.highPriority || e.isExam)))
                                                .slice(0, examEvents.length > 0 ? 1 : 2).map((ev, j) => (
                                                    <div key={j} className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate
                                                        ${isStrike && ev.type !== 'holiday' ? 'line-through opacity-40' : ''}
                                                        ${ev.color === 'emerald' ? 'bg-emerald-100 text-emerald-700'
                                                            : ev.color === 'blue' ? 'bg-blue-100 text-blue-700'
                                                                : ev.color === 'violet' ? 'bg-violet-100 text-violet-700'
                                                                    : ev.color === 'rose' ? 'bg-rose-100 text-rose-700'
                                                                        : ev.color === 'teal' ? 'bg-teal-100 text-teal-700'
                                                                            : ev.color === 'amber' ? 'bg-amber-100 text-amber-700'
                                                                                : 'bg-red-100 text-red-700'}`}>
                                                        {ev.title}
                                                    </div>
                                                ))}
                                            {events.length > 3 && (
                                                <div className="text-[10px] text-gray-400 px-1">+{events.length - 3} más</div>
                                            )}
                                        </div>

                                        {/* Mobile dots */}
                                        {events.length > 0 && (
                                            <div className="sm:hidden flex justify-center gap-0.5 mt-0.5">
                                                {events.slice(0, 4).map((ev, j) => (
                                                    <div key={j} className={`w-1.5 h-1.5 rounded-full
                                                        ${ev.color === 'emerald' ? 'bg-emerald-500'
                                                            : ev.color === 'blue' ? 'bg-blue-500'
                                                                : ev.color === 'violet' ? 'bg-violet-500'
                                                                    : ev.color === 'rose' ? 'bg-rose-500'
                                                                        : ev.color === 'teal' ? 'bg-teal-500'
                                                                            : ev.color === 'amber' ? 'bg-amber-500'
                                                                                : 'bg-red-500'}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Selected Day Detail */}
            {selectedDate && (
                <DayDetail
                    dateKey={selectedDate}
                    events={eventsMap[selectedDate] || []}
                    classes={selectedDayClasses}
                    isStrike={strikeDates.has(selectedDate)}
                />
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Festivo oficial</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Huelga</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> Examen / Festivo</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Alta prioridad</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-violet-500" /> Agenda</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Completado / Ingreso</div>
            </div>
        </div>
    )
}

function DayDetail({ dateKey, events, classes, isStrike }) {
    const d = new Date(dateKey + 'T00:00:00')
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    const hasContent = events.length > 0 || classes.length > 0

    return (
        <div className="glass-card p-5 animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 capitalize">{dayName}</h3>
                {isStrike && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                        <AlertTriangle size={11} /> Huelga General
                    </span>
                )}
            </div>

            {!hasContent && <p className="text-sm text-gray-400 py-2">No hay eventos para este día.</p>}

            {/* Classes */}
            {classes.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={11} /> Clases
                    </p>
                    {classes.map(cls => (
                        <div key={cls.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sky-50 border border-sky-100">
                            <Clock size={14} className="text-sky-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{cls.subject}</p>
                                <p className="text-xs text-gray-400">
                                    {String(cls.startHour).padStart(2, '0')}:00 — {String(cls.endHour).padStart(2, '0')}:00
                                    {cls.room ? ` · 📍 ${cls.room}` : ''}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isStrike && classes.length === 0 && (
                <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-xs text-red-500 flex items-center gap-2">
                    <AlertTriangle size={13} /> Las clases de este día están tachadas por huelga
                </div>
            )}

            {/* Holidays */}
            {events.filter(e => e.type === 'holiday').length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <CalendarHeart size={11} /> Festivos / Huelgas
                    </p>
                    {events.filter(e => e.type === 'holiday').map((ev, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                            ${ev.isStrike ? 'bg-red-50 border border-red-100' : ev.color === 'teal' ? 'bg-teal-50 border border-teal-100' : 'bg-rose-50 border border-rose-100'}`}>
                            {ev.isStrike
                                ? <AlertTriangle size={14} className="text-red-500" />
                                : <PartyPopper size={14} className={ev.color === 'teal' ? 'text-teal-600' : 'text-rose-500'} />}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${ev.isStrike ? 'text-red-700 line-through' : 'text-gray-700'}`}>{ev.title}</p>
                                <p className={`text-xs ${ev.isStrike ? 'text-red-500' : ev.color === 'teal' ? 'text-teal-600' : 'text-rose-500'}`}>{ev.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Agenda events (high-priority as blocks) */}
            {events.filter(e => e.type === 'agenda').length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <ListTodo size={11} /> Agenda
                    </p>
                    {events.filter(e => e.type === 'agenda').map((ev, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl border
                            ${ev.isExam ? 'bg-rose-50 border-rose-200'
                                : ev.highPriority ? 'bg-amber-50 border-amber-200'
                                    : ev.status === 'completado' ? 'bg-emerald-50 border-emerald-100'
                                        : 'bg-violet-50 border-violet-100'}`}>
                            {ev.isExam ? <AlertTriangle size={14} className="text-rose-500" />
                                : ev.highPriority ? <Zap size={14} className="text-amber-500" />
                                    : ev.status === 'completado' ? <CheckCircle2 size={14} className="text-emerald-500" />
                                        : <ListTodo size={14} className="text-violet-600" />}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${ev.status === 'completado' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                    {ev.isExam && '📅 '}{ev.title}
                                </p>
                                {ev.asignatura && <p className="text-xs text-indigo-500">{ev.asignatura}</p>}
                            </div>
                            {ev.isExam && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded font-semibold shrink-0">Examen</span>}
                            {ev.highPriority && !ev.isExam && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-semibold shrink-0">⚡ Prio</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* Tasks */}
            {events.filter(e => e.type === 'task').length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <GraduationCap size={11} /> Tareas
                    </p>
                    {events.filter(e => e.type === 'task').map((ev, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                            ${ev.color === 'emerald' ? 'bg-emerald-50 border border-emerald-100'
                                : ev.color === 'blue' ? 'bg-blue-50 border border-blue-100'
                                    : 'bg-amber-50 border border-amber-100'}`}>
                            <ClipboardList size={14} className={ev.color === 'emerald' ? 'text-emerald-600' : ev.color === 'blue' ? 'text-blue-600' : 'text-amber-600'} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{ev.title}</p>
                                <p className="text-xs text-gray-400">{ev.subtitle} · {ev.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Transactions */}
            {events.filter(e => e.type === 'transaction').length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Wallet size={11} /> Finanzas
                    </p>
                    {events.filter(e => e.type === 'transaction').map((ev, i) => (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl
                            ${ev.txType === 'ingreso' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                            {ev.txType === 'ingreso'
                                ? <ArrowUpCircle size={14} className="text-emerald-600" />
                                : <ArrowDownCircle size={14} className="text-red-500" />}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{ev.title}</p>
                                <p className={`text-xs font-semibold ${ev.txType === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>{ev.subtitle}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Helpers ──
function buildCalendar(year, month) {
    const firstDay = new Date(year, month, 1)
    let startDay = firstDay.getDay() - 1
    if (startDay < 0) startDay = 6
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < startDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
}

function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
