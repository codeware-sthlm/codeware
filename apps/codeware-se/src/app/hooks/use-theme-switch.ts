'use client';

import { useEffect } from 'react';

/**
 * Theme toogle button and dark/light icon id's
 */
export const THEME_ID = {
  toggleButtonId: 'theme-toggle',
  lightIconId: 'theme-toggle-light-icon',
  darkIconId: 'theme-toggle-dark-icon'
};

const THEME = {
  ...THEME_ID,
  light: 'light',
  dark: 'dark',
  storageKey: 'color-theme'
};

/**
 * Switch theme between light and dark by listening to button clicks.
 *
 * Should be used in root app file.
 * @example
 *
 * // Add hook to root app file
 * import { useThemeSwitch } from '@mx/shared/util/hooks';
 *
 * const App = (...) => {
 *   useThemeSwitch();
 *
 *   ...
 *
 *   return (
 *     {...}
 *   );
 * }
 *
 * // Add button to any page
 *
 * const HomePage = (...) => {
 *  {...}
 *
 *   return (
 *    {...}
 *     <div>
 *      // Custom button
 *       <button id='theme-toggle' type='button'>
 *         <svg id='theme-toggle-light-icon' {...}> ... </svg>
 *         <svg id='theme-toggle-dark-icon' {...}> ... </svg>
 *       </button>
 *     </div>
 *
 *    // Or use the provided ui button
 *    <ButtonThemeToggle />
 *    {...}
 *   );
 */
export const useThemeSwitch = () => {
  useEffect(() => {
    const darkIcon = document.getElementById(THEME.darkIconId);
    const lightIcon = document.getElementById(THEME.lightIconId);
    const toggleBtn = document.getElementById(THEME.toggleButtonId);

    if (!darkIcon || !lightIcon) {
      return;
    }

    // Change the icons inside the button based on previous settings
    if (
      localStorage.getItem(THEME.storageKey) === THEME.dark ||
      (!(THEME.storageKey in localStorage) &&
        window.matchMedia(`(prefers-color-scheme: ${THEME.dark})`).matches)
    ) {
      lightIcon.classList.remove('hidden');
    } else {
      darkIcon.classList.remove('hidden');
    }

    if (!toggleBtn) {
      return;
    }

    // Listen to button clicks and switch theme
    toggleBtn.addEventListener('click', function () {
      const rootClass = document.documentElement.classList;
      let storeTheme = localStorage.getItem(THEME.storageKey);

      // toggle icons inside button
      darkIcon.classList.toggle('hidden');
      lightIcon.classList.toggle('hidden');

      // if set via local storage previously
      if (storeTheme) {
        if (storeTheme === THEME.light) {
          rootClass.add(THEME.dark);
          storeTheme = THEME.dark;
        } else {
          rootClass.remove(THEME.dark);
          storeTheme = THEME.light;
        }
      }
      // if NOT set via local storage previously
      else {
        if (rootClass.contains(THEME.dark)) {
          rootClass.remove(THEME.dark);
          storeTheme = THEME.light;
        } else {
          rootClass.add(THEME.dark);
          storeTheme = THEME.dark;
        }
      }

      // Save new theme to local storage
      localStorage.setItem(THEME.storageKey, storeTheme);
    });
  }, []);
};
