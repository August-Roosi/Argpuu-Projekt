from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ArgumentViewSet


router = DefaultRouter()
router.register(r'arguments', ArgumentViewSet)

urlpatterns = [
    path('', views.view_argument_map, name="view_argument_maps"),
    path('view_argument_map/', views.view_argument_map, name='view_argument_maps'),  
    path('view_argument_map/<int:id>/', views.view_argument_map, name='view_argument_map'),  
    path('view_argument_map/create/', views.create_argument_map, name='create_argument_map'),
    
    path('api/', include(router.urls)),
]
