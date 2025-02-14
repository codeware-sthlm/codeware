import React, { Suspense } from 'react';
import { headers } from 'next/headers';
import { getPayload } from 'payload';

import config from '../../payload.config';
import Logo from './components/Logo';
import styles from './page.module.css';

export default async function HomePage() {
  const headersList = await headers();
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: headersList });

  const heroTitle = user
    ? ['Welcome back!']
    : ['Welcome to your', 'Payload application.'];

  return (
    <div className={styles.container}>
      <div className={styles.heroBox}>
        <Suspense fallback={<div className={styles.logo} />}>
          <Logo />
        </Suspense>

        <h1 className={styles.title}>
          {heroTitle.map((text, index) => (
            <div key={index}>{text}</div>
          ))}
        </h1>
        {user && <h3 className={styles.subtitle}>{user.email}</h3>}
      </div>

      <div className={styles.links}>
        <a
          className={styles.adminLink}
          href={payloadConfig.routes.admin}
          rel="noopener noreferrer"
          target="_blank"
        >
          Open Admin Panel
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.icon}
          >
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
