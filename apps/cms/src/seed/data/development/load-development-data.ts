/**
 * Seeded data for local development.
 *
 * Setup is the same as defined in Infisical, but it doesn't matter if there are
 * some differences. The purpose it to have a similar development setup with and
 * without Infisical.
 *
 * Here we have probaly more data to test different scenarios.
 */

import type { Seed, SeedData } from '../seed.types';

// TODO: Move to a shared app library to be available to web project
export const loadDevelopmentData: Seed = () => {
  return {
    articles: seedArticles,
    pages: seedPages,
    tenants: seedTenants,
    users: seedUsers
  };
};

const webOneTenant = 'Tenant WEB One';
const webTwoTenant = 'Tenant WEB Two';

const seedTenants: SeedData['tenants'] = [
  {
    name: webOneTenant,
    description: 'WEB application multi-tenant proxy (one)',
    hosts: ['web-one.localhost', 'admin.web-one.localhost'],
    apiKey: 'e6ce9cb9-773a-484b-a388-7ff31bab85a4'
  },
  {
    name: webTwoTenant,
    description: 'WEB application multi-tenant proxy (two)',
    hosts: ['web-two.localhost', 'admin.web-two.localhost'],
    apiKey: '716b25b5-37de-4410-abdf-acd18f864e63'
  }
];

const seedUsers: SeedData['users'] = [
  {
    name: 'System user',
    description: `Allowed to access and manage the whole system.
Doesn't belong to any tenants.`,
    email: 'system@local.dev',
    password: 'dev',
    role: 'system-user',
    tenants: []
  },
  {
    name: 'Tenant WEB One admin',
    description: `Allowed to access and manage ${webOneTenant}`,
    email: 'web-one.admin@local.dev',
    password: 'dev',
    role: 'user',
    tenants: [{ lookupName: webOneTenant, role: 'admin' }]
  },
  {
    name: 'Tenant WEB One user',
    description: `Has only access to ${webOneTenant}`,
    email: 'web-one.user@local.dev',
    password: 'dev',
    role: 'user',
    tenants: [{ lookupName: webOneTenant, role: 'user' }]
  },
  {
    name: 'Tenant WEB Two admin',
    description: `Allowed to access and manage ${webTwoTenant}`,
    email: 'web-two.admin@local.dev',
    password: 'dev',
    role: 'user',
    tenants: [{ lookupName: webTwoTenant, role: 'admin' }]
  },
  {
    name: 'Tenant WEB Two user',
    description: `Has only access to ${webTwoTenant}`,
    email: 'web-two.user@local.dev',
    password: 'dev',
    role: 'user',
    tenants: [{ lookupName: webTwoTenant, role: 'user' }]
  },
  {
    name: 'Multi tenant WEB admin',
    description: `Has access and can manage all WEB tenants`,
    email: 'web-multi.admin@local.dev',
    password: 'dev',
    role: 'user',
    tenants: [
      { lookupName: webOneTenant, role: 'admin' },
      { lookupName: webTwoTenant, role: 'admin' }
    ]
  },
  {
    name: 'Multi tenant WEB user',
    description: `Has access to all WEB tenants`,
    email: 'web-multi.user@local.dev',
    password: 'dev',
    role: 'user',
    tenants: [
      { lookupName: webOneTenant, role: 'user' },
      { lookupName: webTwoTenant, role: 'user' }
    ]
  }
];

const seedPages: SeedData['pages'] = [
  {
    title: 'Home',
    header: `Welcome to ${webOneTenant}`,
    slug: 'home',
    tenant: { lookupName: webOneTenant }
  },
  {
    title: 'About',
    header: `Contact the folks at ${webOneTenant}`,
    slug: 'about',
    tenant: { lookupName: webOneTenant }
  },
  {
    title: 'Home',
    header: `Welcome to ${webTwoTenant}`,
    slug: 'home',
    tenant: { lookupName: webTwoTenant }
  },
  {
    title: 'About',
    header: `Contact the folks at ${webTwoTenant}`,
    slug: 'about',
    tenant: { lookupName: webTwoTenant }
  }
];

const seedArticles: SeedData['articles'] = [
  {
    title: `Cobol for dummies and ${webOneTenant}`,
    slug: 'cobol-for-dummies-and-cms',
    author: 'Winnie the Pooh',
    tenant: { lookupName: webOneTenant }
  },
  {
    title: `Fortran77 for dummies and ${webOneTenant}`,
    slug: 'fortran77-for-dummies-and-web-one',
    author: 'Alice in Wonderland',
    tenant: { lookupName: webOneTenant }
  },
  {
    title: `Go to space with ${webTwoTenant}`,
    slug: 'go-to-space-with-web-two',
    author: 'Yoda',
    tenant: { lookupName: webTwoTenant }
  },
  {
    title: `Bake a cake with ${webTwoTenant}`,
    slug: 'bake-a-cake-with-web-two',
    author: 'Winnie the Pooh',
    tenant: { lookupName: webTwoTenant }
  }
];
