'use client';

import { useState, useRef, useMemo, useCallback, type CSSProperties } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button, Chip, IconButton } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { useMembers, type Member } from '@/hooks/useMembers';
import { useScheduleEvents, type ScheduleEvent } from '@/hooks/useScheduleEvents';
import { AddEventSheet } from './AddEventSheet';
import { color, font, gap, space, border } from '@/lib/tokens';
import './calendar.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Map department color keys to CSS custom property values for event cards.
 *  Raw var() strings required — FullCalendar accepts CSS strings, not token imports.
 *  token-audit-ignore: raw-var */
const DEPT_EVENT_COLORS: Record<string, { bg: string; border: string }> = {
  blue:   { bg: color.department.blue.base,   border: color.department.blue.border },
  green:  { bg: color.department.green.base,  border: color.department.green.border },
  purple: { bg: color.department.purple.base, border: color.department.purple.border },
  gold:   { bg: color.department.gold.base,   border: color.department.gold.border },
  red:    { bg: color.department.red.base,    border: color.department.red.border },
  taupe:  { bg: color.department.taupe.base,  border: color.department.taupe.border },
};

const DEFAULT_EVENT_COLORS = { bg: color.surface.brandPrimary, border: color.border.brand };

/** Convert API events to FullCalendar EventInput format */
function toCalendarEvents(events: ScheduleEvent[]): EventInput[] {
  return events.map(e => {
    const colors = DEPT_EVENT_COLORS[e.staffDepartmentColor ?? ''] ?? DEFAULT_EVENT_COLORS;
    return {
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      extendedProps: {
        staffId: e.staffId,
        staffName: e.staffName,
        staffDepartmentColor: e.staffDepartmentColor,
        eventType: e.eventType,
        description: e.description,
      },
    };
  });
}

/** Build a staff lookup from members with events */
function buildStaffList(members: Member[]): { id: string; name: string; departmentColor: string }[] {
  return members
    .filter(m => m.is_active)
    .map(m => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`.trim(),
      departmentColor: m.department_color ?? 'blue',
    }));
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
};

// Matches TaskFilterBar barStyle
const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.md} 0`,
  minHeight: 0,
};

// Matches TaskFilterBar datePickerStyle
const toolbarLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.lg,
};

// Matches TaskFilterBar dateLabelStyle
const dateRangeStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  fontWeight: font.weight.bold,
  color: color.text.primary,
  whiteSpace: 'nowrap',
};

// Matches TaskFilterBar chipGroupStyle
const staffBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  flexWrap: 'wrap',
  paddingBottom: space.md,
};

const calendarWrapperStyle: CSSProperties = {
  flex: 1,
  overflow: 'hidden',
};

const viewToggleBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.xs,
  backgroundColor: color.surface.secondary,
  borderRadius: border.radius.sm,
  padding: space.tiny,
};

const viewBtnStyle = (active: boolean): CSSProperties => ({
  background: active ? color.surface.primary : 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: active ? color.text.primary : color.text.muted,
  fontSize: font.size.body.md,
  padding: `${space.tiny} ${space.xs}`,
  borderRadius: border.radius.xs,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 150ms ease',
  boxShadow: active ? 'var(--box-shadow-sm)' : 'none',
});

// ─── Component ──────────────────────────────────────────────────────────────

export function ScheduleCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<'timeGridWeek' | 'timeGridDay' | 'dayGridMonth'>('timeGridWeek');
  const [dateTitle, setDateTitle] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrefill, setSheetPrefill] = useState<{ date?: string; startTime?: string; endTime?: string }>({});

  // Fetch real data
  const { members } = useMembers();
  const { events: apiEvents, refetch } = useScheduleEvents(dateRange.start, dateRange.end);

  const staff = useMemo(() => buildStaffList(members), [members]);
  const [activeStaff, setActiveStaff] = useState<Set<string> | null>(null);

  // Initialize activeStaff once members load
  const effectiveActiveStaff = useMemo(() => {
    if (activeStaff !== null) return activeStaff;
    return new Set(staff.map(s => s.id));
  }, [activeStaff, staff]);

  const calendarEvents = useMemo(() => toCalendarEvents(apiEvents), [apiEvents]);

  const filteredEvents = useMemo(() => {
    if (effectiveActiveStaff.size === staff.length) return calendarEvents;
    return calendarEvents.filter(e => {
      const staffId = e.extendedProps?.staffId;
      return staffId ? effectiveActiveStaff.has(staffId) : true;
    });
  }, [calendarEvents, effectiveActiveStaff, staff.length]);

  function toggleStaff(id: string) {
    setActiveStaff(prev => {
      const current = prev ?? new Set(staff.map(s => s.id));
      const next = new Set(current);
      if (next.has(id)) {
        if (next.size <= 1) return current;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function navigate(action: 'prev' | 'next' | 'today') {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (action === 'prev') api.prev();
    else if (action === 'next') api.next();
    else api.today();
    setDateTitle(api.view.title);
  }

  function changeView(view: 'timeGridWeek' | 'timeGridDay' | 'dayGridMonth') {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.changeView(view);
    setCurrentView(view);
    setDateTitle(api.view.title);
  }

  const handleDatesSet = useCallback((info: DatesSetArg) => {
    setDateTitle(info.view.title);
    setDateRange({
      start: info.startStr,
      end: info.endStr,
    });
  }, []);

  const handleSelect = useCallback((info: DateSelectArg) => {
    const startDate = info.start;
    const date = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    const endDate = info.end;
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    setSheetPrefill({ date, startTime, endTime });
    setSheetOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setSheetPrefill({});
    setSheetOpen(true);
  }, []);

  return (
    <div style={containerStyle}>
      {/* ── Toolbar (matches TaskFilterBar layout) ────────────────── */}
      <div style={toolbarStyle}>
        <div style={toolbarLeftStyle}>
          <IconButton variant="ghost" size="sm" icon={<Icon icon={icon.chevronLeft} />} label="Previous" onClick={() => navigate('prev')} />
          <span style={dateRangeStyle}>{dateTitle}</span>
          <IconButton variant="ghost" size="sm" icon={<Icon icon={icon.chevronRight} />} label="Next" onClick={() => navigate('next')} />
          <Button variant="ghost" size="sm" onClick={() => navigate('today')}>Today</Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
          <div style={viewToggleBarStyle}>
            <button type="button" style={viewBtnStyle(currentView === 'dayGridMonth')} onClick={() => changeView('dayGridMonth')} title="Month view">
              <Icon icon="ph:squares-four" />
            </button>
            <button type="button" style={viewBtnStyle(currentView === 'timeGridWeek')} onClick={() => changeView('timeGridWeek')} title="Week view">
              <Icon icon="ph:list" />
            </button>
            <button type="button" style={viewBtnStyle(currentView === 'timeGridDay')} onClick={() => changeView('timeGridDay')} title="Day view">
              <Icon icon={icon.calendar} />
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={handleAddNew}>
            Add New
            <Icon icon={icon.chevronDown} style={{ marginLeft: '4px' }} />
          </Button>
        </div>
      </div>

      {/* ── Staff filter chips ───────────────────────────────────────── */}
      {staff.length > 0 && (
        <div style={staffBarStyle}>
          {staff.map(member => {
            const isActive = effectiveActiveStaff.has(member.id);
            return (
              <Chip
                key={member.id}
                label={member.name}
                variant={isActive ? 'primary' : 'secondary'}
                appearance={isActive ? 'solid' : 'light'}
                avatar={
                  <UserAvatar
                    name={member.name}
                    departmentColorKey={member.departmentColor}
                    size="sm"
                    shape="rounded"
                    style={{ width: '20px', height: '20px', fontSize: font.size.body.tiny }}
                  />
                }
                onChipClick={() => toggleStaff(member.id)}
              />
            );
          })}
        </div>
      )}

      {/* ── Calendar ─────────────────────────────────────────────────── */}
      <div style={calendarWrapperStyle}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          events={filteredEvents}
          weekends={false}
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator
          editable
          selectable
          height="100%"
          datesSet={handleDatesSet}
          select={handleSelect}
          eventContent={(arg) => {
            const staffName = arg.event.extendedProps?.staffName;
            const deptColor = arg.event.extendedProps?.staffDepartmentColor;
            return (
              <div className="renew-event-content">
                <div>
                  <div className="fc-event-title">{arg.event.title}</div>
                  <div className="fc-event-time">{arg.timeText}</div>
                </div>
                {staffName && (
                  <div className="renew-event-avatar">
                    <UserAvatar
                      name={staffName}
                      departmentColorKey={deptColor}
                      size="sm"
                      shape="circle"
                    />
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* ── Add Event Sheet ──────────────────────────────────────────── */}
      <AddEventSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={refetch}
        prefill={sheetPrefill}
      />
    </div>
  );
}
