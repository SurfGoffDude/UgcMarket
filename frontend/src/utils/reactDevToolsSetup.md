# Настройка React DevTools

В проект добавлены две возможности использования React DevTools:

## 1. Расширение для браузера (основной способ)

Расширение React DevTools доступно для установки в:
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/ru/firefox/addon/react-devtools/)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)

После установки расширения, при запуске приложения в режиме разработки, вы увидите сообщение в консоли о том, что React DevTools обнаружен.

## 2. Standalone-версия (автоматически добавлена в проект)

Если по каким-то причинам вы не можете установить расширение, можно использовать standalone-версию, которая уже настроена в проекте:

1. Установите standalone-версию React DevTools:
   ```bash
   npm install -g react-devtools
   ```

2. Запустите React DevTools в отдельном терминале:
   ```bash
   react-devtools
   ```

3. Запустите ваше приложение в режиме разработки.

Скрипт для подключения к standalone-версии уже добавлен в `index.html` и будет автоматически загружаться только в режиме разработки.

## Как проверить, что все работает

1. Запустите React DevTools (через расширение или standalone-версию).
2. Запустите приложение в режиме разработки.
3. Откройте инструменты разработчика в браузере (F12).
4. В Chrome, Firefox или Edge с установленным расширением вы увидите новую вкладку "Components".
5. Если используете standalone-версию, вы увидите отдельное окно с React DevTools.

## Примечание

Для standalone-версии React DevTools, приложение автоматически подключается к серверу devtools на `http://localhost:8097`, который запускается командой `react-devtools`.