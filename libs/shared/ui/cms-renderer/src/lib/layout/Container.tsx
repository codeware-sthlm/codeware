import { cn } from '@codeware/shared/util/ui';
import { forwardRef } from 'react';

/**
 * Responsive container system for consistent page layouts.
 *
 * **Purpose:**
 *
 * - Provides a multi-layer responsive layout that creates proper visual hierarchy
 * - Ensures consistent spacing and max-widths across all breakpoints
 * - Aligns content with the site's background container (.bg-core-background-content)
 *
 * **Structure:**
 *
 * Four-layer nesting creates proper spacing through cascading containers:
 * 1. Outer padding (sm:px-8) - Initial responsive padding on larger screens
 * 2. Max-width constraint (max-w-7xl + lg:px-8) - Prevents overly wide layouts
 * 3. Inner padding (px-4→px-8→px-12) - Progressive spacing at breakpoints
 * 4. Content max-width (max-w-2xl→max-w-5xl) - Optimal reading width
 *
 * The nesting is intentional - each layer adds spacing that compounds for better visual rhythm.
 *
 * **Usage:**
 *
 * - Use `Container` for most page content (combines Outer + Inner)
 * - Use `ContainerOuter` + `ContainerInner` separately when you need
 *   custom elements between the layers (e.g., border-top in Footer)
 *
 * @example
 * // Standard usage
 * <Container className="mt-16">
 *   <h1>Page Title</h1>
 * </Container>
 *
 * // Separated layers (like Footer)
 * <ContainerOuter>
 *   <div className="border-t">
 *     <ContainerInner>
 *       <p>Footer content</p>
 *     </ContainerInner>
 *   </div>
 * </ContainerOuter>
 */
export const Container = forwardRef<
  React.ComponentRef<typeof ContainerOuter>,
  React.ComponentPropsWithoutRef<typeof ContainerOuter>
>(function Container({ children, ...props }, ref) {
  return (
    <ContainerOuter ref={ref} {...props}>
      <ContainerInner>{children}</ContainerInner>
    </ContainerOuter>
  );
});

/**
 * Use `ContainerOuter` + `ContainerInner` separately when you need
 * custom elements between the layers (e.g., border-top in Footer)
 *
 * @example
 *
 * <ContainerOuter>
 *   <div className="border-t">
 *     <ContainerInner>
 *       <p>Footer content</p>
 *     </ContainerInner>
 *   </div>
 * </ContainerOuter>
 */
export const ContainerOuter = forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(function OuterContainer({ className, children, ...props }, ref) {
  return (
    <div ref={ref} className={cn('sm:px-8', className)} {...props}>
      <div className="mx-auto w-full max-w-7xl lg:px-8">{children}</div>
    </div>
  );
});

export const ContainerInner = forwardRef<
  React.ComponentRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(function InnerContainer({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn('relative px-4 sm:px-8 lg:px-12', className)}
      {...props}
    >
      <div className="mx-auto max-w-2xl lg:max-w-5xl">{children}</div>
    </div>
  );
});
