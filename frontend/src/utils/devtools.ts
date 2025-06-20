/**
 * Утилиты для работы с React DevTools в режиме разработки
 */

/**
 * Проверяет наличие установленного расширения React DevTools
 * и выводит рекомендации по установке, если оно отсутствует
 */
export const checkReactDevTools = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const isReactDevToolsInstalled = 
      typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
    
    if (!isReactDevToolsInstalled) {
      console.info(
        '%cДля улучшения процесса разработки рекомендуется установить React DevTools:\n' + 
        'Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi\n' +
        'Firefox: https://addons.mozilla.org/ru/firefox/addon/react-devtools/\n' +
        'Edge: https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil\n' +
        'Дополнительная информация: https://react.dev/learn/react-developer-tools',
        'font-weight: bold; font-size: 12px; color: #61dafb; background-color: #282c34; padding: 8px;'
      );
    } else {
      console.info(
        '%cReact DevTools успешно обнаружен! Для полноценной отладки используйте вкладку "Components" в инструментах разработчика.',
        'font-weight: bold; font-size: 12px; color: #4caf50;'
      );
    }
  }
};

// Декларация типа для глобального хука React DevTools
declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
  }
}