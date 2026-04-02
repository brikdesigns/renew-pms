/**
 * Icon registry — Phosphor icon set via Iconify
 *
 * Registers the full Phosphor collection offline (bundled, no CDN).
 * Import named constants from here; render with <Icon icon={...} /> from '@iconify/react'.
 *
 * Full icon browser: https://phosphoricons.com
 */
import { addCollection } from '@iconify/react';
import phData from '@iconify-json/ph/icons.json';

addCollection(phData);

// ─── Navigation ───────────────────────────────────────────────────────────────
export const icon = {
  // App nav
  home:         'ph:house-fill',
  calendar:     'ph:calendar-dots',
  tasks:        'ph:list-checks',
  training:     'ph:graduation-cap',
  documents:    'ph:folder-open',
  analytics:    'ph:chart-bar',
  settings:     'ph:gear',

  // Settings sub-nav
  profile:      'ph:user',
  organization: 'ph:buildings',
  roles:        'ph:clipboard-list',
  inventory:    'ph:archive-box',
  teams:        'ph:users-three',
  permissions:  'ph:shield-person',
  invite:       'ph:user-plus',
  rooms:        'ph:warehouse',

  // Actions
  eye:          'ph:eye',
  edit:         'ph:pencil-simple',
  close:        'ph:x',
  arrowRight:   'ph:arrow-right',
  chevronLeft:  'ph:caret-left',
  chevronRight: 'ph:caret-right',

  // UI chrome
  bell:         'ph:bell',
  help:         'ph:question',
  power:        'ph:power',
  moon:         'ph:moon',
  sun:          'ph:sun',

  // Status / feedback
  warning:      'ph:warning',
  circleCheck:  'ph:check-circle',

  // Priority levels (distinct, intentional meanings)
  priorityCritical: 'ph:warning-octagon-fill',
  priorityHigh:     'ph:arrow-fat-up-fill',
  priorityWarning:  'ph:warning-fill',
  priorityInfo:     'ph:info',

  // Room types (dental practice)
  roomLobby:          'ph:door-open',
  roomFrontOffice:    'ph:desktop',
  roomWaiting:        'ph:couch',
  roomOperatory:      'ph:tooth',
  roomSterilization:  'ph:broom',
  roomXray:           'ph:scan',
  roomLab:            'ph:flask',
  roomConsultation:   'ph:chat-dots',
  roomStorage:        'ph:package',
  roomBreak:          'ph:coffee',
  roomRestroom:       'ph:toilet',
} as const;

export type IconName = typeof icon[keyof typeof icon];
