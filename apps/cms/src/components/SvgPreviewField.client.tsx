'use client';
import {
  Button,
  FieldLabel,
  useField,
  useFormFields,
  useTranslation
} from '@payloadcms/ui';
import type { TextareaFieldClientProps } from 'payload';
import { useId, useState } from 'react';
import { createPortal } from 'react-dom';

import { InlineIcon } from '@codeware/shared/ui/primitives';
import { SeedIconStudio } from '@codeware/shared/ui/seed-icon-studio';
import { t } from '@codeware/shared/util/i18n';

/**
 * Renders a textarea for SVG markup input with a button to open the Seed Icon Studio.
 *
 * When an SVG is selected in the studio, it updates the textarea value.
 * Also displays a preview of the SVG below the textarea.
 */
export const SvgPreviewField: React.FC<TextareaFieldClientProps> = ({
  field,
  path,
  readOnly
}) => {
  const id = useId();
  const { value, setValue } = useField<string>({ path });
  const [studioOpen, setStudioOpen] = useState(false);
  const { i18n } = useTranslation();
  const appName = useFormFields(
    ([fields]) => fields['general.appName']?.value as string | undefined
  );

  return (
    <div className="field-type textarea">
      <FieldLabel htmlFor={id} label={field.label} />
      <textarea
        id={id}
        className="textarea__input"
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
        rows={6}
        readOnly={readOnly}
      />
      <div className="mt-2.5 flex items-center gap-2">
        <Button
          buttonStyle="subtle"
          size="medium"
          onClick={() => setStudioOpen(true)}
          disabled={readOnly}
        >
          {t(i18n.language, 'svgPreview.browseStudio')}
        </Button>
        {value && <InlineIcon svgCode={value} size={48} />}
      </div>

      {studioOpen &&
        createPortal(
          <div
            className="twp"
            style={{ position: 'fixed', inset: 0, zIndex: 2147483647 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <SeedIconStudio
              seed={appName}
              onSelect={(svg) => {
                setValue(svg);
                setStudioOpen(false);
              }}
              onClose={() => setStudioOpen(false)}
            />
          </div>,
          document.body
        )}
    </div>
  );
};

export default SvgPreviewField;
