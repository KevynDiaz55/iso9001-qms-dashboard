'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlaybook } from '../../../lib/hooks';
import { apiUrl } from '../../../lib/api';
import { Card } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';

function PlaybookPageContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [activeStepId, setActiveStepId] = useState<number | null>(null);

  const { data, isLoading, error } = usePlaybook(companyId ?? undefined);
  const queryClient = useQueryClient();

  const toggleTask = useMutation({
    mutationFn: async (payload: { id: number; isDone: boolean }) => {
      const res = await fetch(apiUrl(`/api/playbook/company/${companyId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update playbook task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook'] });
    },
  });

  if (!companyId) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Playbook</h1>
        <p className="text-sm text-slate-600">
          Select a company to guide them through ISO 9001 implementation.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Loading playbook…</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-red-600">Failed to load playbook.</p>;
  }

  const { steps, tasks } = data;
  const currentStep =
    steps.find((s: any) => s.id === activeStepId) ?? (steps.length ? steps[0] : null);
  const currentTasks = currentStep
    ? tasks.filter((t: any) => t.stepId === currentStep.id)
    : [];

  return (
    <div className="space-y-4">
      <Card
        title="Guided ISO 9001 implementation"
        subtitle="Follow these phases and complete the checklist to lead any company to certification as fast as possible."
      >
        <p className="text-sm text-slate-600">
          Each phase groups key activities, from defining scope and leadership engagement through
          documentation, implementation, internal audits, and certification preparation.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        <Card title="Phases">
          <ol className="space-y-2 text-sm">
            {steps.map((step: any) => {
              const stepTasks = tasks.filter((t: any) => t.stepId === step.id);
              const completed = stepTasks.filter((t: any) => t.isDone).length;
              const total = stepTasks.length || 1;
              const percent = Math.round((completed / total) * 100);
              const active = (currentStep && currentStep.id === step.id) || (!currentStep && step === steps[0]);
              return (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setActiveStepId(step.id)}
                    className={`w-full text-left rounded-lg px-3 py-2 ${
                      active ? 'bg-primary-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-slate-800">
                      {step.order}. {step.title}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {completed}/{total} tasks complete
                      </span>
                      <span>{percent}%</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card
          title={currentStep ? currentStep.title : 'Select a phase'}
          subtitle={currentStep?.description}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">Checklist</div>
              <ul className="space-y-2 text-sm">
                {currentTasks.map((task: any) => (
                  <li key={task.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.isDone}
                      onChange={(e) =>
                        toggleTask.mutate({ id: task.id, isDone: e.target.checked })
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-slate-800">{task.title}</div>
                      <div className="text-xs text-slate-500">{task.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500">At a glance</div>
              <StatusBadge
                status={
                  currentTasks.every((t: any) => t.isDone) && currentTasks.length > 0
                    ? 'approved'
                    : 'in_progress'
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function PlaybookPage() {
  return (
    <Suspense fallback={null}>
      <PlaybookPageContent />
    </Suspense>
  );
}

