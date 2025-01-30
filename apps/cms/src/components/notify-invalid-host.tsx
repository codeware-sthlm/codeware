import { Card } from 'payload/components/elements';
import React from 'react';

/**
 * This component is used to notify the user that they are not authorized to access the current host.
 *
 * It should be used with `beforeLogin` component to be displayed above the login credentials form.
 */
const NotifyInvalidHost: React.FC = () => {
  const { search } = window.location;

  if (search.includes('invalid-host')) {
    return (
      <div style={{ paddingBottom: 'calc(var(--base)*2)' }}>
        <Card
          title="You are not authorized to access this host"
          actions={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <span>Navigate to the workspace where you are a member.</span>
              <span style={{ paddingTop: 'var(--base)' }}>
                Please contact your administrator for assistance.
              </span>
            </div>
          }
        />
      </div>
    );
  }

  return null;
};

export default NotifyInvalidHost;
