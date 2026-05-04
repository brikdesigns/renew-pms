'use client';

import { useRef } from 'react';
import { Button, PageHeader } from '@brikdesigns/bds';
import { ScheduleCalendar, type ScheduleCalendarHandle } from './ScheduleCalendar';

export default function SchedulePage() {
  const calendarRef = useRef<ScheduleCalendarHandle>(null);

  return (
    <>
      <PageHeader
        title="Schedule"
        actions={
          <Button variant="primary" size="sm" onClick={() => calendarRef.current?.openAddEventSheet()}>
            Add Event
          </Button>
        }
      />
      <ScheduleCalendar ref={calendarRef} />
    </>
  );
}
