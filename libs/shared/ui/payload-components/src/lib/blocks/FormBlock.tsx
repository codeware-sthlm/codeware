import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
  FormField,
  FormItem,
  FormMessage
} from '@codeware/shared/ui/shadcn';
import type {
  FormBlock as FormBlockProps,
  FormSubmissionData,
  Form as FormType
} from '@codeware/shared/util/payload-types';
import type { FieldValues } from '@payloadcms/plugin-form-builder/types';
import { useCallback, useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '../form-items/Button';
import { Checkbox } from '../form-items/Checkbox';
import { countryOptions } from '../form-items/country-options';
import { Input } from '../form-items/Input';
import { Select } from '../form-items/Select';
import { Textarea } from '../form-items/Textarea';
import { ColSpan } from '../layout/ColSpan';
import { Grid } from '../layout/Grid';
import { usePayload } from '../providers/PayloadProvider';

import { RichText } from './RichText';

// Assume form has the proper type but validate it before render anyway
type Props = FormBlockProps;

/**
 * Render Payload form block data, with the configured form fields.
 */
export const FormBlock: React.FC<Props> = ({
  enableIntro,
  form: formFromProps,
  introContent
}) => {
  const formBuilder =
    typeof formFromProps === 'object' ? formFromProps : ({} as FormType);

  // Since FormField is using a controlled component,
  // we need to provide default values for the form fields
  // since undefined is not allowed and will throw console errors.
  const defaultValues = formBuilder.fields?.reduce((acc, field) => {
    // Form fields have a name property
    if ('name' in field) {
      acc[field.name] =
        ('defaultValue' in field ? field.defaultValue : '') ?? '';
    }
    return acc;
  }, {} as FieldValues);

  // Initialize form without zod validation
  const form = useForm({
    defaultValues
  });

  // Payload context
  const { navigate, submitForm } = usePayload();

  // Control loading state and open confirmation dialog
  const [isLoading, setIsLoading] = useState(false);
  const [openConfirmationDialog, setOpenConfirmationDialog] = useState(false);

  const {
    confirmationMessage,
    confirmationType,
    id: formId,
    redirect,
    submitButtonLabel
  } = formBuilder;

  // Submit handler
  const onSubmit = useCallback(
    (formValue: FieldValues) => {
      const invokeSubmit = async () => {
        setIsLoading(true);
        try {
          // Convert form data to submission data
          const submissionData: FormSubmissionData = Object.entries(
            formValue
          ).map(([field, value]) => ({
            field,
            value: String(value)
          }));

          // Invoke provider callback
          const { success } = await submitForm({
            form: formId,
            submissionData
          });

          setIsLoading(false);

          // Show error toast if response is not ok
          if (!success) {
            toast.error('Form submission failed');
            return;
          }

          // Successfully submitted form
          form.reset();

          // Act on the type of confirmation
          let confirmed = false;
          if (confirmationType === 'message') {
            // Open dialog with a message
            setOpenConfirmationDialog(true);
            confirmed = true;
          } else if (confirmationType === 'redirect' && redirect) {
            // Redirect to collection document or URL if provided
            const { type, reference, url } = redirect;
            // Default to the url
            let href = url;
            if (
              type === 'reference' &&
              typeof reference?.value === 'object' &&
              reference.value.slug
            ) {
              // Get reference url
              // TODO: Are other collections than pages prefixed with their slug?
              href =
                reference.relationTo === 'pages'
                  ? reference.value.slug
                  : reference.relationTo
                    ? `/${reference.relationTo}`
                    : '';
            }
            if (href) {
              try {
                console.log('Redirecting to', href);
                navigate(href);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (_) {
                // Do nothing
              }
              confirmed = true;
            } else {
              console.warn('Unable to extract redirect url');
            }
          }

          // Show success toast when user isn't confirmed at all
          if (!confirmed) {
            toast.success('Form submitted successfully');
          }
        } catch (err) {
          console.warn('Unknown error on form submission', err);
          setIsLoading(false);

          // Show error toast
          toast.error('Form submission failed', {
            description: 'Please try again.'
          });
        }
      };

      invokeSubmit();
    },
    [confirmationType, form, formId, navigate, redirect, submitForm]
  );

  const onError = (errors: FieldErrors) => {
    console.log('[DEBUG] errors', errors);
  };

  if (formBuilder.id === undefined) {
    console.warn('Form builder is not an object?');
    return null;
  }

  return (
    <div className="rounded-lg border px-5 py-6">
      {enableIntro && introContent && (
        <RichText className="mb-6 lg:mb-8" data={introContent} />
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="mr-1 mb-1 space-y-6"
        >
          {/* Grid columns must be in sync with forms plugin, width field */}
          <Grid columns={6}>
            {/* Loop through form builder field definitions */}
            {formBuilder?.fields?.map((fieldDef, index) => {
              // Handle message separately since it's not a form field.
              // It can be used to display a message to the user anywhere in the form.
              if (fieldDef.blockType === 'message') {
                return (
                  fieldDef.message && (
                    <ColSpan
                      className="my-4 border-l-4 bg-inherit p-3 last:mb-0"
                      key={index}
                    >
                      <RichText data={fieldDef.message} disableProse={true} />
                    </ColSpan>
                  )
                );
              }
              return (
                <ColSpan columns={fieldDef.width} key={index}>
                  <FormField
                    control={form.control}
                    name={fieldDef.name}
                    rules={{ required: fieldDef.required ?? false }}
                    render={({ field }) => {
                      return (
                        <FormItem>
                          {/* (Håkan) I chose to do this way to get full type safety on the builderField.
                          Could this be improved to detect missing component implementations? */}
                          {fieldDef.blockType === 'checkbox' && (
                            <Checkbox
                              label={fieldDef.label ?? fieldDef.name}
                              {...field}
                            />
                          )}
                          {fieldDef.blockType === 'country' && (
                            <Select
                              label={fieldDef.label}
                              placeholder={fieldDef.placeholder}
                              options={countryOptions}
                              {...field}
                            />
                          )}
                          {fieldDef.blockType === 'email' && (
                            <Input
                              type="email"
                              label={fieldDef.label}
                              placeholder={fieldDef.placeholder}
                              {...field}
                            />
                          )}
                          {fieldDef.blockType === 'number' && (
                            <Input
                              type="number"
                              label={fieldDef.label}
                              placeholder={fieldDef.placeholder}
                              {...field}
                            />
                          )}
                          {fieldDef.blockType === 'select' && (
                            <Select
                              label={fieldDef.label}
                              placeholder={fieldDef.placeholder}
                              options={fieldDef.options ?? []}
                              {...field}
                            />
                          )}
                          {fieldDef.blockType === 'text' && (
                            <Input
                              type="text"
                              label={fieldDef.label}
                              placeholder={fieldDef.placeholder}
                              {...field}
                            />
                          )}
                          {fieldDef.blockType === 'textarea' && (
                            <Textarea
                              label={fieldDef.label}
                              placeholder={fieldDef.placeholder}
                              {...field}
                            />
                          )}
                          {/* <FormDescription></FormDescription> */}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </ColSpan>
              );
            })}
          </Grid>

          <Button type="submit" isLoading={isLoading} className="mt-4">
            {submitButtonLabel}
          </Button>
        </form>
      </Form>

      {/* Display confirmation message in a dialog */}
      <Dialog
        open={openConfirmationDialog}
        onOpenChange={setOpenConfirmationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Form submitted successfully</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {confirmationMessage && <RichText data={confirmationMessage} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};
