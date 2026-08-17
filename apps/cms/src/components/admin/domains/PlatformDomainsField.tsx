import type { UIFieldServerComponent } from 'payload';
import React from 'react';

import { DomainsPanel } from './DomainsPanel.client';

/**
 * The certificate side of the host cms's own custom domain.
 *
 * Same panel as `DomainsField`, pointed at the platform-settings endpoints
 * instead of the tenant ones.
 */
const PlatformDomainsField: UIFieldServerComponent = ({ i18n }) => (
  <DomainsPanel language={i18n.language} subject="platform" />
);

export default PlatformDomainsField;
