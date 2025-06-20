import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Paperclip, 
  Send, 
  Image as ImageIcon, 
  File, 
  Check, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Download,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

// Types
type Message = {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file' | 'status';
  fileInfo?: {
    name: string;
    size: string;
    type: string;
    url: string;
  };
};

type User = {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
};

type Order = {
  id: string;
  title: string;
  status: 'in_progress' | 'review' | 'completed' | 'disputed';
  deadline: string;
  price: number;
};

// Mock data
const currentUser: User = {
  id: 'user1',
  name: 'Алексей Иванов',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  isOnline: true
};

const otherUser: User = {
  id: 'user2',
  name: 'Мария Видеографова',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
  isOnline: true
};

const orderDetails: Order = {
  id: 'ORD-12345',
  title: 'Монтаж видео о путешествии на Бали',
  status: 'in_progress',
  deadline: '2023-12-15',
  price: 15000
};

const initialMessages: Message[] = [
  {
    id: '1',
    senderId: 'system',
    content: 'Вы начали обсуждение по заказу #ORD-12345',
    timestamp: new Date('2023-12-01T10:00:00'),
    status: 'read',
    type: 'status'
  },
  {
    id: '2',
    senderId: 'user1',
    content: 'Здравствуйте! Спасибо за отклик на мой заказ. Можете рассказать подробнее о вашем опыте работы с travel-контентом?',
    timestamp: new Date('2023-12-01T10:05:00'),
    status: 'read',
    type: 'text'
  },
  {
    id: '3',
    senderId: 'user2',
    content: 'Добрый день! Конечно, у меня более 3 лет опыта монтажа travel-видео. Вот пример моей работы:',
    timestamp: new Date('2023-12-01T10:10:00'),
    status: 'read',
    type: 'text'
  },
  {
    id: '4',
    senderId: 'user2',
    content: 'https://example.com/video-preview.mp4',
    timestamp: new Date('2023-12-01T10:10:30'),
    status: 'read',
    type: 'video',
    fileInfo: {
      name: 'travel-video-preview.mp4',
      size: '24.5 MB',
      type: 'video/mp4',
      url: 'https://example.com/video-preview.mp4'
    }
  },
  {
    id: '5',
    senderId: 'user1',
    content: 'Отлично выглядит! Я бы хотел обсудить детали задания. Вот мой бриф:',
    timestamp: new Date('2023-12-01T10:15:00'),
    status: 'read',
    type: 'text'
  },
  {
    id: '6',
    senderId: 'user1',
    content: 'brief.pdf',
    timestamp: new Date('2023-12-01T10:15:30'),
    status: 'read',
    type: 'file',
    fileInfo: {
      name: 'Бриф на монтаж.pdf',
      size: '2.1 MB',
      type: 'application/pdf',
      url: 'https://example.com/brief.pdf'
    }
  }
];

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [order, setOrder] = useState<Order>(orderDetails);
  const [otherUserData] = useState<User>(otherUser);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || isTyping) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: newMessage,
      timestamp: new Date(),
      status: 'sent',
      type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 'text',
      fileInfo: selectedFile ? {
        name: selectedFile.name,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile)
      } : undefined
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');
    setSelectedFile(null);

    // Simulate typing and response
    if (Math.random() > 0.5) {
      setIsTyping(true);
      setTimeout(() => {
        const responseMsg: Message = {
          id: (Date.now() + 1).toString(),
          senderId: otherUserData.id,
          content: 'Спасибо за сообщение! Я рассмотрю ваш запрос и отвечу в ближайшее время.',
          timestamp: new Date(),
          status: 'delivered',
          type: 'text'
        };
        setMessages(prev => [...prev, responseMsg]);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    // Reset the input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
  };

  const handleStatusUpdate = (newStatus: Order['status']) => {
    setOrder(prev => ({
      ...prev,
      status: newStatus
    }));
    
    // Add status update message
    const statusMessage: Message = {
      id: `status-${Date.now()}`,
      senderId: 'system',
      content: `Статус заказа изменен на: ${getStatusText(newStatus)}`,
      timestamp: new Date(),
      status: 'read',
      type: 'status'
    };
    
    setMessages(prev => [...prev, statusMessage]);
    toast({
      title: "Статус обновлен",
      description: `Статус заказа изменен на: ${getStatusText(newStatus)}`
    });
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'in_progress': return 'В работе';
      case 'review': return 'На проверке';
      case 'completed': return 'Завершен';
      case 'disputed': return 'Спор';
      default: return status;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.type === 'status') {
      return (
        <div className="text-center text-sm text-gray-500 my-2">
          {message.content}
        </div>
      );
    }

    if (message.type === 'image') {
      return (
        <div className="max-w-xs rounded-lg overflow-hidden">
          <img 
            src={message.fileInfo?.url} 
            alt="Attached content" 
            className="rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
            onClick={() => window.open(message.fileInfo?.url, '_blank')}
          />
        </div>
      );
    }

    if (message.type === 'file') {
      return (
        <div className="border rounded-lg p-3 bg-white max-w-xs">
          <div className="flex items-start">
            <div className="p-2 bg-blue-50 rounded-lg mr-3">
              <File className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{message.fileInfo?.name}</p>
              <p className="text-xs text-gray-500">{message.fileInfo?.size}</p>
              <div className="mt-2">
                <a 
                  href={message.fileInfo?.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                  download
                >
                  <Download className="w-3 h-3 mr-1" /> Скачать
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <p className="text-gray-800">{message.content}</p>;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Сообщения</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {/* Conversation list would go here */}
          <div className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={otherUserData.avatar} alt={otherUserData.name} />
                  <AvatarFallback>{otherUserData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {otherUserData.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 truncate">{otherUserData.name}</h3>
                  <span className="text-xs text-gray-500">
                    {formatTime(new Date(messages[messages.length - 1].timestamp))}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {messages[messages.length - 1].content.substring(0, 40)}{messages[messages.length - 1].content.length > 40 ? '...' : ''}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <Avatar>
                <AvatarImage src={otherUserData.avatar} alt={otherUserData.name} />
                <AvatarFallback>{otherUserData.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {otherUserData.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold">{otherUserData.name}</h2>
              <p className="text-xs text-gray-500 flex items-center">
                {otherUserData.isOnline ? (
                  <>
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    В сети
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                    Был(а) {otherUserData.lastSeen || 'давно'}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </Button>
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </Button>
          </div>
        </div>

        {/* Order Status Bar */}
        <div className="bg-blue-50 border-b border-blue-100 p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm text-gray-900">{order.title}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${getStatusColor(order.status)} text-xs`}>
                  {getStatusText(order.status)}
                </Badge>
                <span className="text-xs text-gray-500">
                  Срок: {new Date(order.deadline).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
                Просмотреть заказ
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Действия
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleStatusUpdate('review')}>
                    <CheckCircle className="w-4 h-4 mr-2 text-yellow-500" />
                    На проверку
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate('completed')}>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    Завершить заказ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusUpdate('disputed')} className="text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Открыть спор
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === currentUser.id;
              const showDate = index === 0 || 
                new Date(message.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();
              
              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="text-center text-sm text-gray-500 my-4">
                      {formatDate(new Date(message.timestamp))}
                    </div>
                  )}
                  
                  {message.type === 'status' ? (
                    renderMessageContent(message)
                  ) : (
                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-2xl ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white'} rounded-2xl px-4 py-2 shadow-sm`}>
                        {!isCurrentUser && (
                          <div className="text-xs font-medium text-gray-500 mb-1">
                            {otherUserData.name}
                          </div>
                        )}
                        {renderMessageContent(message)}
                        <div className={`text-xs mt-1 flex items-center ${isCurrentUser ? 'text-blue-100 justify-end' : 'text-gray-500'}`}>
                          {formatTime(new Date(message.timestamp))}
                          {isCurrentUser && (
                            <span className="ml-1">
                              {message.status === 'read' ? (
                                <CheckCircle className="w-3 h-3 text-blue-300" />
                              ) : message.status === 'delivered' ? (
                                <Check className="w-3 h-3 text-blue-300" />
                              ) : (
                                <Clock className="w-3 h-3 text-blue-300" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          {selectedFile && (
            <div className="relative bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  ) : (
                    <File className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={removeSelectedFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Напишите сообщение..."
                className="pr-12 min-h-[44px]"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <div className="absolute right-2 bottom-2 flex space-x-1">
                <input
                  type="file"
                  id="file-upload"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              size="icon" 
              className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700"
              disabled={!newMessage.trim() && !selectedFile}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
