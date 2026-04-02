-- Backfill department color keys for existing practices.
-- The seed_practice_defaults function inserts departments without colors.
-- This migration sets color keys on the known default department names so
-- existing practices get the correct tokens immediately.
--
-- The app reads department.color from the DB row — never from hardcoded
-- name-string maps. Any department without a color key falls back to 'blue'
-- in the UI (see departmentColor() in tokens.ts).

update public.departments
set color = case name
  when 'Clinical'        then 'blue'
  when 'Front Desk'      then 'green'
  when 'Engineering'     then 'purple'
  when 'HR'              then 'pink'
  when 'Administration'  then 'gold'
  when 'Sterilization'   then 'red'
  when 'Global'          then 'teal'
  when 'All Departments' then 'teal'
  else color
end
where color is null
  and name in ('Clinical','Front Desk','Engineering','HR','Administration','Sterilization','Global','All Departments');
