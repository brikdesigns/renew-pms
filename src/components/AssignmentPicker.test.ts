import { describe, test, expect } from 'vitest';
import { buildMemberOptions } from './AssignmentPicker';
import type { Member } from '@/hooks/useMembers';

function member(overrides: Partial<Member>): Member {
  return {
    id: 'mid',
    user_id: 'uid',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar_url: null,
    system_role: 'staff',
    practice_role_id: null,
    practice_role: '',
    department_id: null,
    department: '',
    department_color: 'blue',
    employee_type: 'proficient',
    shift: 'full_day',
    office_days: [],
    is_active: true,
    joined_at: '',
    ...overrides,
  };
}

describe('AssignmentPicker.buildMemberOptions', () => {
  test('returns just the display name when names are unique', () => {
    const result = buildMemberOptions([
      member({ id: '1', first_name: 'Jessica', last_name: 'Torres', email: 'jess@x.com' }),
      member({ id: '2', first_name: 'Mark', last_name: 'Smith', email: 'mark@x.com' }),
    ]);
    expect(result).toEqual([
      { label: 'Jessica Torres', value: '1' },
      { label: 'Mark Smith', value: '2' },
    ]);
  });

  test('appends email parenthetically only on duplicate display names', () => {
    const result = buildMemberOptions([
      member({ id: '1', first_name: 'Jessica', last_name: 'Torres', email: 'a@x.com' }),
      member({ id: '2', first_name: 'Jessica', last_name: 'Torres', email: 'b@x.com' }),
      member({ id: '3', first_name: 'Mark', last_name: 'Smith', email: 'c@x.com' }),
    ]);
    expect(result).toEqual([
      { label: 'Jessica Torres (a@x.com)', value: '1' },
      { label: 'Jessica Torres (b@x.com)', value: '2' },
      { label: 'Mark Smith', value: '3' },
    ]);
  });

  test('inactive members are excluded from the dup-name count and the output', () => {
    // Two active Jessicas + one inactive Jessica → only the two active ones
    // need disambiguation; the inactive one isn't shown so it shouldn't
    // contribute to the duplicate count either.
    const result = buildMemberOptions([
      member({ id: '1', first_name: 'Jessica', last_name: 'Torres', email: 'a@x.com', is_active: true }),
      member({ id: '2', first_name: 'Jessica', last_name: 'Torres', email: 'b@x.com', is_active: true }),
      member({ id: '3', first_name: 'Jessica', last_name: 'Torres', email: 'c@x.com', is_active: false }),
    ]);
    expect(result).toEqual([
      { label: 'Jessica Torres (a@x.com)', value: '1' },
      { label: 'Jessica Torres (b@x.com)', value: '2' },
    ]);
  });

  test('empty name falls back to email, then to "Unnamed member"', () => {
    const result = buildMemberOptions([
      member({ id: '1', first_name: '', last_name: '', email: 'noname@x.com' }),
      member({ id: '2', first_name: '', last_name: '', email: '' }),
    ]);
    expect(result).toEqual([
      { label: 'noname@x.com', value: '1' },
      { label: 'Unnamed member', value: '2' },
    ]);
  });
});
