'use client'

import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface CustomDateTimePickerProps {
    value: string
    onChange: (value: string) => void
    label: string
    required?: boolean
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

export default function CustomDateTimePicker({
    value,
    onChange,
    label,
    required = false,
    isOpen: externalIsOpen,
    onOpenChange
}: CustomDateTimePickerProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false)
    const [tempDate, setTempDate] = useState('')
    const [tempTime, setTempTime] = useState('')
    const [viewMode, setViewMode] = useState<'quick' | 'calendar'>('quick')
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const dropdownRef = useRef<HTMLDivElement>(null)

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) {
            onOpenChange(open)
        } else {
            setInternalIsOpen(open)
        }
    }
    

    useEffect(() => {
        if (value) {
          const [date, time] = value.split('T')
          setTempDate(date)
          setTempTime(time)
        }
      }, [value])

    const formatDisplayDate = (dateTimeString: string) => {
        if (!dateTimeString) return 'Select date & time'
        const date = new Date(dateTimeString)
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }
        return date.toLocaleDateString('en-US', options)
    }

    const handleOpen = () => {
        setIsOpen(true)

        // Animate button click
        const btn = document.querySelector(`[data-picker="${label}"]`)
        if (btn) {
            gsap.to(btn, {
                scale: 0.98,
                duration: 0.1,
                yoyo: true,
                repeat: 1
            })
        }

        // Animate dropdown opening
        setTimeout(() => {
            if (dropdownRef.current) {
                gsap.fromTo(dropdownRef.current,
                    { opacity: 0, y: -20, scaleY: 0.8 },
                    { opacity: 1, y: 0, scaleY: 1, duration: 0.4, ease: 'back.out(1.7)' }
                )
            }
        }, 10)
    }

    const handleClose = () => {
        if (dropdownRef.current) {
            gsap.to(dropdownRef.current, {
                opacity: 0,
                y: -10,
                scaleY: 0.9,
                duration: 0.2,
                ease: 'power2.in',
                onComplete: () => setIsOpen(false)
            })
        }
    }

    const handleSave = () => {
        if (tempDate && tempTime) {
            onChange(`${tempDate}T${tempTime}`)
            handleClose()

            // Success animation
            const btn = document.querySelector(`[data-picker="${label}"]`)
            if (btn) {
                gsap.to(btn, {
                    scale: 1.05,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.inOut'
                })
            }
        }
    }

    const getQuickTimeOptions = () => {
        const now = new Date()
        const options = []

        for (let i = 0; i < 24; i++) {
            const time = new Date(now.getTime() + i * 30 * 60 * 1000)
            const hours = String(time.getHours()).padStart(2, '0')
            const minutes = String(time.getMinutes()).padStart(2, '0')
            const timeString = `${hours}:${minutes}`

            const displayHours = time.getHours() % 12 || 12
            const ampm = time.getHours() >= 12 ? 'PM' : 'AM'
            const displayTime = `${displayHours}:${String(time.getMinutes()).padStart(2, '0')} ${ampm}`

            options.push({ value: timeString, label: displayTime })
        }

        return options
    }

    const getQuickDateOptions = () => {
        const today = new Date()
        const options = []

        for (let i = 0; i < 7; i++) {
            const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000)
            const dateString = date.toISOString().split('T')[0]

            let label = ''
            if (i === 0) label = 'Today'
            else if (i === 1) label = 'Tomorrow'
            else label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

            options.push({ value: dateString, label })
        }

        return options
    }

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        return { daysInMonth, startingDayOfWeek, year, month }
    }

    const renderCalendar = () => {
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
        const days = []

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>)
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isSelected = tempDate === dateString
            const isToday = dateString === new Date().toISOString().split('T')[0]

            days.push(
                <button
                    key={day}
                    type="button"
                    onClick={() => {
                        setTempDate(dateString)
                        gsap.fromTo(`[data-day="${dateString}"]`,
                            { scale: 0.8 },
                            { scale: 1, duration: 0.3, ease: 'back.out(2)' }
                        )
                    }}
                    data-day={dateString}
                    className={`h-10 rounded-xl font-semibold text-sm transition-all duration-200 ${isSelected
                            ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg scale-110'
                            : isToday
                                ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                                : 'hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    {day}
                </button>
            )
        }

        return days
    }

    const changeMonth = (direction: 'prev' | 'next') => {
        const newMonth = new Date(currentMonth)
        if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1)
        } else {
            newMonth.setMonth(newMonth.getMonth() + 1)
        }
        setCurrentMonth(newMonth)

        // Animate month change
        const calendar = document.querySelector('.calendar-grid')
        if (calendar) {
            gsap.fromTo(calendar,
                { opacity: 0, x: direction === 'prev' ? -20 : 20 },
                { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
            )
        }
    }

    return (
        <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <button
                type="button"
                data-picker={label}
                onClick={() => isOpen ? handleClose() : handleOpen()}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white transition-all duration-300 hover:border-gray-300 text-left flex items-center justify-between group"
            >
                <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {formatDisplayDate(value)}
                </span>
                <span className="text-2xl group-hover:scale-110 transition-transform">
                    {isOpen ? '❌' : '📅'}
                </span>
            </button>

            {isOpen && (
                <div ref={dropdownRef} className="relative mt-3 w-full bg-white rounded-2xl shadow-2xl border-2 border-orange-200 p-5 z-50">
                    {/* View Mode Toggle */}
                    <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('quick')
                                gsap.fromTo('.view-content',
                                    { opacity: 0, x: -20 },
                                    { opacity: 1, x: 0, duration: 0.3 }
                                )
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${viewMode === 'quick'
                                    ? 'bg-white text-orange-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            ⚡ Quick Pick
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('calendar')
                                gsap.fromTo('.view-content',
                                    { opacity: 0, x: 20 },
                                    { opacity: 1, x: 0, duration: 0.3 }
                                )
                            }}
                            className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${viewMode === 'calendar'
                                    ? 'bg-white text-orange-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            📅 Calendar
                        </button>
                    </div>

                    <div className="view-content">
                        {viewMode === 'quick' ? (
                            <>
                                {/* Quick Date Selection */}
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Pick a Day</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {getQuickDateOptions().map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setTempDate(option.value)
                                                    gsap.fromTo(`[data-quick-date="${option.value}"]`,
                                                        { scale: 0.9 },
                                                        { scale: 1, duration: 0.2, ease: 'back.out(2)' }
                                                    )
                                                }}
                                                data-quick-date={option.value}
                                                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${tempDate === option.value
                                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Calendar View */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <button
                                            type="button"
                                            onClick={() => changeMonth('prev')}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        <h3 className="font-bold text-gray-800">
                                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </h3>

                                        <button
                                            type="button"
                                            onClick={() => changeMonth('next')}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Day labels */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                            <div key={day} className="text-center text-xs font-bold text-gray-500 h-8 flex items-center justify-center">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Calendar grid */}
                                    <div className="calendar-grid grid grid-cols-7 gap-1">
                                        {renderCalendar()}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Quick Time Selection */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">Pick a Time</p>
                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {getQuickTimeOptions().map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            setTempTime(option.value)
                                            gsap.fromTo(`[data-time="${option.value}"]`,
                                                { scale: 0.9 },
                                                { scale: 1, duration: 0.2, ease: 'back.out(2)' }
                                            )
                                        }}
                                        data-time={option.value}
                                        className={`px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${tempTime === option.value
                                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t-2 border-gray-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!tempDate || !tempTime}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Done ✓
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #f97316, #fbbf24);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #ea580c, #f59e0b);
        }
      `}</style>
        </div>
    )
}