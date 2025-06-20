/**
 * Страница отправки результата по заказу
 * 
 * Позволяет креатору загружать файлы и отправлять результаты работы клиенту
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { FileText, AlertCircle, Upload, XCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Order, UploadedFile } from '@/types';

/**
 * Основной компонент страницы отправки результата заказа
 */
const OrderDeliveryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState<string>('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Загрузка данных заказа
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await api.getOrder(Number(id));
        setOrder(orderData);
        
        // Проверяем, является ли пользователь креатором для этого заказа
        if (orderData.service.creator.user.id !== user?.id) {
          toast({
            title: "Доступ запрещен",
            description: "У вас нет прав для отправки результата по этому заказу",
            variant: "destructive",
          });
          navigate('/orders');
        }
        
        // Проверяем статус заказа
        if (orderData.status !== 'in_progress') {
          toast({
            title: "Недопустимая операция",
            description: "Отправка результата возможна только для заказов в статусе 'В работе'",
            variant: "destructive",
          });
          navigate(`/orders/${id}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Ошибка при загрузке заказа'));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id, isAuthenticated, navigate, toast, user]);

  // Обработчик нажатия на кнопку загрузки файлов
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Обработчик изменения выбранных файлов
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      const newFiles: UploadedFile[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        // Проверка размера файла (макс. 50MB для результатов работы)
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "Файл слишком большой",
            description: `${file.name} превышает максимальный размер 50MB`,
            variant: "destructive",
          });
          continue;
        }
        
        const uploadedFile = await api.uploadFile(file, 'delivery');
        // Проверяем наличие всех необходимых полей в ответе API
        const typedFile = uploadedFile as {id?: number; name?: string; file?: string; size?: number};
        
        if (typedFile && 
            typeof typedFile.id === 'number' && 
            typeof typedFile.name === 'string' && 
            typeof typedFile.file === 'string' && 
            typeof typedFile.size === 'number') {
          newFiles.push(typedFile as UploadedFile);
        } else {
          toast({
            title: "Ошибка загрузки",
            description: `Не удалось загрузить файл ${file.name}`,
            variant: "destructive",
          });
        }
      }
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Очищаем input, чтобы можно было загрузить тот же файл снова
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Удаление файла из списка загруженных
  const handleRemoveFile = (id: number) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Отправка результатов работы
  const handleSubmit = async () => {
    if (!order) return;
    if (files.length === 0) {
      toast({
        title: "Добавьте файлы",
        description: "Необходимо загрузить хотя бы один файл с результатом работы",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const deliveryData = {
        message: message.trim(),
        file_ids: files.map(file => file.id)
      };
      
      await api.addOrderDelivery(order.id, deliveryData);
      
      // Обновляем статус заказа до "delivered"
      await api.updateOrderStatus(order.id, 'delivered');
      
      toast({
        title: "Успешно отправлено",
        description: "Результат работы успешно отправлен заказчику",
        variant: "default",
      });
      
      // Переходим на страницу заказа
      navigate(`/orders/${order.id}`);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить результат работы",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmation(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded mb-8 w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-32 mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-6 text-center max-w-3xl mx-auto">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">
            {error ? 'Ошибка при загрузке заказа' : 'Заказ не найден'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'Не удалось найти запрашиваемый заказ'}
          </p>
          <Button onClick={() => navigate('/orders')}>
            Вернуться к заказам
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Отправка результата работы</h1>
          <p className="text-muted-foreground">Заказ #{order.id}: {order.service.title}</p>
        </div>
        
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4">Комментарий к отправке</h2>
          <Textarea
            placeholder="Напишите сопроводительное сообщение к результатам работы..."
            className="mb-4"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          
          <Separator className="my-6" />
          
          <h2 className="font-semibold mb-4">Загрузка файлов с результатами работы</h2>
          
          <div className="mb-4">
            <Button 
              type="button"
              onClick={handleFileButtonClick}
              disabled={uploading}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" /> 
              Выбрать файлы
            </Button>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="*/*"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Максимальный размер файла: 50MB. Поддерживаются любые форматы файлов.
            </p>
          </div>
          
          {uploading && (
            <div className="flex items-center text-muted-foreground text-sm mb-4">
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full" />
              Загрузка файлов...
            </div>
          )}
          
          {files.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Загружено файлов: {files.length}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center overflow-hidden">
                      <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} КБ
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFile(file.id)} 
                      className="text-muted-foreground hover:text-destructive"
                      title="Удалить файл"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            Отмена
          </Button>
          <Button 
            onClick={() => setShowConfirmation(true)}
            disabled={files.length === 0 || isSubmitting || uploading}
          >
            <CheckCircle className="h-4 w-4 mr-2" /> 
            Отправить результаты
          </Button>
        </div>
      </div>
      
      {/* Диалог подтверждения отправки */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отправить результаты работы?</AlertDialogTitle>
            <AlertDialogDescription>
              После отправки результатов статус заказа изменится на "Выполнен", 
              и заказчик сможет принять работу или запросить доработку.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Отправка...
                </>
              ) : (
                "Отправить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDeliveryPage;
