import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-8 max-w-md mx-auto">
        <h1 className="text-8xl font-bold text-purple-600 mb-4 dark:text-purple-500">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Страница не найдена</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Извините, мы не смогли найти страницу, которую вы ищете.
        </p>
        <Button asChild>
          <Link to="/" className="inline-flex items-center gap-2">
            <Home className="w-4 h-4" />
            На главную
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
