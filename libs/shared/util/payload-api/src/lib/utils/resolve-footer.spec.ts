import type { SiteSetting } from '@codeware/shared/util/payload-types';
import { describe, expect, it } from 'vitest';

import { resolveFooter } from './resolve-footer';
import type { NavigationItem } from './types';

const navigationTree: Array<NavigationItem> = [
  { collection: 'pages', key: 'nav-1', label: 'About', url: '/about' },
  { collection: 'posts', key: 'nav-2', label: 'News', url: '/posts/news' }
];

/**
 * Build site settings for the fields `resolveFooter` reads:
 * `general.appName` and everything under `footer`.
 */
const makeSettings = (footer?: SiteSetting['footer']): SiteSetting =>
  ({
    general: { appName: 'Acme' },
    footer
  }) as SiteSetting;

describe('resolveFooter', () => {
  it('returns null when there are no site settings', () => {
    expect(resolveFooter(null, navigationTree)).toBeNull();
  });

  it('returns null when the footer is disabled', () => {
    expect(
      resolveFooter(makeSettings({ enabled: false }), navigationTree)
    ).toBeNull();
  });

  it('mirrors the navigation tree when settings predate the footer', () => {
    const footer = resolveFooter(makeSettings(), navigationTree);

    expect(footer).toEqual({
      appName: 'Acme',
      contact: [],
      copyright: '© {year} Acme',
      links: [
        { key: 'nav-1', label: 'About', newTab: false, url: '/about' },
        { key: 'nav-2', label: 'News', newTab: false, url: '/posts/news' }
      ],
      showVersion: false,
      tagline: null,
      variant: 'standard'
    });
  });

  it('renders no links when links are turned off', () => {
    const footer = resolveFooter(
      makeSettings({ linkSource: 'none' }),
      navigationTree
    );

    expect(footer?.links).toEqual([]);
  });

  it('resolves custom links to reference paths and custom URLs', () => {
    const footer = resolveFooter(
      makeSettings({
        linkSource: 'custom',
        links: [
          {
            id: 'link-1',
            link: {
              type: 'reference',
              reference: {
                relationTo: 'pages',
                value: { slug: 'pricing' }
              },
              label: 'Pricing'
            }
          },
          {
            id: 'link-2',
            link: {
              type: 'reference',
              reference: {
                relationTo: 'posts',
                value: { slug: 'launch' }
              },
              label: 'Launch'
            }
          },
          {
            id: 'link-3',
            link: {
              type: 'custom',
              url: 'https://status.acme.io',
              newTab: true,
              label: 'Status'
            }
          }
        ]
      } as SiteSetting['footer']),
      navigationTree
    );

    expect(footer?.links).toEqual([
      { key: 'link-1', label: 'Pricing', newTab: false, url: '/pricing' },
      { key: 'link-2', label: 'Launch', newTab: false, url: '/posts/launch' },
      {
        key: 'link-3',
        label: 'Status',
        newTab: true,
        url: 'https://status.acme.io'
      }
    ]);
  });

  it('drops custom links that cannot be resolved', () => {
    const footer = resolveFooter(
      makeSettings({
        linkSource: 'custom',
        links: [
          // Referenced document was deleted
          { id: 'link-1', link: { type: 'reference', label: 'Gone' } },
          // Reference not populated, fetched with insufficient depth
          {
            id: 'link-2',
            link: {
              type: 'reference',
              reference: { relationTo: 'pages', value: 42 },
              label: 'Unpopulated'
            }
          },
          // Custom link without a URL
          { id: 'link-3', link: { type: 'custom', label: 'No URL' } }
        ]
      } as SiteSetting['footer']),
      navigationTree
    );

    expect(footer?.links).toEqual([]);
  });

  it('drops the copyright line when it is turned off', () => {
    const footer = resolveFooter(
      makeSettings({ showCopyright: false, copyright: '© {year} Acme AB' }),
      navigationTree
    );

    expect(footer?.copyright).toBeNull();
  });

  it('passes through the editable footer content', () => {
    const contact = [
      { platform: 'email' as const, email: 'hi@acme.io', id: 'contact-1' }
    ];

    const footer = resolveFooter(
      makeSettings({
        contact,
        copyright: '© {year} Acme AB',
        showVersion: true,
        tagline: 'We build things'
      } as SiteSetting['footer']),
      navigationTree
    );

    expect(footer).toMatchObject({
      contact,
      copyright: '© {year} Acme AB',
      showVersion: true,
      tagline: 'We build things'
    });
  });
});
