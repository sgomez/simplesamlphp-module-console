import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { consoleBase } from './app/http/client';
import { ConsoleRoutes } from './app/ConsoleRoutes';

const mount = document.createElement('div');
document.body.append(mount);

createRoot(mount).render(
  <StrictMode>
    <BrowserRouter basename={consoleBase(window.location.pathname)}>
      <ConsoleRoutes />
    </BrowserRouter>
  </StrictMode>,
);
