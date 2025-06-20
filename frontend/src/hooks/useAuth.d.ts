/**
 * Декларация типов для хука авторизации
 */
import type { AuthHook } from '../types/auth';

// Объявление функции useAuth
declare function useAuth(): AuthHook;

// Экспорт функции по умолчанию
export default useAuth;
