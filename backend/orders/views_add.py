"""
Этот файл содержит метод creator_client_orders, который нужно добавить в OrderViewSet
в файле orders/views.py
"""

@action(detail=False, methods=['get'], url_path='creator-client-orders')
def creator_client_orders(self, request):
    """
    Возвращает все заказы между клиентом и креатором со статусами 'in_progress', 'on_review' или 'completed'.
    
    Для фильтрации требуются параметры client и target_creator.
    
    Примеры запросов:
    /api/orders/creator-client-orders/?client=1&target_creator=2
    """
    client_id = request.query_params.get('client')
    target_creator_id = request.query_params.get('target_creator')
    
    if not client_id:
        return Response(
            {'error': 'Параметр client обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    if not target_creator_id:
        return Response(
            {'error': 'Параметр target_creator обязателен'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Получаем все заказы между указанным клиентом и креатором
        # со статусами "в работе", "на проверке" или "завершен"
        queryset = Order.objects.filter(
            client_id=client_id,
            target_creator_id=target_creator_id,
            status__in=['in_progress', 'on_review', 'completed']
        ).distinct()
        
        serializer = OrderListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': f'Ошибка при получении заказов: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )