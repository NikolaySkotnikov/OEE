from django.urls import path
from .views import public_dashboard, operator_dashboard, master_dashboard


urlpatterns = [
    path('public/', public_dashboard, name='public_dashboard'),
    path('operator/', operator_dashboard, name='operator_dashboard'),
    path('master/', master_dashboard, name='master_dashboard'),
]
