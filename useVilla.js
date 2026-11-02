/**
 * useVilla — Motor gamificado "La Villa"
 * Sincroniza el estado del calendario con localStorage['villa_calendario_sync']
 * y expone la función exportarEstadoCalendario() globalmente.
 */

import { useEffect, useCallback } from 'react'

const OFFICIAL_HOLIDAYS = [
    '2026-01-01', '2026-01-06', '2026-04-02', '2026-04-03',
    '2026-05-01', '2026-05-02', '2026-08-15', '2026-10-12',
    '2026-11-01', '2026-11-09', '2026-12-06', '2026-12-08', '2026-12-25',
]

function formatDateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isWeekend(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const dow = d.getDay()
    return dow === 0 || dow === 6
}

function lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
    catch { return fallback }
}

export function computeVillaState() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = formatDateKey(today)

    const agendaTasks = lsGet('agenda-tasks', [])
    const horario = lsGet('calendario-horario', [])
    const customHolidays = lsGet('agenda-custom-holidays', [])
    const energia = lsGet('villa-energia', 0)
    const minutosFoco = lsGet('villa-minutos-foco', 0)

    // ── Set of all "exempt" days (holidays + strikes)
    const exemptDays = new Set([
        ...OFFICIAL_HOLIDAYS,
        ...customHolidays.map(h => h.date),
    ])

    // ── dias_sin_clases_registradas
    // Count weekdays from start of semester (Sept 2026) to yesterday where no class was attended
    // Simpler: count weekdays in last 30 days where no completed agenda task exists AND not exempt
    let diasSinClases = 0
    for (let i = 1; i <= 30; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const key = formatDateKey(d)
        if (isWeekend(key)) continue
        if (exemptDays.has(key)) continue
        const hasActivity = agendaTasks.some(t => t.dueDate === key && t.completed)
        if (!hasActivity) diasSinClases++
    }

    // ── proximo_examen_dias
    const futureExams = agendaTasks
        .filter(t => t.isExam && !t.completed && t.dueDate >= todayKey)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    let proximoExamenDias = null
    if (futureExams.length > 0) {
        const examDate = new Date(futureExams[0].dueDate + 'T00:00:00')
        proximoExamenDias = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
    }

    // ── clases_hoy
    const jsDay = today.getDay()
    const dayIdx = jsDay === 0 ? -1 : jsDay - 1
    let clasesHoy = []
    if (dayIdx >= 0 && dayIdx <= 4) {
        const isStrikeToday = customHolidays.some(h => h.date === todayKey && h.isStrike)
        if (!isStrikeToday && !exemptDays.has(todayKey)) {
            clasesHoy = horario
                .filter(c => c.day === dayIdx)
                .map(c => c.subject)
        }
    }

    const datos = {
        dias_sin_clases_registradas: diasSinClases,
        proximo_examen_dias: proximoExamenDias,
        clases_hoy: clasesHoy,
        energia_diaria: energia,
        minutos_estudio_foco: minutosFoco,
        ultima_actualizacion: new Date().toISOString(),
    }

    try {
        localStorage.setItem('villa_calendario_sync', JSON.stringify(datos))
    } catch (e) {
        console.warn('villa sync error', e)
    }

    return datos
}

export function useVillaSync() {
    // Register global function
    useEffect(() => {
        window.exportarEstadoCalendario = computeVillaState
        return () => { delete window.exportarEstadoCalendario }
    }, [])

    const sync = useCallback(() => computeVillaState(), [])

    function descargarEstado() {
        const datos = computeVillaState()
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'estado_calendario.json'
        a.click()
        URL.revokeObjectURL(url)
    }

    return { sync, descargarEstado }
}
