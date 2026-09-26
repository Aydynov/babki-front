import { Button } from '@/shared/ui/button';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface QueryErrorProps {
  onRetry: () => void;
  message?: string;
  compact?: boolean;
}

export const QueryError: FC<QueryErrorProps> = ({ onRetry, message, compact = false }) => {
  const { t } = useTranslation();
  const className = compact
    ? 'flex flex-wrap items-center gap-2'
    : 'flex min-h-28 flex-col items-center justify-center gap-3';

  return (
    <div
      className={className}
      role="alert"
    >
      <p className="text-destructive text-body-2">{message ?? t('queryState.error')}</p>
      <Button.Base
        type="button"
        variant="outline"
        onClick={onRetry}
      >
        {t('queryState.retry')}
      </Button.Base>
    </div>
  );
};
