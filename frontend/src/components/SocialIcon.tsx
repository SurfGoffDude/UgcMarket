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
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={className}
        >
          <circle fill="#29b6f6" cx="12" cy="12" r="12"/>
          <path fill="#fff" d="M9.8,17.5l0.4-5.6l7.8-7.1c0.3-0.3,0.1-0.4-0.3-0.2L7.5,11.1L2.1,9.7C1.4,9.5,1.4,9,2.3,8.6l17-6.5 c0.7-0.3,1.5,0.2,1.2,1.3l-2.9,13.8c-0.2,0.9-0.8,1.2-1.5,0.7l-4.3-3.2l-2.1,2C9.5,16.9,9.3,17.5,9.8,17.5z"/>
          <path fill="#b0bec5" d="M9.8,16.1l0.2-0.4l1-0.9c0,0,0.2-3.7,0.4-5.6c0.1-1.2,0.6-1.4,0.6-1.4l-3.4,2.1 c0,0-0.2,1.9-0.4,4.4C8.3,15.9,9.5,15.7,9.8,16.1z"/>
        </svg>
      );
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
