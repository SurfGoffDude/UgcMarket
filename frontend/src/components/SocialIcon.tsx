import React from 'react';
import {
  Facebook,
  Youtube,
  Twitter,
  Instagram,
  MessageCircle,
  Music,
  Linkedin,
  Send,
  Pin,
  MessageSquare,
  Vibrate,
  RefreshCw,
  Video,
  ExternalLink
} from 'lucide-react';

/**
 * Компонент для отображения иконок социальных сетей
 * 
 * @param platform - название платформы
 * @param className - дополнительные стили для иконки
 * @returns компонент с иконкой соцсети
 */
interface SocialIconProps {
  platform: string;
  className?: string;
}

export const SocialIcon: React.FC<SocialIconProps> = ({ platform, className = "h-4 w-4" }) => {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return <Facebook className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    case 'twitter':
      return <Twitter className={className} />;
    case 'instagram':
      return <Instagram className={className} />;
    case 'whatsapp':
      return <MessageCircle className={className} />;
    case 'tiktok':
      return <Music className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    case 'telegram':
      return <Send className={className} />;
    case 'pinterest':
      return <Pin className={className} />;
    case 'reddit':
      return <MessageSquare className={className} />;
    case 'vkontakte':
      return <Vibrate className={className} />; // Используем похожую иконку для ВКонтакте
    case 'dzen':
      return <RefreshCw className={className} />; // Используем похожую иконку для Дзен
    case 'twitch':
      return <Video className={className} />;
    default:
      return <ExternalLink className={className} />; // Для неизвестных платформ
  }
};

export default SocialIcon;
