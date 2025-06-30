import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ApiProvider } from './contexts/ApiContext'
import { store } from './store'
import { BrowserRouter } from 'react-router-dom'
import { checkReactDevTools } from './utils/devtools'

// Проверяем наличие React DevTools и выводим подсказки
checkReactDevTools();


const rootElement = document.getElementById('root');

if (!rootElement) {

} else {

  const root = createRoot(rootElement);
  root.render(
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <ApiProvider>
            <App />
          </ApiProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
}
