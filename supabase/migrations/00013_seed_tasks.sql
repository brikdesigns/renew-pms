-- Seed ~30 realistic dental practice tasks for Renew Dental
-- Practice: d9f05b47-5429-41bc-aea9-79043c5c7062
-- All tasks due today or overdue (CURRENT_DATE - 1)

INSERT INTO tasks (
  id, practice_id, title, task_type_id, room_id,
  assigned_to, assigned_role_id, assigned_department,
  status, priority, frequency, due_date
) VALUES

-- Sylvia Salazar - Office Manager
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Daily Team Huddle',
  'ae000409-85c0-4364-82f0-f4e784c74624', NULL,
  'fe1d2765-b10d-4097-a75d-e9b86aa3a260', NULL, '6671de01-8bf9-41f0-95cb-707d28dd75dd',
  'overdue', 'critical', 'daily', CURRENT_DATE - 1),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Staff Schedule Review',
  'ae000409-85c0-4364-82f0-f4e784c74624', NULL,
  'fe1d2765-b10d-4097-a75d-e9b86aa3a260', NULL, '6671de01-8bf9-41f0-95cb-707d28dd75dd',
  'not_started', 'medium', 'weekly', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Approve Supply Orders',
  'ae000409-85c0-4364-82f0-f4e784c74624', NULL,
  'fe1d2765-b10d-4097-a75d-e9b86aa3a260', NULL, '6671de01-8bf9-41f0-95cb-707d28dd75dd',
  'not_started', 'high', 'weekly', CURRENT_DATE),

-- Autumn Weimer - Clinical Manager
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Operatory Readiness Check',
  'ae000409-85c0-4364-82f0-f4e784c74624', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '0800def4-6624-474b-83fe-788fe6712c83', NULL, '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'overdue', 'critical', 'daily', CURRENT_DATE - 1),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Compliance Audit - OSHA Binders',
  '4303e740-a3ce-4485-afb8-5be1163f07c7', NULL,
  '0800def4-6624-474b-83fe-788fe6712c83', NULL, '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'high', 'monthly', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Review Clinical Staff Onboarding Progress',
  'ad7cac24-520b-465f-a516-77cf1e9f843d', NULL,
  '0800def4-6624-474b-83fe-788fe6712c83', NULL, '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'in_progress', 'medium', 'weekly', CURRENT_DATE),

-- Rachel Stein - Doctor
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Patient Chart Review - Morning Block',
  'ae000409-85c0-4364-82f0-f4e784c74624', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '4998150e-c5c1-4b3d-9d9c-91e4020f9c58', NULL, '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'overdue', 'high', 'daily', CURRENT_DATE - 1),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Treatment Plan Consult - Afternoon',
  '50b32483-58c7-4a2d-a7e8-4ca0b3b2a7a6', '17ba82b5-d6a6-40f7-b4de-2fadc7f72444',
  '4998150e-c5c1-4b3d-9d9c-91e4020f9c58', NULL, '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'medium', 'daily', CURRENT_DATE),

-- Phillip Ray - Doctor
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Patient Chart Review - Morning Block',
  'ae000409-85c0-4364-82f0-f4e784c74624', '8d38de55-2a66-4fce-be1c-2307c994c997',
  'e8fd6acf-537f-49ea-bc7f-c2d7015037b6', NULL, '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'high', 'daily', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'X-Ray Review and Documentation',
  '50b32483-58c7-4a2d-a7e8-4ca0b3b2a7a6', '5d5c16ec-ff96-42ac-9ac4-a8f6a09b9037',
  'e8fd6acf-537f-49ea-bc7f-c2d7015037b6', NULL, '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'medium', 'daily', CURRENT_DATE),

-- Tessa Hernandez - Lead Business Administrator
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Insurance Follow-up - Pending Claims',
  'ae000409-85c0-4364-82f0-f4e784c74624', '416b76f3-4a67-4e96-8b2c-cd5ec9096119',
  'b089c155-4dc8-4615-b783-50b7aac7c643', 'fa262677-fa84-4ac9-a469-166d24dd05a6', '9a8a488e-6e5a-4001-917c-bf698ecb5f7d',
  'overdue', 'high', 'daily', CURRENT_DATE - 1),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Supply Ordering - Monthly Consumables',
  'ae000409-85c0-4364-82f0-f4e784c74624', NULL,
  'b089c155-4dc8-4615-b783-50b7aac7c643', 'fa262677-fa84-4ac9-a469-166d24dd05a6', '9a8a488e-6e5a-4001-917c-bf698ecb5f7d',
  'not_started', 'medium', 'monthly', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Billing Reconciliation - End of Day',
  'ae000409-85c0-4364-82f0-f4e784c74624', '416b76f3-4a67-4e96-8b2c-cd5ec9096119',
  'b089c155-4dc8-4615-b783-50b7aac7c643', 'fa262677-fa84-4ac9-a469-166d24dd05a6', '9a8a488e-6e5a-4001-917c-bf698ecb5f7d',
  'not_started', 'high', 'daily', CURRENT_DATE),

-- Konner Rudolph - Business Administrator
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Patient Check-in Processing',
  'ae000409-85c0-4364-82f0-f4e784c74624', '416b76f3-4a67-4e96-8b2c-cd5ec9096119',
  '7bef1cd8-229b-4102-878e-fcb4aa6a6fdb', NULL, '9a8a488e-6e5a-4001-917c-bf698ecb5f7d',
  'overdue', 'medium', 'daily', CURRENT_DATE - 1),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Verify Benefits - Tomorrow''s Patients',
  'ae000409-85c0-4364-82f0-f4e784c74624', '416b76f3-4a67-4e96-8b2c-cd5ec9096119',
  '7bef1cd8-229b-4102-878e-fcb4aa6a6fdb', NULL, '9a8a488e-6e5a-4001-917c-bf698ecb5f7d',
  'not_started', 'high', 'daily', CURRENT_DATE),

-- Samantha Rodriguez - Business Administrator
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Confirm Next-Day Appointments',
  'ae000409-85c0-4364-82f0-f4e784c74624', '416b76f3-4a67-4e96-8b2c-cd5ec9096119',
  '0c8bf8a1-7d98-42f1-8a33-45e041b96240', NULL, '9a8a488e-6e5a-4001-917c-bf698ecb5f7d',
  'not_started', 'critical', 'daily', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Update Patient Contact Information',
  'ae000409-85c0-4364-82f0-f4e784c74624', '416b76f3-4a67-4e96-8b2c-cd5ec9096119',
  '0c8bf8a1-7d98-42f1-8a33-45e041b96240', NULL, '9a8a488e-6e5a-4001-917c-bf698ecb5f7d',
  'not_started', 'low', 'daily', CURRENT_DATE),

-- Avilina Igitol - Dental Assistant
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Instrument Sterilization - Morning Batch',
  '50b32483-58c7-4a2d-a7e8-4ca0b3b2a7a6', '3ed50247-5375-4691-80b8-3ef67622e28d',
  '0ab6ae8b-ec12-45c5-8574-f482789bfb8a', '1bb19244-7a4b-4588-a743-c54020a05449', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'overdue', 'critical', 'per_shift', CURRENT_DATE - 1),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Patient Room Setup - Operatory',
  'ae000409-85c0-4364-82f0-f4e784c74624', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '0ab6ae8b-ec12-45c5-8574-f482789bfb8a', '1bb19244-7a4b-4588-a743-c54020a05449', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'high', 'daily', CURRENT_DATE),

-- Elizabeth Carrillo - Dental Assistant
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'PPE Restock Check',
  'ae000409-85c0-4364-82f0-f4e784c74624', '3ed50247-5375-4691-80b8-3ef67622e28d',
  'a1f8c225-fef8-423d-b7ab-a00c787b3545', '1bb19244-7a4b-4588-a743-c54020a05449', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'medium', 'daily', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Chairside Setup - Afternoon Procedures',
  '50b32483-58c7-4a2d-a7e8-4ca0b3b2a7a6', '8d38de55-2a66-4fce-be1c-2307c994c997',
  'a1f8c225-fef8-423d-b7ab-a00c787b3545', '1bb19244-7a4b-4588-a743-c54020a05449', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'high', 'daily', CURRENT_DATE),

-- Destiny Mora - Dental Hygienist
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Patient Procedure Checklist - Morning',
  '4303e740-a3ce-4485-afb8-5be1163f07c7', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '5b5eee82-b849-4dcd-915c-fc1fa7fb65d7', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'overdue', 'high', 'daily', CURRENT_DATE - 1),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Instrument Tray Setup',
  'ae000409-85c0-4364-82f0-f4e784c74624', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '5b5eee82-b849-4dcd-915c-fc1fa7fb65d7', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'medium', 'daily', CURRENT_DATE),

-- Olivia Biggs - Dental Hygienist
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Hand Hygiene Log - Morning',
  '50b32483-58c7-4a2d-a7e8-4ca0b3b2a7a6', NULL,
  '5fd9a974-0fa6-434b-9a15-cef34da25b3a', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'high', 'daily', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Operatory Disinfection - End of Shift',
  '4303e740-a3ce-4485-afb8-5be1163f07c7', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '5fd9a974-0fa6-434b-9a15-cef34da25b3a', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'critical', 'per_shift', CURRENT_DATE),

-- Jo Cleasby - Dental Hygienist
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Periodontal Charting - Afternoon Block',
  '50b32483-58c7-4a2d-a7e8-4ca0b3b2a7a6', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '2f717894-c0c9-4d30-9b50-5ec7ef1743cd', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'medium', 'daily', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Update Patient Records - Hygiene Notes',
  'ae000409-85c0-4364-82f0-f4e784c74624', NULL,
  '2f717894-c0c9-4d30-9b50-5ec7ef1743cd', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'low', 'daily', CURRENT_DATE),

-- Nadiya Achuff - Dental Assistant
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Instrument Sterilization - Afternoon Batch',
  '50b32483-58c7-4a2d-a7e8-4ca0b3b2a7a6', '3ed50247-5375-4691-80b8-3ef67622e28d',
  '16b40277-6f15-4fb3-8bad-9088d42059ef', '1bb19244-7a4b-4588-a743-c54020a05449', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'critical', 'per_shift', CURRENT_DATE),

-- Jordan Johnston - Dental Assistant
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Log Sterilization Batch - Date and Initials',
  '4303e740-a3ce-4485-afb8-5be1163f07c7', '3ed50247-5375-4691-80b8-3ef67622e28d',
  'ef24e81f-a318-46f3-89f5-2f616ceffc8d', '1bb19244-7a4b-4588-a743-c54020a05449', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'critical', 'per_shift', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Onboarding Module - Infection Control',
  'ad7cac24-520b-465f-a516-77cf1e9f843d', NULL,
  'ef24e81f-a318-46f3-89f5-2f616ceffc8d', '1bb19244-7a4b-4588-a743-c54020a05449', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'in_progress', 'medium', 'custom', CURRENT_DATE),

-- Kelly Schumacher - Dental Hygienist
(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Patient Procedure Checklist - Afternoon',
  '4303e740-a3ce-4485-afb8-5be1163f07c7', '8d38de55-2a66-4fce-be1c-2307c994c997',
  '8e071419-a12a-401f-bde3-949d869903b9', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'not_started', 'high', 'daily', CURRENT_DATE),

(gen_random_uuid(), 'd9f05b47-5429-41bc-aea9-79043c5c7062',
  'Onboarding Module - Patient Documentation',
  'ad7cac24-520b-465f-a516-77cf1e9f843d', NULL,
  '8e071419-a12a-401f-bde3-949d869903b9', '70bb6312-2cf3-4f66-a316-974e8bab4d1d', '4a3d525f-20bd-4050-91e0-fe468776ac36',
  'in_progress', 'low', 'custom', CURRENT_DATE);
