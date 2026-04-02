'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TemplatesTable } from './TemplatesTable';

const TABS = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'training', label: 'Training' },
];

const TASK_TYPES = ['checklist', 'procedure', 'compliance', 'request'];
const TRAINING_TYPES = ['onboarding', 'skill_training'];

export default function TemplatesSettingsPage() {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <>
      <PageHeader
        title="Templates"
        description="Create and manage task templates for checklists, procedures, compliance, and more."
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === 'tasks' && <TemplatesTable typeFilter={TASK_TYPES} />}
      {activeTab === 'training' && <TemplatesTable typeFilter={TRAINING_TYPES} />}
    </>
  );
}
