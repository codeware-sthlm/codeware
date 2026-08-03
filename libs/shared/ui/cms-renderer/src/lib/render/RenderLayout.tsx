'use client';

import type {
  FooterData,
  NavigationItem
} from '@codeware/shared/util/payload-api';
import { House } from 'lucide-react';

import { Container } from '../layout/Container';
import { DesktopNavigation } from '../navigation/DesktopNavigation';
import { Footer } from '../navigation/Footer';
import { MobileNavigation } from '../navigation/MobileNavigation';
import { usePayload } from '../providers/PayloadProvider';
import { ThemeSwitch } from '../theme/ThemeSwitch';
import { TenantIcon } from '../utils/TenantIcon';

type RenderLayoutProps = {
  children: React.ReactNode;
  /**
   * Footer content, or `null` when the tenant has no footer.
   * The app is responsible for fetching this data.
   */
  footer: FooterData | null;
  /**
   * Navigation items for the header.
   * The app is responsible for fetching this data.
   */
  navigationTree: NavigationItem[];
};

/**
 * Framework-agnostic layout component for CMS sites.
 *
 * Renders the main layout structure with:
 * - Header with logo, navigation (desktop/mobile), and theme switcher
 * - Main content area
 * - Footer as configured in the CMS site settings
 *
 * **Usage:**
 * The app is responsible for:
 * - Fetching navigation and footer data
 * - Providing PayloadProvider context with framework-specific implementations
 * - Wrapping with theme provider if needed (e.g., next-themes for Next.js)
 *
 * @example
 * ```tsx
 * // In Next.js app
 * const navigationTree = await getNavigationTree(payload);
 * const footer = await getFooter(payload, navigationTree);
 *
 * return (
 *   <Providers>
 *     <RenderLayout footer={footer} navigationTree={navigationTree}>
 *       {children}
 *     </RenderLayout>
 *   </Providers>
 * );
 * ```
 */
export function RenderLayout({
  children,
  footer,
  navigationTree
}: RenderLayoutProps) {
  const { navigate, iconConfig } = usePayload();

  return (
    <div className="flex w-full">
      {/* Create a center aligned section with background space on each side */}
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          {/* Content section */}
          <div className="bg-core-background-content ring-core-content-border w-full ring-1" />
        </div>
      </div>
      {/* Display header, main and footer inside the content section.
          Full viewport height keeps the footer at the bottom on short pages,
          where its surface would otherwise end mid-panel */}
      <div className="relative flex min-h-screen w-full flex-col">
        <header className="pointer-events-none relative z-50 flex flex-none flex-col">
          <div className="top-0 z-10 h-16 pt-6">
            <Container className="w-full">
              <div className="relative flex gap-4">
                <div className="flex flex-1">
                  <div className="flex h-10 w-10 items-center backdrop-blur">
                    <button
                      onClick={() => navigate('/')}
                      className="pointer-events-auto"
                      aria-label="Home"
                    >
                      {iconConfig ? (
                        <TenantIcon config={iconConfig} size={40} />
                      ) : (
                        <House size={40} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-1 justify-end md:justify-center">
                  <MobileNavigation
                    navigationTree={navigationTree}
                    className="pointer-events-auto md:hidden"
                  />
                  <DesktopNavigation
                    navigationTree={navigationTree}
                    aria-label="Main"
                    className="pointer-events-auto hidden md:block"
                  />
                </div>
                <div className="flex items-end justify-end md:flex-1">
                  <div className="pointer-events-auto">
                    <ThemeSwitch />
                  </div>
                </div>
              </div>
            </Container>
          </div>
        </header>

        <main className="flex-auto">{children}</main>
        <Footer footer={footer} />
      </div>
    </div>
  );
}
