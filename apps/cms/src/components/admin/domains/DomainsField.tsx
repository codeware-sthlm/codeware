import type { UIFieldServerComponent } from 'payload';
import React from 'react';

import { DomainsPanel } from './DomainsPanel.client';

/**
 * The certificate side of a workspace's custom domains.
 *
 * Server component only to pass the admin language down — everything it shows
 * is already on the form, so there is nothing to fetch and nothing to wait for.
 */
const DomainsField: UIFieldServerComponent = ({ i18n }) => (
  <DomainsPanel language={i18n.language} subject="tenant" />
);

export default DomainsField;
