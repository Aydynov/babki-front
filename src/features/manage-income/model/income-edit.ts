interface IncomeEditBaseline {
  amount: number;
  description: string;
}

export const getIncomeEditPatch = (
  draft: { amount: string; description: string },
  baseline: IncomeEditBaseline,
) => ({
  ...(Number(draft.amount) !== baseline.amount ? { amount: Number(draft.amount) } : {}),
  ...(draft.description.trim() !== baseline.description ? { description: draft.description.trim() } : {}),
});

export const recoverMissingIncome = async (
  error: unknown,
  dependencies: { close: () => void; notify: () => void; refresh: () => Promise<unknown> },
) => {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  if (status !== 404) return false;
  dependencies.close();
  dependencies.notify();
  await dependencies.refresh().catch(() => undefined);
  return true;
};
