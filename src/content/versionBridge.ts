import { VERSION_INFO } from '../version';

const BRIDGE_SOURCE_EXTENSION = 'betedge-scanner-extension';
const BRIDGE_SOURCE_APP = 'betedge-pro-app';
const BRIDGE_TYPE_VERSION = 'BETEDGE_SCANNER_VERSION';
const BRIDGE_TYPE_REQUEST = 'REQUEST_SCANNER_VERSION';

const postVersie = () => {
  window.postMessage(
    {
      source: BRIDGE_SOURCE_EXTENSION,
      type: BRIDGE_TYPE_VERSION,
      version: VERSION_INFO.version,
      label: VERSION_INFO.label,
      date: VERSION_INFO.date,
    },
    window.location.origin
  );
};

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data as { source?: string; type?: string } | undefined;
  if (data?.source !== BRIDGE_SOURCE_APP || data?.type !== BRIDGE_TYPE_REQUEST) return;
  postVersie();
});

postVersie();
