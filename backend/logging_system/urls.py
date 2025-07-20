"""
URL маршруты для системы логирования.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('frontend/', views.log_frontend_entry, name='log_frontend_entry'),
    path('user/', views.get_user_logs, name='get_user_logs'),
]