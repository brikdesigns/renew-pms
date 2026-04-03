/**
 * Icon registry — Phosphor icon set via Iconify
 *
 * Registers the full Phosphor collection offline (bundled, no CDN).
 * Import named constants from here; render with <Icon icon={...} /> from '@iconify/react'.
 *
 * Navigation and settings icons use regular weight (ph:*) — softer, less heavy strokes.
 * Action, status, and priority icons use fill weight (ph:*-fill) — higher legibility at small sizes.
 * Full icon browser: https://phosphoricons.com
 */
import { addCollection } from '@iconify/react';
import phData from '@iconify-json/ph/icons.json';

addCollection(phData);

// ─── Navigation ───────────────────────────────────────────────────────────────
export const icon = {
  // App nav — regular weight for softer appearance in the sidebar
  home:         'ph:house',
  calendar:     'ph:calendar-dots',
  tasks:        'ph:list-checks',
  training:     'ph:graduation-cap',
  documents:    'ph:folder-open',
  analytics:    'ph:chart-bar',
  settings:     'ph:gear',

  // Settings sub-nav — regular weight to match main nav
  profile:      'ph:user',
  organization: 'ph:buildings',
  roles:        'ph:clipboard-text',
  inventory:    'ph:archive',
  teams:        'ph:users-three',
  permissions:  'ph:shield-check',
  invite:       'ph:user-plus',
  rooms:        'ph:warehouse',

  // Actions
  eye:          'ph:eye-fill',
  edit:         'ph:pencil-simple-fill',
  close:        'ph:x-circle-fill',
  arrowRight:   'ph:arrow-right-fill',
  chevronLeft:  'ph:caret-left-fill',
  chevronRight: 'ph:caret-right-fill',

  // UI chrome
  bell:         'ph:bell-fill',
  help:         'ph:question-fill',
  power:        'ph:power-fill',
  moon:         'ph:moon-fill',
  sun:          'ph:sun-fill',

  // Status / feedback
  warning:      'ph:warning-fill',
  overdue:      'ph:calendar-x-fill',
  circleCheck:  'ph:check-circle-fill',

  // Priority levels (distinct, intentional meanings)
  priorityCritical: 'ph:warning-octagon-fill',
  priorityHigh:     'ph:arrow-fat-up-fill',
  priorityWarning:  'ph:warning-fill',
  priorityInfo:     'ph:info-fill',

  // Task / template types
  typeChecklist:     'ph:list-checks-fill',
  typeProcedure:     'ph:clipboard-text-fill',
  typeCompliance:    'ph:shield-check-fill',
  typeRequest:       'ph:handshake-fill',
  typeOnboarding:    'ph:graduation-cap-fill',
  typeSkillTraining: 'ph:target-fill',
  chevronDown:       'ph:caret-down-fill',

  // Room types (dental practice)
  roomLobby:          'ph:door-open-fill',
  roomFrontOffice:    'ph:desktop-fill',
  roomWaiting:        'ph:couch-fill',
  roomOperatory:      'ph:tooth-fill',
  roomSterilization:  'ph:broom-fill',
  roomXray:           'ph:scan-fill',
  roomLab:            'ph:flask-fill',
  roomConsultation:   'ph:chat-dots-fill',
  roomStorage:        'ph:package-fill',
  roomBreak:          'ph:coffee-fill',
  roomRestroom:       'ph:toilet-fill',
} as const;

export type IconName = typeof icon[keyof typeof icon];
