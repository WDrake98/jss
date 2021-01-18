import chalk from 'chalk';
import { isExperienceEditorActive, resetExperienceEditorChromes } from '@sitecore-jss/sitecore-jss';

export const getPublicUrl = (): string => {
  let url = process.env.PUBLIC_URL;
  if (url === undefined) {
    console.warn(
      `${chalk.yellow.bold(
        'Warning:'
      )} An PUBLIC_URL environment variable is not defined. Falling back to http://localhost:3000.`
    );
    url = 'http://localhost:3000';
  } else {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`The PUBLIC_URL environment variable '${url}' is not a valid URL.`);
    }
  }
  // Ensure no trailing slash
  return url.toString().replace(/\/$/, '');
};

/**
 * Since Experience Editor does not support Fast Refresh:
 * 1. Subscribe on events provided by webpack.
 * 2. Reset experience editor chromes when build is finished
 * @param {Function} onBuildEnd custom logic to be executed after build is finished
 */
export const subscribeOnRebuildAppEvent = (onBuildEnd?: (payload: unknown) => void): void => {
  if (isExperienceEditorActive()) {
    const eventSource = new window.EventSource(`${getPublicUrl()}/_next/webpack-hmr`);

    window.addEventListener('beforeunload', () => eventSource.close());

    eventSource.onopen = () => console.log('[Experience Editor HMR Listener] Online');

    eventSource.onmessage = (event) => {
      if (event.data.indexOf('{') === -1) return; // heartbeat

      const payload = JSON.parse(event.data);

      console.debug(`[Experience Editor HMR Listener] Saw event: ${JSON.stringify(payload)}`);

      if (payload.action !== 'built') return;

      if (onBuildEnd) {
        return onBuildEnd(payload);
      }

      // Alternative is window.location.reload()
      setTimeout(() => {
        console.log(
          '[Experience Editor HMR Listener] Experience Editor does not support Fast Refresh, reloading chromes...'
        );
        resetExperienceEditorChromes();
      }, 500);
    };
  }
};
