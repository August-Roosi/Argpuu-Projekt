from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ArgumentViewSet


router = DefaultRouter()
router.register(r'arguments', ArgumentViewSet)

urlpatterns = [
    path('', views.index, name='index'),  
    path('api/', include(router.urls)),

]
