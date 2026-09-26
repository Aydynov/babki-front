import { Link, useRouter } from '@tanstack/react-router';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { currencyCodes } from '@/shared/lib/currency';
import { getFirstFieldError } from '@/shared/lib/form-errors';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Typography } from '@/shared/ui/typography';
import { useRegisterMutation } from '../api/auth.query';
import {
  defaultRegisterFormValues,
  getAuthMutationErrorKey,
  getAuthValidationKey,
  registerSchema,
} from '../model/auth-form';
import { PasswordInput } from './password-input';

export function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const mutationError = registerMutation.isError
    ? t(getAuthMutationErrorKey(registerMutation.error, 'register'))
    : undefined;

  const clearMutationError = () => {
    if (registerMutation.isError) {
      registerMutation.reset();
    }
  };

  const form = useForm({
    defaultValues: defaultRegisterFormValues,
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await registerMutation.mutateAsync(value);
        router.history.replace('/main');
      } catch {
        // Mutation state retains the error and form values for retry.
      }
    },
  });

  const getValidationMessage = (errors: unknown[]) => {
    const key = getAuthValidationKey(getFirstFieldError(errors));
    return key ? t(key) : undefined;
  };

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <form.Field name="firstName">
          {(field) => {
            const error = getValidationMessage(field.state.meta.errors);

            return (
              <div>
                <Input.Label htmlFor="register-first-name">{t('auth.fields.firstName')}</Input.Label>
                <Input.Base
                  id="register-first-name"
                  name={field.name}
                  autoComplete="given-name"
                  maxLength={100}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  hasError={Boolean(error)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'register-first-name-error' : undefined}
                  disabled={registerMutation.isPending}
                />
                {error && (
                  <Input.Error id="register-first-name-error" role="alert">{error}</Input.Error>
                )}
              </div>
            );
          }}
        </form.Field>

        <form.Field name="lastName">
          {(field) => {
            const error = getValidationMessage(field.state.meta.errors);

            return (
              <div>
                <Input.Label htmlFor="register-last-name">{t('auth.fields.lastName')}</Input.Label>
                <Input.Base
                  id="register-last-name"
                  name={field.name}
                  autoComplete="family-name"
                  maxLength={100}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    clearMutationError();
                    field.handleChange(event.target.value);
                  }}
                  hasError={Boolean(error)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'register-last-name-error' : undefined}
                  disabled={registerMutation.isPending}
                />
                {error && (
                  <Input.Error id="register-last-name-error" role="alert">{error}</Input.Error>
                )}
              </div>
            );
          }}
        </form.Field>
      </div>

      <form.Field name="email">
        {(field) => {
          const error = getValidationMessage(field.state.meta.errors);

          return (
            <div>
              <Input.Label htmlFor="register-email">{t('auth.fields.email')}</Input.Label>
              <Input.Base
                id="register-email"
                name={field.name}
                type="email"
                autoComplete="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  clearMutationError();
                  field.handleChange(event.target.value);
                }}
                hasError={Boolean(error)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'register-email-error' : undefined}
                disabled={registerMutation.isPending}
              />
              {error && (
                <Input.Error id="register-email-error" role="alert">{error}</Input.Error>
              )}
            </div>
          );
        }}
      </form.Field>

      <form.Field name="password">
        {(field) => {
          const error = getValidationMessage(field.state.meta.errors);

          return (
            <div>
              <Input.Label htmlFor="register-password">{t('auth.fields.password')}</Input.Label>
              <PasswordInput
                id="register-password"
                name={field.name}
                autoComplete="new-password"
                maxLength={128}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  clearMutationError();
                  field.handleChange(event.target.value);
                }}
                hasError={Boolean(error)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'register-password-error' : undefined}
                disabled={registerMutation.isPending}
              />
              {error && (
                <Input.Error id="register-password-error" role="alert">{error}</Input.Error>
              )}
            </div>
          );
        }}
      </form.Field>

      <form.Field name="defaultCurrency">
        {(field) => {
          const error = getValidationMessage(field.state.meta.errors);

          return (
            <div>
              <Input.Label htmlFor="register-currency">{t('auth.fields.currency')}</Input.Label>
              <select
                id="register-currency"
                name={field.name}
                className={`
                  flex h-11 w-full rounded-lg border bg-background px-3 py-2 text-body-2 outline-none
                  transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                  disabled:cursor-not-allowed disabled:opacity-50
                `}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  clearMutationError();
                  field.handleChange(event.target.value);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'register-currency-error' : undefined}
                disabled={registerMutation.isPending}
              >
                {currencyCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              {error && (
                <Input.Error id="register-currency-error" role="alert">{error}</Input.Error>
              )}
            </div>
          );
        }}
      </form.Field>

      {mutationError && (
        <Typography.Caption1
          className="text-destructive"
          role="alert"
          aria-live="polite"
        >
          {mutationError}
        </Typography.Caption1>
      )}

      <Button.Base
        className="w-full"
        type="submit"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
      </Button.Base>

      <Typography.Body3 className="text-center text-muted-foreground">
        {t('auth.register.hasAccount')}
        {' '}
        <Link
          className="font-medium text-foreground underline underline-offset-4"
          to="/login"
          search={{}}
        >
          {t('auth.register.loginLink')}
        </Link>
      </Typography.Body3>
    </form>
  );
}
