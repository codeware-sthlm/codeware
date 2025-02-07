import { CdwrCloud } from '@codeware/shared/ui/react-components';

const css = `
  html[data-theme="dark"] .cdwr-logo svg path {
    fill: white;
    color: white;
  }
  html[data-theme="light"] .cdwr-logo svg path {
    fill: black;
    color: black;
  }

  html[data-theme="dark"] .cdwr-logo-text {
    color: white;
  }
  html[data-theme="light"] .cdwr-logo-text {
    color: black;
  }

  .cdwr-logo-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .cdwr-logo-text {
    font-size: 1.3rem;
    opacity: 0.3;
    font-weight: 500;
    letter-spacing: 0.1rem;
  }
`;

export const CdwrAdminLogo = () => {
  return (
    <>
      <style type="text/css">{css}</style>
      <div className="cdwr-logo-container">
        <div className="cdwr-logo">
          <CdwrCloud width="100" height="100" />
        </div>
        <span className="cdwr-logo-text">Codeware CMS</span>
      </div>
    </>
  );
};
