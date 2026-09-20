import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  X,
  Layers,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { TimetableSlot, WeekDay } from '../types';
import {
  OFFICIAL_TIMETABLES,
  ASC_PERIODS,
  isSubjectCore,
} from '../utils/timetableData';

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassCode?: string;
  onSelectSlot?: (subject: string, teacherStaffId?: string, teacherName?: string) => void;
}

const DAYS: { key: WeekDay; label: string }[] = [
  { key: 'Monday', label: 'Monday' },
  { key: 'Tuesday', label: 'Tuesday' },
  { key: 'Wednesday', label: 'Wednesday' },
  { key: 'Thursday', label: 'Thursday' },
  { key: 'Friday', label: 'Friday' },
];

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  initialClassCode,
  onSelectSlot,
}) => {
  const availableTimetables = OFFICIAL_TIMETABLES;
  const [selectedClassCode, setSelectedClassCode] = useState<string>(() => {
    if (initialClassCode && availableTimetables.some((t) => t.classCode === initialClassCode)) {
      return initialClassCode;
    }
    return availableTimetables[0]?.classCode || 'GEN_ART_2A';
  });

  const timetable = useMemo(
    () => availableTimetables.find((t) => t.classCode === selectedClassCode) || availableTimetables[0],
    [selectedClassCode, availableTimetables]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Official Institutional Master Timetable
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 border border-indigo-500/30 text-indigo-300">
                  aSc Timetables Synchronized
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Weekly lesson matrices, periods, core vs elective subjects &amp; teacher allocations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Class Selection Tabs */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap pl-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Class:</span>
          </span>
          {availableTimetables.map((table) => {
            const isSelected = selectedClassCode === table.classCode;
            return (
              <button
                key={table.classCode}
                onClick={() => setSelectedClassCode(table.classCode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{table.className}</span>
                <span className="ml-1.5 text-[10px] opacity-75 font-mono">({table.formYear ? `Form ${table.formYear}` : 'SHS'})</span>
              </button>
            );
          })}
        </div>

        {/* Class Overview Banner */}
        {timetable && (
          <div className="px-5 py-3 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-300">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">{timetable.className}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">Code: {timetable.classCode}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Stream: {timetable.program}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/50" />
                Core Subject (GES Mandatory)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-indigo-400">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-500/50" />
                Elective Subject
              </span>
            </div>
          </div>
        )}

        {/* Matrix Grid Container */}
        <div className="flex-1 overflow-auto p-4 sm:p-5">
          {timetable ? (
            <div className="min-w-[760px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              {/* Table Header: Periods */}
              <div className="grid grid-cols-9 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300 text-center">
                <div className="p-3 border-r border-slate-800 flex items-center justify-center text-slate-400 font-mono">
                  Day / Period
                </div>
                {ASC_PERIODS.map((period) => (
                  <div
                    key={period.periodNumber}
                    className="p-2.5 border-r border-slate-800/60 last:border-r-0 flex flex-col items-center justify-center"
                  >
                    <span className="text-white font-mono">Period {period.periodNumber}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {period.startTime} - {period.endTime}
                    </span>
                  </div>
                ))}
              </div>

              {/* Table Body: 5 Days */}
              {DAYS.map((day) => {
                const daySlots = timetable.schedule[day.key] || [];
                return (
                  <div
                    key={day.key}
                    className="grid grid-cols-9 border-b border-slate-800/70 last:border-b-0 text-xs min-h-[82px]"
                  >
                    {/* Day Column */}
                    <div className="p-3 bg-slate-900/70 border-r border-slate-800 flex flex-col items-center justify-center font-bold text-white">
                      <span>{day.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">8 Periods</span>
                    </div>

                    {/* Periods 1 to 8 */}
                    {ASC_PERIODS.map((period) => {
                      const slot = daySlots.find((s: TimetableSlot) => s.period === period.periodNumber);
                      if (!slot) {
                        return (
                          <div
                            key={period.periodNumber}
                            className="p-2 border-r border-slate-800/50 last:border-r-0 bg-slate-950/40 flex items-center justify-center text-[10px] text-slate-600 font-mono"
                          >
                            FREE
                          </div>
                        );
                      }

                      const isCore = slot.isCore ?? isSubjectCore(timetable.program, slot.subject);

                      return (
                        <div
                          key={period.periodNumber}
                          onClick={() => {
                            if (onSelectSlot) {
                              onSelectSlot(slot.subject, slot.teacherStaffId, slot.teacher);
                              onClose();
                            }
                          }}
                          className={`p-2 border-r border-slate-800/50 last:border-r-0 transition flex flex-col justify-between group relative ${
                            onSelectSlot ? 'cursor-pointer hover:ring-1 hover:ring-emerald-500' : ''
                          } ${
                            isCore
                              ? 'bg-emerald-950/20 hover:bg-emerald-950/40 border-t-2 border-t-emerald-500/80'
                              : 'bg-indigo-950/20 hover:bg-indigo-950/40 border-t-2 border-t-indigo-500/80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[9px] font-bold px-1 rounded uppercase tracking-wider ${
                                  isCore
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-indigo-500/20 text-indigo-300'
                                }`}
                              >
                                {isCore ? 'CORE' : 'ELECTIVE'}
                              </span>
                              {slot.notes && (
                                <span className="text-[9px] text-slate-400 font-mono truncate">
                                  {slot.notes}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-white text-[11px] leading-tight block truncate group-hover:text-emerald-300">
                              {slot.subject}
                            </span>
                          </div>

                          <div className="mt-1 pt-1 border-t border-slate-800/60">
                            <span className="text-[10px] text-slate-300 block truncate font-medium">
                              {slot.teacher}
                            </span>
                            {slot.teacherStaffId && (
                              <span className="text-[9px] text-slate-500 font-mono block">
                                ID: {slot.teacherStaffId}
                              </span>
                            )}
                          </div>

                          {onSelectSlot && (
                            <div className="absolute inset-0 bg-emerald-900/90 rounded opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-[11px] gap-1 shadow-lg">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Apply to Session</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              No timetable data loaded for this class code.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            <span>Tip: </span>
            <span className="text-slate-300">
              Clicking any cell in the matrix applies that Subject and Assigned Teacher directly into the Period Tracker.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Close Timetable
          </button>
        </div>
      </div>
    </div>
  );
};
