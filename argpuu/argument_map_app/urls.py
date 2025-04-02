from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ArgumentViewSet


router = DefaultRouter()
router.register(r'arguments', ArgumentViewSet)

urlpatterns = [
    path('', views.list_argument_maps, name="argument_map_list"),
    path('view_argument_map/<int:id>/', views.view_argument_map, name='view_argument_map'),  
    path('api/', include(router.urls)),
]
