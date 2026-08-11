'use client';

import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Form,
  FormField,
  FormItem,
  FormMessage
} from '@codeware/shared/ui/shadcn/components/form';
import { t } from '@codeware/shared/util/i18n';
import type { Tour } from '@codeware/shared/util/payload-types';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Input } from '../form-items/Input';
import { ColSpan } from '../layout/ColSpan';
import { Grid } from '../layout/Grid';
import { usePayload } from '../providers/PayloadProvider';

/** Largest party a single signup may claim, before a guide gets involved */
const MAX_PEOPLE = 20;

type Values = {
  name: string;
  email: string;
  phone: string;
  people: number;
};

export type TourSignupFormProps = {
  tour: Tour;
  /**
   * Called once a signup is accepted, before any confirmation is shown.
   * Lets a host close the surface the form sits in (a sheet, a dialog).
   */
  onSuccess?: () => void;
};

/**
 * The platform's own signup form for a tour.
 *
 * Typed on purpose, and not built in the form builder: `people` is what
 * capacity is counted in, so it cannot be a field an editor is free to rename,
 * retype or delete.
 *
 * The form only ever *asks* for a place. Whether the customer gets one or
 * joins the waiting list is decided server-side while the tour row is locked,
 * so two people racing for the last seat get one honest answer each — which is
 * why the confirmation is read from the response rather than predicted here.
 */
export function TourSignupForm({ tour, onSuccess }: TourSignupFormProps) {
  const { locale, submitTourSignup } = usePayload();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<Values>({
    defaultValues: { name: '', email: '', phone: '', people: 1 }
  });

  const full = Boolean(tour.signupsFull);
  const seatsLeft = tour.seatsLeft ?? null;

  const onSubmit = useCallback(
    (values: Values) => {
      const invokeSubmit = async () => {
        setIsLoading(true);

        const { success, data } = await submitTourSignup({
          tour: tour.id,
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          people: Number(values.people)
        });

        setIsLoading(false);

        if (!success) {
          toast.error(t(locale, 'tourSignup.failed'));
          return;
        }

        form.reset();
        onSuccess?.();

        // The server decides; a customer who asked for a seat may well have
        // been queued behind someone who submitted a moment earlier
        toast.success(
          t(
            locale,
            data.status === 'waiting'
              ? 'tourSignup.successWaiting'
              : 'tourSignup.successBooked'
          )
        );
      };

      void invokeSubmit();
    },
    [form, locale, onSuccess, submitTourSignup, tour.id]
  );

  if (tour.signupsClosed) {
    return (
      <p className="text-core-muted text-sm">
        {t(locale, 'tourSignup.signupsClosed')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {full ? (
        <div>
          <p className="text-core-headline font-medium">
            {t(locale, 'tourSignup.full')}
          </p>
          <p className="text-core-muted mt-1 text-sm">
            {t(locale, 'tourSignup.fullLede')}
          </p>
        </div>
      ) : (
        seatsLeft !== null && (
          <p className="text-core-muted text-sm">
            {t(locale, 'tourSignup.seatsLeft', { count: String(seatsLeft) })}
          </p>
        )
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid columns={6} className="gap-x-4 gap-y-4">
            <ColSpan>
              <FormField
                control={form.control}
                name="name"
                rules={{ required: t(locale, 'tourSignup.required') }}
                render={({ field }) => (
                  <FormItem>
                    <Input
                      {...field}
                      type="text"
                      label={t(locale, 'tourSignup.name')}
                      placeholder={null}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ColSpan>

            <ColSpan columns={3}>
              <FormField
                control={form.control}
                name="email"
                rules={{ required: t(locale, 'tourSignup.required') }}
                render={({ field }) => (
                  <FormItem>
                    <Input
                      {...field}
                      type="email"
                      label={t(locale, 'tourSignup.email')}
                      placeholder={null}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ColSpan>

            <ColSpan columns={3}>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <Input
                      {...field}
                      type="tel"
                      label={t(locale, 'tourSignup.phone')}
                      placeholder={null}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ColSpan>

            <ColSpan columns={3}>
              <FormField
                control={form.control}
                name="people"
                rules={{
                  required: t(locale, 'tourSignup.required'),
                  min: {
                    value: 1,
                    message: t(locale, 'tourSignup.tooManyPeople', {
                      max: String(MAX_PEOPLE)
                    })
                  },
                  max: {
                    value: MAX_PEOPLE,
                    message: t(locale, 'tourSignup.tooManyPeople', {
                      max: String(MAX_PEOPLE)
                    })
                  }
                }}
                render={({ field }) => (
                  <FormItem>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={MAX_PEOPLE}
                      label={t(locale, 'tourSignup.people')}
                      placeholder={null}
                    />
                    <p className="text-core-muted mt-1 text-xs">
                      {t(locale, 'tourSignup.peopleHelp')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ColSpan>

            <ColSpan>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading
                  ? t(locale, 'tourSignup.submitting')
                  : full
                    ? t(locale, 'tourSignup.joinWaitingList')
                    : t(locale, 'tourSignup.submit')}
              </Button>
            </ColSpan>
          </Grid>
        </form>
      </Form>
    </div>
  );
}
