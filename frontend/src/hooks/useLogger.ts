/**
 * React хук для удобного использования системы логирования
 */

import { useCallback } from 'react';
import { logger, LogLevel, ErrorCode } from '../utils/logging/logger';

export const useLogger = (componentName: string) => {
  const logDebug = useCallback((message: string, extraData: Record<string, any> = {}) => {
    return logger.debug(componentName, message, extraData);
  }, [componentName]);

  const logInfo = useCallback((message: string, extraData: Record<string, any> = {}) => {
    return logger.info(componentName, message, extraData);
  }, [componentName]);

  const logWarning = useCallback((
    message: string, 
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    extraData: Record<string, any> = {}
  ) => {
    return logger.warning(componentName, message, errorCode, extraData);
  }, [componentName]);

  const logError = useCallback((
    message: string, 
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    extraData: Record<string, any> = {}
  ) => {
    return logger.error(componentName, message, errorCode, extraData);
  }, [componentName]);

  const logCritical = useCallback((
    message: string, 
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    extraData: Record<string, any> = {}
  ) => {
    return logger.critical(componentName, message, errorCode, extraData);
  }, [componentName]);

  const logUserAction = useCallback((
    action: string,
    success: boolean = true,
    extraData: Record<string, any> = {}
  ) => {
    return logger.logUserAction(action, componentName, success, extraData);
  }, [componentName]);

  const logApiCall = useCallback((
    endpoint: string,
    method: string,
    success: boolean,
    responseStatus?: number,
    extraData: Record<string, any> = {}
  ) => {
    return logger.logApiCall(endpoint, method, success, responseStatus, extraData);
  }, [componentName]);

  const logFormSubmission = useCallback((
    formName: string,
    success: boolean,
    validationErrors?: Record<string, string[]>,
    extraData: Record<string, any> = {}
  ) => {
    return logger.logFormSubmission(formName, success, validationErrors, extraData);
  }, [componentName]);

  return {
    logDebug,
    logInfo,
    logWarning,
    logError,
    logCritical,
    logUserAction,
    logApiCall,
    logFormSubmission
  };
};