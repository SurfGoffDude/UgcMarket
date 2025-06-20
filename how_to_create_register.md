вместо pip uv

# Реализация аутентификации с DRF (JWT) и React + Redux

## 1. Создание и настройка Django-проекта с DRF и JWT

**Шаг 1: Установка зависимостей.** Создайте новый проект Django и установите необходимые пакеты. На июнь 2025 актуальны Django 5.x, Django REST Framework 3.16+ и SimpleJWT 5.5.0:

```bash
# Установка Django, DRF и SimpleJWT
pip install Django djangorestframework djangorestframework-simplejwt
```

Также убедитесь, что установлен пакет для отправки email (входит в Django) и, при необходимости, библиотека для криптографии (опционально для JWT). SimpleJWT можно установить с дополнительными криптографическими зависимостями командой:

```bash
pip install djangorestframework-simplejwt[crypto]
```

**Шаг 2: Инициализация проекта.** Создайте Django-проект и приложение, например `accounts` для управления пользователями:

```bash
django-admin startproject myproject
cd myproject
python manage.py startapp accounts
```

Добавьте в `settings.py` вашего проекта приложения и библиотеки:

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'accounts',  # наше приложение с пользователями
    # 'rest_framework_simplejwt' можно добавить при использовании переводов (опционально)
]
```

**Шаг 3: Настройка DRF и SimpleJWT в настройках.** В `settings.py` включите SimpleJWT в систему аутентификации DRF. Добавьте раздел REST\_FRAMEWORK с указанием классов аутентификации и, по желанию, разрешений по умолчанию:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',  # пока разрешаем доступ всем, настроим отдельно
    ),
}
```

Это подключит JWT-аутентификацию глобально для DRF. Кроме того, добавьте URL-роуты для получения и обновления токенов. В файле `myproject/urls.py` подключите стандартные представления SimpleJWT:

```python
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),       # получение access и refresh токенов
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),      # обновление access токена
    # другие пути...
]
```

Добавление этих маршрутов обеспечит эндпоинты `/api/token/` и `/api/token/refresh/` для входа и обновления токена соответственно.

**Шаг 4: Настройка модели пользователя.** Для простой реализации можно использовать стандартную модель пользователя Django. Однако, чтобы аутентифицироваться по email (и обеспечить уникальность email), мы создадим кастомную модель пользователя. Например, в `accounts/models.py`:

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True, blank=False)
    is_active = models.BooleanField(default=False)  # использовать как флаг подтверждения email

    USERNAME_FIELD = 'email'       # теперь для логина будет использоваться email
    REQUIRED_FIELDS = ['username'] # имя пользователя все еще требуется как поле, но можно генерировать автоматически
```

Здесь мы наследуем от `AbstractUser` и делаем поле email уникальным. Поле `is_active` будем использовать для контроля подтверждения email (по умолчанию Django использует `is_active` для разрешения логина пользователя). Мы устанавливаем его в `False` по умолчанию, чтобы запретить логин до подтверждения. Обязательно укажите `AUTH_USER_MODEL` в `settings.py` на новую модель:

```python
AUTH_USER_MODEL = 'accounts.User'
```

После этого выполните миграции:

```bash
python manage.py makemigrations
python manage.py migrate
```

> **Примечание:** Если не хотите создавать кастомную модель, можно использовать встроенную, но нужно будет либо запрашивать у пользователя `username` при регистрации, либо переопределить сериализатор получения токена, чтобы находить пользователя по email. В нашем руководстве мы используем email как основной идентификатор.

**Шаг 5: Настройка отправки email.** Для подтверждения регистрации по email необходимо настроить почтовый бэкенд. Во время разработки удобно использовать консольный бэкенд, чтобы письма выводились в терминал. В `settings.py` добавьте:

```python
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
```

Этот бэкенд просто печатает отправляемые письма в консоль (stdout), что подходит для тестирования. Убедитесь, что указаны `DEFAULT_FROM_EMAIL` (например, ваш адрес или имя проекта) и другие настройки почты, если вы планируете реальную отправку. Например, для SMTP Gmail можно указать:

```python
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'youraccount@gmail.com'
EMAIL_HOST_PASSWORD = 'password or app-specific password'
EMAIL_USE_TLS = True
```

(Не забудьте включить \[пароль приложения Google или разрешить менее безопасные приложения, если нужно].)

## 2. Реализация регистрации пользователя с подтверждением email (Backend)

**Шаг 6: Сериализатор регистрации.** В приложении `accounts` создайте `serializers.py`. Используем `ModelSerializer` для нашего кастомного пользователя. Добавим проверку пароля и создание пользователя. Например:

```python
# accounts/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2']

    def validate(self, data):
        # Проверка совпадения паролей
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        # Удаляем поле подтверждения и создаем пользователя
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.is_active = False  # новый пользователь не активен (не подтвержден)
        user.set_password(password)
        user.save()
        return user
```

Здесь мы ожидаем `email`, `username` и два поля пароля (для верификации). При сохранении устанавливаем `is_active=False` и хэшируем пароль.

**Шаг 7: Представление регистрации.** Теперь опишем API-вью для регистрации, которое будет создавать пользователя и отправлять письмо с подтверждением. В `accounts/views.py`:

```python
from rest_framework import generics, status, response
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from .serializers import RegistrationSerializer
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = []  # любой может вызывать регистрацию (AllowAny)

    def perform_create(self, serializer):
        user = serializer.save()
        # После создания пользователя отправляем email с подтверждением
        self.send_confirmation_email(user)

    def send_confirmation_email(self, user):
        token = RefreshToken.for_user(user).access_token  # генерируем JWT-токен для email
        current_site = get_current_site(self.request).domain
        relative_link = reverse('email-verify')  # URL на нашу view подтверждения
        confirm_url = f"http://{current_site}{relative_link}?token={token}"
        email_subject = "Verify your email"
        email_body = (
            f"Hi {user.username},\n"
            f"Please use the link below to verify your email address:\n{confirm_url}\n"
        )
        send_mail(
            email_subject, email_body, settings.DEFAULT_FROM_EMAIL, [user.email],
            fail_silently=False
        )
```

Здесь мы используем `RefreshToken.for_user(user).access_token` для создания JWT токена, который кодирует информацию о пользователе. Мы прикрепляем этот токен к ссылке, указывая URL подтверждения (например, `email-verify`). Затем отправляем письмо с этой ссылкой на почту пользователя.

Обратите внимание: `get_current_site` требует добавления сайта в базу (по умолчанию SITE\_ID=1). Для простоты можно собрать домен и порт из запроса: `domain = self.request.get_host()`.

**Почему RefreshToken и access\_token?** Мы генерируем JWT, содержащий идентификатор пользователя, с коротким сроком действия (по умолчанию \~5 минут). Этого достаточно, чтобы пользователь успел перейти по ссылке. Можно настроить срок действия токена подтверждения отдельно, установив настройки SimpleJWT, например `ACCESS_TOKEN_LIFETIME` для таких случаев, либо использовать другой механизм (например, подписанные ссылки). В данном примере для простоты берем access-токен.

**Шаг 8: Эндпоинт подтверждения email.** Создадим представление, которое будет проверять токен из ссылки и активировать аккаунт. В `accounts/views.py` добавим:

```python
import jwt
from rest_framework.views import APIView
from django.conf import settings

class VerifyEmail(APIView):
    permission_classes = []  # доступ открыт

    def get(self, request):
        token = request.GET.get('token')
        try:
            # Декодируем токен. Проверяем подпись и не истек ли токен.
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return response.Response({'error': 'Activation link expired'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.DecodeError:
            return response.Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        # Если декодирование прошло, активируем пользователя
        user_id = payload.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return response.Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        if not user.is_active:
            user.is_active = True
            user.save()
        return response.Response({'message': 'Email successfully verified'}, status=status.HTTP_200_OK)
```

Здесь мы используем `jwt.decode` с нашим `SECRET_KEY` и алгоритмом HS256 для проверки токена. Если токен истек или некорректен, возвращаем ошибку. Если валиден, получаем `user_id` из payload (по умолчанию SimpleJWT ставит `user_id` в payload, либо `user_id`/`user_pk` – это настраивается через `USER_ID_FIELD`/`USER_ID_CLAIM` в настройках, по умолчанию `user_id`). Затем помечаем пользователя как активного (`is_active=True`).

**Шаг 9: Маршруты для регистрации и подтверждения.** Добавьте новые URL в `accounts/urls.py`:

```python
from django.urls import path
from .views import RegisterView, VerifyEmail

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-email/', VerifyEmail.as_view(), name='email-verify'),
]
```

И подключите их в корневом `myproject/urls.py`:

```python
urlpatterns = [
    path('api/auth/', include('accounts.urls')), 
    ...
]
```

Теперь backend-часть регистрации готова. Пользователь делает POST-запрос на `/api/auth/register/` с полями email, username, password и password2. В ответ (если все OK) получит 201 и, возможно, сообщение о успешной регистрации. На почту (в нашем случае – консоль) отправляется ссылка вида: `http://<домен>/api/auth/verify-email/?token=<JWT>`. При переходе по этой ссылке (GET-запрос) аккаунт активируется.

> **Отладка:** Если вы используете `console.EmailBackend`, проверьте вывод консоли после регистрации – там будет содержимое письма и ссылка подтверждения. Убедитесь, что ссылка правильная. В режиме отладки Django не отправляет реальные письма, поэтому для теста в браузере можно скопировать ссылку из консоли и открыть её. Если вы используете SMTP, проверьте настройки, например, `DEBUG=True` может мешать отправке (в некоторых случаях).

Также убедитесь, что `SITE_ID` настроен, если используете `get_current_site`. В противном случае можно сформировать URL вручную на основе `request.get_host()`.

## 3. Реализация входа (JWT) и обновления токена (Backend)

Для входа пользователя и выдачи JWT-токенов мы будем использовать встроенные представления SimpleJWT, которые мы уже подключили (TokenObtainPairView). По умолчанию `/api/token/` ожидает `username` и `password` и возвращает пару токенов:

```json
{
  "access": "<ACCESS_TOKEN>",
  "refresh": "<REFRESH_TOKEN>"
}
```

Если вы применили кастомную модель пользователя с `USERNAME_FIELD = 'email'`, то **в поле `username` следует передавать email.** SimpleJWT автоматически будет искать пользователя по полю, определенному как `USERNAME_FIELD`. Таким образом, для входа пользователь отправляет JSON: `{"username": "user@example.com", "password": "пароль"}` на `/api/token/`, и при успешной авторизации получит токены.

> **Примечание:** Если вы не меняли модель пользователя, но хотите логин по email, можно создать кастомный сериализатор/представление для входа. Однако в рамках этого руководства, полагаясь на кастомную модель, это не требуется.

Эндпоинт `/api/token/refresh/` ожидает POST с `{"refresh": "<REFRESH_TOKEN>"}` и возвращает новый access-токен, если refresh-токен валиден и не отозван.

**Защита эндпоинтов.** Убедитесь, что для приватных API-эндпоинтов установлены соответствующие права доступа. Например, для любого view, требующего аутентификации, укажите `permission_classes = [IsAuthenticated]`. Поскольку мы глобально включили JWTAuthentication, DRF будет проверять заголовок Authorization. При отсутствии токена или при его невалидности вернется 401 Unauthorized.

**Ограничение входа неподтвержденных пользователей.** По умолчанию `TokenObtainPairView` позволит получить токен при правильных учетных данных, даже если `is_active=False`. Чтобы предотвратить вход до подтверждения email, можно переопределить поведение: либо создавая свой класс, либо использовать сигнал `user_login_failed`. Проще всего – заменить `TokenObtainPairView` на кастомный:

```python
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        if not user.is_active:
            raise serializers.ValidationError("Email is not verified")
        return super().get_token(user)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
```

Затем использовать `MyTokenObtainPairView` в urls вместо стандартного. Этот класс проверяет `user.is_active` перед выдачей токена.

На этом серверная часть готова: у нас есть регистрация с email-подтверждением, вход с JWT и обновление токена. Теперь перейдем к клиентской части.

## 4. Настройка React-проекта и Redux

**Шаг 10: Инициализация React-приложения.** Создайте новое приложение React. Можно использовать Create React App или Vite. Например, с помощью Vite:

```bash
# Установка менеджера Vite и создание приложения
npm create vite@latest myapp -- --template react
cd myapp
npm install
```

Либо:

```bash
npx create-react-app myapp
cd myapp
```

**Шаг 11: Установка зависимостей.** Установите Redux Toolkit, React-Redux и Axios (для HTTP-запросов):

```bash
npm install @reduxjs/toolkit react-redux axios
```

Также установите React Router для маршрутизации, если он не установлен:

```bash
npm install react-router-dom
```

На июнь 2025 г. актуальны React 18, React Router 6.14+, Redux Toolkit \~2.8, Redux 5.0.

**Шаг 12: Конфигурация Redux-хранилища.** В папке `src` создайте файл `store.js` (или `app/store.js`) и настроите Redux store:

```javascript
// src/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // можно добавить другие редьюсеры
  },
})
```

Оборачиваем наше приложение в `Provider` (обычно в `src/main.jsx` или `src/index.js`):

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

**Шаг 13: Создание среза (slice) auth для управления состоянием авторизации.** В `src/slices/authSlice.js`:

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../utils/apiClient';  // настроим apiClient чуть позже

// Инициализация состояния из localStorage (чтобы сохранять сессии между перезагрузками)
const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');

const initialState = {
  accessToken: accessToken || null,
  refreshToken: refreshToken || null,
  user: null,            // можно хранить информацию о пользователе
  loading: false,
  error: null,
};

// Async thunk для логина
export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await axios.post('/auth/token/', {
      username: email,    // SimpleJWT ожидает поле username
      password: password,
    });
    // response.data содержит { access, refresh }
    localStorage.setItem('accessToken', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
    return response.data;
  } catch (err) {
    // обработка ошибок
    return rejectWithValue(err.response?.data || 'Network error');
  }
});

// Async thunk для регистрации
export const register = createAsyncThunk('auth/register', async ({ email, username, password }, { rejectWithValue }) => {
  try {
    await axios.post('/auth/register/', { email, username, password, password2: password });
    // Если успешно – возвращаем, например, сообщение
    return 'Registration successful';
  } catch (err) {
    return rejectWithValue(err.response?.data || 'Network error');
  }
});

// Async thunk для обновления токена
export const refreshToken = createAsyncThunk('auth/refresh', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState().auth;
    const response = await axios.post('/auth/token/refresh/', {
      refresh: state.refreshToken,
    });
    localStorage.setItem('accessToken', response.data.access);
    return response.data.access;
  } catch (err) {
    // Если refresh невалиден (например, истек), можно разлогинить
    return rejectWithValue('Failed to refresh token');
  }
});

// Срез
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  },
  extraReducers: builder => {
    builder
      // login
      .addCase(login.pending, state => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      })
      // register
      .addCase(register.pending, state => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // регистрация успешна, пользователь должен подтвердить email
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })
      // refresh
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.accessToken = null;
        state.refreshToken = null;
        // При неудаче можно сразу разлогинить пользователя
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

В этом срезе определены асинхронные действия: `login`, `register`, `refreshToken`. Они выполняют запросы к API. При успешном логине сохраняем токены в `localStorage` и state. При регистрации – никакие токены не получаем (только сообщение), поэтому последующие шаги – ждать подтверждения email. При обновлении токена – сохраняем новый access токен.

Reducer `logout` очищает все, включая LocalStorage.

**Шаг 14: Настройка Axios с интерсепторами.** Для удобства создадим отдельный модуль для HTTP-клиента. Например, `src/utils/apiClient.js`:

```javascript
import axios from 'axios';
import { store } from '../store';
import { logout, refreshToken } from '../slices/authSlice';

// Создаем экземпляр Axios с базовым URL нашего API
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/',  // адрес вашего API
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор запроса: добавляем заголовок Authorization, если есть токен
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;  // добавляем Bearer-токен
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Интерсептор ответа: отлавливаем 401 и пытаемся обновить токен
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response ? error.response.status : null;
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Пытаемся обновить токен
        await store.dispatch(refreshToken());  // вызов thunk, который обновит токен
        const newToken = store.getState().auth.accessToken;
        if (newToken) {
          // Обновляем заголовок и повторяем оригинальный запрос
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (err) {
        // Обновление не удалось - выполняем логаут
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

Объяснение: мы настроили axios так, чтобы автоматически подставлять `Authorization: Bearer ...` во все исходящие запросы. Если получаем ответ 401 (неавторизован), интерсептор пытается один раз (`_retry` флаг) вызвать action `refreshToken` (который сделает запрос `/api/token/refresh/`), обновит стор и localStorage, после чего подставляет новый токен в исходный запрос и повторяет его. Если обновление не удалось (например, refresh токен истек), мы вызываем `logout()` – очищаем состояние и, возможно, перенаправим пользователя на страницу входа (это можно сделать в компоненте).

> **Примечание:** Мы используем `store.getState()` прямо внутри interceptors. Это возможно, так как мы импортировали store. Нужно убедиться, что `store` импортируется **до** его использования (в данном примере, порядок должен быть правильным, т.к. мы экспортируем store из отдельного файла, и в нем authSlice уже определён).
>
> Альтернативный подход – хранить токены в памяти (например, в apiClient модуле) и обновлять их через interceptors, но наш вариант с Redux достаточно наглядный.

**Шаг 15: Компоненты и маршруты React.** Теперь создадим компоненты для регистрации, входа и защищенной области. Это могут быть простые формы и страница Dashboard.

Пример компонента регистрации `RegisterPage.jsx`:

```jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../slices/authSlice';

function RegisterPage() {
  const dispatch = useDispatch();
  const loading = useSelector(state => state.auth.loading);
  const error = useSelector(state => state.auth.error);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(register({ email, username, password }));
  };

  return (
    <div>
      <h2>Register</h2>
      {error && <p style={{color: 'red'}}>{JSON.stringify(error)}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email}
               onChange={e => setEmail(e.target.value)} required />
        <input type="text" placeholder="Username" value={username}
               onChange={e => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
               onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      { !error && !loading && 
        <p>After registration, check your email for a confirmation link.</p>
      }
    </div>
  );
}

export default RegisterPage;
```

Пример компонента входа `LoginPage.jsx`:

```jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../slices/authSlice';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(state => state.auth.loading);
  const error = useSelector(state => state.auth.error);
  const isAuthenticated = useSelector(state => !!state.auth.accessToken);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(login({ email, password }));
    if (login.fulfilled.match(resultAction)) {
      // если логин успешен, перенаправляем, например, на Dashboard
      navigate('/dashboard');
    }
  };

  if (isAuthenticated) {
    // Если уже авторизованы, перенаправляем
    navigate('/dashboard');
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{color: 'red'}}>{JSON.stringify(error)}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email}
               onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
               onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
```

Пример защищенной страницы `Dashboard.jsx` (просто показывает, что доступ открыт):

```jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../slices/authSlice';

function Dashboard() {
  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(logout());
    // Можно еще сделать redirect на главную или страницу логина
  };

  return (
    <div>
      <h2>Welcome to Dashboard (Private)</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
```

**Шаг 16: Маршрутизация и защита маршрутов.** В `App.jsx` настроим маршруты. Используем React Router v6+:

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }) {
  const isAuth = useSelector(state => !!state.auth.accessToken);
  return isAuth ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Защищенный маршрут оборачиваем компонентом PrivateRoute */}
        <Route path="/dashboard" element={
          <PrivateRoute><Dashboard /></PrivateRoute>
        }/>
        {/* Можно добавить маршрут подтверждения email, если хотим отображать в UI */}
        <Route path="/confirm-email" element={<p>Please check your email for confirmation.</p>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

Компонент `PrivateRoute` читает из Redux, есть ли `auth.accessToken`. Если пользователя нет (не авторизован), происходит редирект на `/login`, иначе рендерятся дочерние компоненты (т.е. защищенная страница). Таким образом, `/dashboard` будет доступен только после успешного входа.

> Можно улучшить логику, например, дополнительно проверять не истек ли токен. Но наш axios-интерсептор уже умеет обновлять токен при экспирации, поэтому если `refreshToken` еще жив, пользователь может оставаться на защищенных маршрутах без разлогина.

## 5. Проверка работоспособности и отладка

**Регистрация и подтверждение:** Запустите Django-сервер (`python manage.py runserver`) и React-приложение (`npm start` или `npm run dev`). Попробуйте зарегистрироваться через форму. В консоли Django вы увидите email с ссылкой. Перейдите по этой ссылке в браузере. Должно вернуться сообщение об успешной активации (мы вернули JSON, но можно настроить редирект на красивую страницу). Теперь попробуйте войти под тем же email и паролем – должно получиться, и вы перейдете на Dashboard.

**Проверка refresh-токена:** По умолчанию access-токен SimpleJWT живет 5 минут, refresh – 1 день. Чтобы вручную проверить обновление, можно уменьшить время жизни токенов в настройках (например, `ACCESS_TOKEN_LIFETIME = timedelta(seconds=30)` для теста). Дождитесь истечения access-токена и попробуйте вызвать любой защищенный запрос (например, обновить Dashboard, если он загружает данные, или нажать какую-нибудь кнопку, которая делает запрос). Интерсептор axios должен перехватить 401, автоматически обратиться к `/api/token/refresh/` и, получив новый access-токен, повторно выполнить оригинальный запрос. Это произойдет незаметно для пользователя (если refresh токен актуален). В Redux вы увидите обновленный `state.auth.accessToken`.

**Logout:** Нажатие кнопки Logout вызовет action, который очистит токены из Redux и LocalStorage, effectively ending the session. Убедитесь, что после Logout защищенные маршруты перенаправляют на страницу логина.

**Отладка распространенных проблем:**

* Если запросы из React не доходят до сервера, проверьте правильность базового URL. В `apiClient.js` используйте правильный адрес (например, `/api/` без хоста, если React и Django работают на одном домене/порте через proxy, или полный адрес включая порт backend).

* Если при регистрации возникают ошибки валидации (например, email уже существует или пароль слишком простой), убедитесь, что обрабатываете их в компоненте (в нашем примере мы выводим `error` из state).

* Если письмо не отправляется при регистрации (в продакшене), проверьте настройки SMTP. В debug-режиме используйте console backend или file backend для уверенности.

* Если при подтверждении email получаете ошибки декодирования токена: убедитесь, что URL фронтенда/бекенда совпадают. В нашем случае ссылка формируется на домен backend (`current_site`). Если React-приложение на другом порте, вы можете сделать подтверждение через React: например, отправлять пользователю ссылку на фронтенд (`http://frontend-app/confirm-email?token=...`), а React при монтировании страницы подтверждения сам дернет `/api/auth/verify-email/?token=...`. Такой подход улучшит UX (например, покажете красивое сообщение в интерфейсе). Для простоты мы обрабатывали подтверждение напрямую на бэкенде.

* **Безопасность:** Хранение JWT в `localStorage` упрощает реализацию, но делает приложение уязвимым к XSS-атакам – злоумышленник, внедривший скрипт на страницу, может похитить токены. В реальных приложениях рекомендуется хранить хотя бы refresh-токен в httpOnly cookie (доступна только серверу). Кроме того, стоит настроить механизмы отзыва (blacklist) токенов при логауте или компрометации. SimpleJWT предлагает опциональное приложение blacklist для этого. В нашем руководстве, исходя из условий, мы используем LocalStorage, но помните об этих аспектах.

* **Отзыв refresh токена:** В текущей реализации при логауте мы просто удаляем токены на клиенте. Backend по-прежнему будет принимать refresh токен до истечения срока. Чтобы сделать полный logout, можно либо уменьшить время жизни refresh токена (тем самым сессия будет короткой), либо воспользоваться `TokenBlacklist` (нужно включить `rest_framework_simplejwt.token_blacklist` в INSTALLED\_APPS и настроить `BLACKLIST_AFTER_ROTATION=True`, тогда можно вызывать `/api/token/blacklist/` для явного отзыва). Это вне рамок нашего примера, но стоит знать.

Если все настроено правильно, у вас получится следующее: пользователь регистрируется -> подтверждает email -> логинится -> получает доступ к защищенным разделам; токены автоматически обновляются в фоне, пока есть refresh-токен; пользователь может выйти, и частные маршруты снова будут защищены.

**Документация и ссылки:**

* Официальная документация **Django REST Framework SimpleJWT** – как настроить и использовать JWT аутентификацию.
* Статья Noel Ethan Chiwamba: *"How to Develop an Email-Verification API using Django Rest Framework"* – пример реализации регистрации с email-подтверждением с использованием JWT.
* Примеры настройки Axios интерсепторов для обновления токена (Ayon Karmakar, *DEV*, 2024) – использование `axios.interceptors` на запросы и ответы для автоматического прикрепления токена и попытки refresh при 401.
