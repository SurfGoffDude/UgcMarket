/**
 * API-клиент для работы с файловым хранилищем
 * 
 * Предоставляет методы для загрузки, получения и управления файлами через
 * RESTful API бэкенда.
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Базовый URL для API запросов к хранилищу
const API_BASE_URL = '/api/v1/storage';

/**
 * Интерфейсы для типизации данных файлов
 */
export interface FileMetadata {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  is_image: boolean;
  width?: number;
  height?: number;
  created_at: string;
  url: string;
  thumbnail_url?: string;
}

export interface TemporaryFileMetadata {
  id: number;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
  url: string;
}

export interface FileUploadResponse {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  is_image: boolean;
  width?: number;
  height?: number;
  created_at: string;
  url: string;
  thumbnail_url?: string;
}

export interface BulkDeleteRequest {
  file_ids: number[];
}

export interface BulkDeleteResponse {
  message: string;
  deleted_count: number;
}

export interface FileConfirmRequest {
  file_ids: number[];
}

export interface FilesFilterParams {
  file_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * API-клиент для работы с файлами
 */
export const storageApi = createApi({
  reducerPath: 'storageApi',
  tagTypes: ['Files', 'TempFiles'],
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers) => {
      // Получаем токен из localStorage
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  endpoints: (builder) => ({
    /**
     * Получение списка файлов с фильтрацией и пагинацией
     */
    getFiles: builder.query<{ results: FileMetadata[], count: number }, FilesFilterParams>({
      query: (params) => ({
        url: '/files/',
        params,
      }),
      providesTags: (result) => 
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Files' as const, id })),
              { type: 'Files', id: 'LIST' },
            ]
          : [{ type: 'Files', id: 'LIST' }],
    }),

    /**
     * Загрузка одного файла
     */
    uploadFile: builder.mutation<FileUploadResponse, FormData>({
      query: (fileData) => ({
        url: '/files/',
        method: 'POST',
        body: fileData,
        // Отключаем автоматический парсинг JSON для FormData
        formData: true,
      }),
      invalidatesTags: [{ type: 'Files', id: 'LIST' }],
    }),

    /**
     * Удаление файла
     */
    deleteFile: builder.mutation<void, number>({
      query: (id) => ({
        url: `/files/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Files', id },
        { type: 'Files', id: 'LIST' }
      ],
    }),

    /**
     * Множественное удаление файлов
     */
    bulkDeleteFiles: builder.mutation<BulkDeleteResponse, BulkDeleteRequest>({
      query: (data) => ({
        url: '/files/bulk_delete/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Files', id: 'LIST' }],
    }),

    /**
     * Загрузка временного файла
     */
    uploadTemporaryFile: builder.mutation<TemporaryFileMetadata, FormData>({
      query: (fileData) => ({
        url: '/temp-files/',
        method: 'POST',
        body: fileData,
        formData: true,
      }),
      invalidatesTags: [{ type: 'TempFiles', id: 'LIST' }],
    }),

    /**
     * Подтверждение временных файлов и перенос их в постоянное хранилище
     */
    confirmTemporaryFiles: builder.mutation<FileMetadata[], FileConfirmRequest>({
      query: (data) => ({
        url: '/temp-files/confirm/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result) => [
        { type: 'TempFiles', id: 'LIST' },
        { type: 'Files', id: 'LIST' }
      ],
    }),

    /**
     * Получение подписанного URL для доступа к файлу с ограничением по времени
     */
    getSignedUrl: builder.query<{ signed_url: string }, { fileId: number; expiresIn?: number }>({
      query: ({ fileId, expiresIn }) => ({
        url: `/files/${fileId}/signed-url/`,
        params: { expires_in: expiresIn },
      }),
    }),
  }),
});

/**
 * Экспорт хуков для взаимодействия с API
 */
export const {
  useGetFilesQuery,
  useUploadFileMutation,
  useDeleteFileMutation,
  useBulkDeleteFilesMutation,
  useUploadTemporaryFileMutation,
  useConfirmTemporaryFilesMutation,
  useLazyGetSignedUrlQuery,
} = storageApi;
