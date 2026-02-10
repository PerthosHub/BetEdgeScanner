import { LogBericht, LogNiveau } from '../types';
import { ScannerLog, voegLogToe, logBroadcastEvent } from '../utils/storage';

const actieveMonitors = new Set<chrome.runtime.Port>();

const mapStorageTypeToNiveau = (type: ScannerLog['type']): LogNiveau => {
  switch (type) {
    case 'success':
      return 'SUCCESS';
    case 'warning':
      return 'WARNING';
    case 'error':
      return 'ERROR';
    default:
      return 'INFO';
  }
};

const mapNiveauToStorageType = (niveau: LogNiveau): 'info' | 'success' | 'warning' | 'error' => {
  switch (niveau) {
    case 'SUCCESS':
      return 'success';
    case 'WARNING':
      return 'warning';
    case 'ERROR':
      return 'error';
    default:
      return 'info';
  }
};

export const setupLogCentrum = () => {
  chrome.runtime.onConnect.addListener((poort) => {
    if (poort.name === 'monitor_stream') {
      console.log('Monitor verbonden');
      actieveMonitors.add(poort);

      poort.onDisconnect.addListener(() => {
        actieveMonitors.delete(poort);
        console.log('Monitor verbroken');
      });
    }
  });

  logBroadcastEvent.addEventListener('nieuw_log', (event: Event) => {
    const customEvent = event as CustomEvent<ScannerLog>;
    const log = customEvent.detail;

    const bericht: LogBericht = {
      id: log.id,
      tijdstempel: Date.now(),
      niveau: mapStorageTypeToNiveau(log.type),
      bron: {
        url: 'INTERNAL (BACKGROUND)',
      },
      actie: log.actie,
      bericht: log.omschrijving || '',
      meta: log.payload,
    };

    actieveMonitors.forEach((poort) => {
      try {
        poort.postMessage(bericht);
      } catch {
        actieveMonitors.delete(poort);
      }
    });
  });
};

export const verwerkLogBericht = async (bericht: LogBericht, sender: chrome.runtime.MessageSender) => {
  const verrijktBericht: LogBericht = {
    ...bericht,
    bron: {
      ...bericht.bron,
      tabId: sender.tab?.id,
    },
  };

  actieveMonitors.forEach((poort) => {
    try {
      poort.postMessage(verrijktBericht);
    } catch {
      actieveMonitors.delete(poort);
    }
  });

  if (['WARNING', 'ERROR', 'SUCCESS'].includes(bericht.niveau)) {
    await voegLogToe(
      'CONTENT (DOM)',
      bericht.actie,
      bericht.bericht,
      bericht.meta,
      mapNiveauToStorageType(bericht.niveau)
    );
  }
};
