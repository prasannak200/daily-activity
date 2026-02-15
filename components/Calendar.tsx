
import React, { useState, useMemo } from 'react';
import { Task } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  tasks: Task[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, tasks }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const monthData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  const taskDates = useMemo(() => {
    const dates = new Set<string>();
    tasks.forEach(t => dates.add(t.dueDate));
    return dates;
  }, [tasks]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
    setViewDate(newDate);
  };

  const monthName = viewDate.toLocaleString('default', { month: 'long' });
  const yearName = viewDate.getFullYear();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-slate-800">{monthName} <span className="text-slate-400 font-bold">{yearName}</span></h2>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <ChevronLeftIcon />
          </button>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {monthData.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="aspect-square" />;
          
          const dateStr = formatDate(date);
          const isSelected = selectedDate === dateStr;
          const hasTasks = taskDates.has(dateStr);
          const isToday = formatDate(new Date()) === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                isSelected 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <span className={isToday && !isSelected ? 'text-indigo-600' : ''}>{date.getDate()}</span>
              {hasTasks && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 bg-indigo-400 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
