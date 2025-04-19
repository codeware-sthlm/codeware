import { ComponentPropsWithRef } from 'react';

/**
 * Microsoft brand icons are not allowed by third parties due to legal reasons.
 *
 * All brand icons will be removed from lucide-react in the future:
 * https://github.com/lucide-icons/lucide/issues/94
 *
 * Simple icons does not provide Microsoft icons.
 */

/**
 * LinkedIn icon
 */
export const LinkedIn: React.FC<ComponentPropsWithRef<'svg'>> = (props) => (
  <svg
    fill="none"
    height="32"
    viewBox="0 0 32 32"
    width="32"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM8.18346 24H11.6965V13.461H8.18346V24ZM8.00781 9.94796C8.00781 11.0247 8.87377 11.8959 9.93997 11.8959C11.0062 11.8959 11.8721 11.0247 11.8721 9.94796C11.8721 8.87298 11.0079 8 9.93997 8C8.87201 8 8.00781 8.87298 8.00781 9.94796ZM20.4825 24H23.992V18.0999C23.992 12.3315 18.4977 12.5423 16.966 15.3808V13.461H13.453V24H16.966V18.9746C16.966 15.9499 20.4825 15.6707 20.4825 18.9746V24Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
