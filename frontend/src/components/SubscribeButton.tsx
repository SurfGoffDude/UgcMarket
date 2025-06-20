/**
 * Компонент кнопки подписки на креатора
 * 
 * Позволяет пользователям подписываться на обновления от креаторов.
 * В текущей реализации является UI-заготовкой без фактической интеграции с API.
 */
import React, { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';

interface SubscribeButtonProps {
  creatorId: number;
  creatorName: string;
  isSubscribed?: boolean;
}

/**
 * Компонент кнопки подписки на креатора
 * 
 * @param {SubscribeButtonProps} props - Свойства компонента
 * @param {number} props.creatorId - ID креатора
 * @param {string} props.creatorName - Имя креатора
 * @param {boolean} [props.isSubscribed] - Статус подписки (подписан/не подписан)
 * @returns {JSX.Element} Компонент кнопки подписки
 */
const SubscribeButton: React.FC<SubscribeButtonProps> = ({ 
  creatorId, 
  creatorName, 
  isSubscribed: initialIsSubscribed = false
}) => {
  // Локальное состояние подписки (для демонстрации функционала в UI)
  const [isSubscribed, setIsSubscribed] = useState<boolean>(initialIsSubscribed);
  
  // Настройки подписки
  const [notificationType, setNotificationType] = useState<string>("all");
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  
  // Обработчик подписки/отписки
  const handleSubscribeToggle = () => {
    // В реальном приложении здесь будет вызов API для подписки/отписки
    const newSubscriptionState = !isSubscribed;
    setIsSubscribed(newSubscriptionState);
    
    toast({
      title: newSubscriptionState 
        ? `Вы подписались на ${creatorName}` 
        : `Вы отписались от ${creatorName}`,
      description: newSubscriptionState 
        ? "Вы будете получать уведомления о новых работах и предложениях." 
        : "Вы больше не будете получать уведомления от этого креатора.",
    });
  };
  
  // Обработчик сохранения настроек подписки
  const handleSaveSettings = () => {
    // В реальном приложении здесь будет вызов API для сохранения настроек
    toast({
      title: "Настройки подписки сохранены",
      description: `Ваши настройки для ${creatorName} были обновлены.`,
    });
  };

  return (
    <>
      {/* Кнопка подписки/отписки */}
      <Button
        variant={isSubscribed ? "default" : "outline"}
        size="sm"
        onClick={handleSubscribeToggle}
      >
        {isSubscribed ? (
          <>
            <BellOff className="mr-2 h-4 w-4" />
            Отписаться
          </>
        ) : (
          <>
            <Bell className="mr-2 h-4 w-4" />
            Подписаться
          </>
        )}
      </Button>
      
      {/* Диалог настройки подписки (отображается только если пользователь подписан) */}
      {isSubscribed && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-2">
              Настроить
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Настройки подписки</DialogTitle>
              <DialogDescription>
                Настройте параметры подписки на креатора {creatorName}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="notification-type">Тип уведомлений</Label>
                <Select 
                  value={notificationType}
                  onValueChange={setNotificationType}
                >
                  <SelectTrigger id="notification-type">
                    <SelectValue placeholder="Выберите тип уведомлений" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Тип уведомлений</SelectLabel>
                      <SelectItem value="all">Все обновления</SelectItem>
                      <SelectItem value="new-content">Новый контент</SelectItem>
                      <SelectItem value="promos">Акции и специальные предложения</SelectItem>
                      <SelectItem value="portfolio">Обновления портфолио</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="flex-1">
                  Email-уведомления
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="flex-1">
                  Push-уведомления
                </Label>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Отмена</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleSaveSettings}>Сохранить</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SubscribeButton;