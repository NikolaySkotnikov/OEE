from django.contrib import admin
from django.urls import path, include


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),
    path('oee/', include('drum_oee.urls')),
    path('api/', include('api.urls')),
]
