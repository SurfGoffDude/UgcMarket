import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Заглушка страницы добавления услуги
 */
const ServiceAddPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-12">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold ml-4">Добавление услуги</h1>
      </div>

      <div className="border rounded-lg p-8 text-gray-500 text-center">
        Форма добавления услуги в разработке.
      </div>
    </div>
  );
};

export default ServiceAddPage;
