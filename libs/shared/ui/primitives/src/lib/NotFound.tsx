import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { t } from '@codeware/shared/util/i18n';

type NotFoundProps = {
  /**
   * Callback function when the "Go back home" button is clicked.
   * Implement this based on your framework's navigation.
   */
  onGoHome?: () => void;

  /**
   * The current locale used for translating UI strings.
   * Defaults to 'en' if not provided.
   *
   * @example 'en', 'sv'
   */
  locale?: string;
};

/**
 * Reusable 404 Not Found page component.
 *
 * A centered error page with a large "404" heading and a button to return home.
 * Framework-agnostic and can be used anywhere in the monorepo.
 *
 * @example
 * ```tsx
 * // Next.js
 * import { NotFound } from '@codeware/shared/ui/primitives';
 * export default function NotFoundPage() {
 *   const router = useRouter();
 *   return <NotFound onGoHome={() => router.push('/')} />;
 * }
 *
 * // Remix
 * import { NotFound } from '@codeware/shared/ui/primitives';
 * export default function NotFoundRoute() {
 *   const navigate = useNavigate();
 *   return <NotFound onGoHome={() => navigate('/')} />;
 * }
 * ```
 */
export function NotFound({ onGoHome, locale = 'en' }: NotFoundProps) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-foreground/10 mb-2 text-9xl font-bold tracking-tight">
            404
          </h1>
          <div className="relative -mt-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t(locale, 'notFound.title')}
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              {t(locale, 'notFound.description')}
            </p>
          </div>
        </div>
        {onGoHome && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={onGoHome} size="lg">
              {t(locale, 'notFound.goHome')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
