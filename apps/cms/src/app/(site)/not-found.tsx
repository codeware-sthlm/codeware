'use client';

import { usePayload } from '@codeware/shared/ui/cms-renderer';
import { NotFound } from '@codeware/shared/ui/primitives';

export default function NotFoundPage() {
  const { navigate } = usePayload();
  return <NotFound onGoHome={() => navigate('/')} />;
}
