/* eslint-disable no-redeclare */
import { ContentBlockSize } from '@codeware/shared/util/payload-types';
import { type ReactNode, createContext, useContext, useMemo } from 'react';

type ColumnSizeContextValue = {
  /** The fraction of the current column related to the whole page */
  effectiveFraction: number;
  /** Whether the current column is nested within another column */
  isNested: boolean;
  /** The size of the parent column */
  parentSize?: ContentBlockSize;
  /** The fraction of the parent column, calculated from `parentSize` */
  parentFraction?: number;
  /** The size of the current column */
  selfSize: ContentBlockSize;
  /** The fraction of the current column, calculated from `selfSize` */
  selfFraction: number;
};

type ColumnSizeProviderProps = {
  children: ReactNode;
  /** The size of the current column */
  size: ContentBlockSize;
};

// Helper function to convert size strings to numeric fractions
const convertSizeToFraction = (size: ContentBlockSize) => {
  switch (size) {
    case 'full':
      return 1;
    case 'half':
      return 0.5;
    case 'one-third':
      return 1 / 3;
    case 'two-thirds':
      return 2 / 3;
    default:
      return 1;
  }
};

// Create a context
const ColumnSizeContext = createContext<ColumnSizeContextValue | null>(null);

/**
 * This provider is used to pass the size of the current column to the children.
 *
 * Supports nested columns to keep track of the effective size of the current column,
 * related to all parent columns.
 *
 * The `useColumnSize` hook provides access to the nearest and parent column sizes and calculated fractions.
 *
 * @param size - The size of the current column
 * @param children - The child elements to render
 */
export const ColumnSizeProvider = ({
  size,
  children
}: ColumnSizeProviderProps) => {
  // Get the parent context if it exists
  const parentContext = useContext(ColumnSizeContext);

  // Calculate the effective values
  const value = useMemo<ColumnSizeContextValue>(() => {
    const selfFraction = convertSizeToFraction(size);

    // If no parent context, this is a root column
    if (!parentContext) {
      return {
        isNested: false,
        effectiveFraction: selfFraction,
        selfSize: size,
        selfFraction
      };
    }

    // Handle nested columns
    return {
      isNested: true,
      effectiveFraction: parentContext.effectiveFraction * selfFraction,
      selfSize: size,
      selfFraction,
      parentSize: parentContext.selfSize,
      parentFraction: parentContext.selfFraction
    };
  }, [size, parentContext]);

  // Provide the context value to the children
  return (
    <ColumnSizeContext.Provider value={value}>
      {children}
    </ColumnSizeContext.Provider>
  );
};

/**
 * This hook provides access to column sizes and calculated fractions
 * for the component that is nested within a `ColumnSizeProvider`.
 *
 * @param silent - Whether to not throw an error if the context is not found (default: `false`)
 * @returns The column size context value or `null` if `silent` is `true` and the context is not found
 */
export function useColumnSize(): ColumnSizeContextValue;
export function useColumnSize(options?: {
  silent: false;
}): ColumnSizeContextValue;
export function useColumnSize(options: {
  silent: true;
}): ColumnSizeContextValue | null;
export function useColumnSize(options?: {
  silent?: boolean;
}): ColumnSizeContextValue | null {
  const context = useContext(ColumnSizeContext);
  const silent = options?.silent ?? false;

  if (context === null && silent === false) {
    throw new Error('useColumnSize must be used within a ColumnSizeProvider');
  }

  return context;
}
