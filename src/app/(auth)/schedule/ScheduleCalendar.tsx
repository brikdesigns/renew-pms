'use client';

import { forwardRef, useImperativeHandle, useState, useRef, useMemo, useCallback, type CSSProperties } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Chip, Button, Menu } from '@brikdesigns/bds';
import type { MenuItemData } from '@brikdesigns/bds';
import { UserAvatar } from '@/components/UserAvatar';
import { useMembers, type Member } from '@/hooks/useMembers';
import { useDepartments } from '@/hooks/useDepartments';
import { useScheduleEvents, type ScheduleEvent } from '@/hooks/useScheduleEvents';
import { AddEventSheet } from './AddEventSheet';
import { color, font, gap, space, border } from '@/lib/tokens';
import './calendar.css';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Map department color keys to token references for event cards */
const DEPT_EVENT_COLORS: Record<string, { bg: string; border: string }> = {
  blue:   { bg: color.department.blue.base,   border: color.department.blue.border },
  green:  { bg: color.department.green.base,  border: color.department.green.border },
  purple: { bg: color.department.purple.base, border: color.department.purple.border },
  gold:   { bg: color.department.gold.base,   border: color.department.gold.border },
  red:    { bg: color.department.red.base,    border: color.department.red.border },
  taupe:  { bg: color.department.taupe.base,  border: color.department.taupe.border },
};

const DEFAULT_EVENT_COLORS = { bg: color.surface.brandPrimary, border: color.border.brand };

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
        staffDepartment: e.staffDepartment,
        staffDepartmentColor: e.staffDepartmentColor,
        eventType: e.eventType,
        description: e.description,
      },
    };
  });
}

function buildStaffList(members: Member[]): { id: string; name: string; department: string; departmentColor: string }[] {
  return members
    .filter(m => m.is_active)
    .map(m => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`.trim(),
      department: m.department,
      departmentColor: m.department_color ?? 'blue',
    }));
}

// ─── ChipFilter (reusable — matches TaskFilterBar pattern) ──────────────────

function ChipFilter({ options, selected, onChange }: {
  options: readonly string[];
  selected: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const items: MenuItemData[] = options.map(opt => ({
    id: opt,
    label: opt,
    onClick: () => { onChange(opt); setOpen(false); },
  }));

  const isFiltered = selected !== options[0];

  return (
    <div style={{ position: 'relative' }}>
      <Chip
        label={selected}
        variant={isFiltered ? 'primary' : 'secondary'}
        showDropdown
        onChipClick={() => setOpen(prev => !prev)}
      />
      <Menu
        items={items}
        isOpen={open}
        onClose={() => setOpen(false)}
        activeId={selected}
        style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, zIndex: 100 }}
      />
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.md} 0`,
  minHeight: 0,
};

const toolbarLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.sm,
};

const dateRangeStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  whiteSpace: 'nowrap',
};

const toolbarRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
};

const calendarWrapperStyle: CSSProperties = {
  flex: 1,
  overflow: 'hidden',
};

const viewToggleBarStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: color.surface.secondary,
  borderRadius: border.radius.md,
  padding: space.tiny,
  gap: space.tiny,
};

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Imperative handle for the parent's PageHeader Add Event button to trigger
 * the AddEventSheet rendered inside ScheduleCalendar. See SchedulePage.
 */
export type ScheduleCalendarHandle = {
  openAddEventSheet: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ScheduleCalendarProps {}

export const ScheduleCalendar = forwardRef<ScheduleCalendarHandle, ScheduleCalendarProps>(function ScheduleCalendar(_props, ref) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<'timeGridWeek' | 'timeGridDay' | 'dayGridMonth'>('timeGridWeek');
  const [dateTitle, setDateTitle] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPrefill, setSheetPrefill] = useState<{ date?: string; startTime?: string; endTime?: string }>({});

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedStaff, setSelectedStaff] = useState('All Staff');

  // Fetch real data
  const { members } = useMembers();
  const { departments } = useDepartments();
  const { events: apiEvents, refetch } = useScheduleEvents(dateRange.start, dateRange.end);

  const staff = useMemo(() => buildStaffList(members), [members]);

  const departmentOptions = useMemo(
    () => ['All Departments', ...departments.filter(d => d.is_active && d.name !== 'All Departments').map(d => d.name)] as const,
    [departments],
  );

  const staffOptions = useMemo(
    () => ['All Staff', ...staff.map(s => s.name)] as const,
    [staff],
  );

  const calendarEvents = useMemo(() => toCalendarEvents(apiEvents), [apiEvents]);

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(e => {
      if (selectedDepartment !== 'All Departments') {
        if (e.extendedProps?.staffDepartment !== selectedDepartment) return false;
      }
      if (selectedStaff !== 'All Staff') {
        if (e.extendedProps?.staffName !== selectedStaff) return false;
      }
      return true;
    });
  }, [calendarEvents, selectedDepartment, selectedStaff]);

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
    setDateRange({ start: info.startStr, end: info.endStr });
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

  // Bridge for the Add Event button hosted in PageHeader actions (see
  // SchedulePage). The AddEventSheet stays rendered inside this component.
  useImperativeHandle(ref, () => ({
    openAddEventSheet: handleAddNew,
  }));

  return (
    <div style={containerStyle}>
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div style={toolbarStyle}>
        <div style={toolbarLeftStyle}>
          <span style={dateRangeStyle}>{dateTitle}</span>
          <Button variant="ghost" size="sm" icon={<Icon icon={icon.chevronLeft} />} label="Previous" onClick={() => navigate('prev')} />
          <Button variant="ghost" size="sm" icon={<Icon icon={icon.chevronRight} />} label="Next" onClick={() => navigate('next')} />
          <Chip label="Today" variant="secondary" onChipClick={() => navigate('today')} />
        </div>

        <div style={toolbarRightStyle}>
          <ChipFilter options={departmentOptions} selected={selectedDepartment} onChange={setSelectedDepartment} />
          <ChipFilter options={staffOptions} selected={selectedStaff} onChange={setSelectedStaff} />

          <div style={viewToggleBarStyle} role="radiogroup" aria-label="Calendar view">
            <Button
              variant={currentView === 'dayGridMonth' ? 'primary' : 'ghost'}
              size="sm"
              icon={<Icon icon="ph:squares-four-fill" />}
              label="Month view"
              onClick={() => changeView('dayGridMonth')}
            />
            <Button
              variant={currentView === 'timeGridWeek' ? 'primary' : 'ghost'}
              size="sm"
              icon={<Icon icon="ph:list-fill" />}
              label="Week view"
              onClick={() => changeView('timeGridWeek')}
            />
            <Button
              variant={currentView === 'timeGridDay' ? 'primary' : 'ghost'}
              size="sm"
              icon={<Icon icon="ph:calendar-dots-fill" />}
              label="Day view"
              onClick={() => changeView('timeGridDay')}
            />
          </div>

          {/* Add Event lives on the parent's PageHeader actions
              (see schedule/page.tsx → SchedulePage). */}
        </div>
      </div>

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
});
