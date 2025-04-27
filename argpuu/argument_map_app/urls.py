from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ArgumentViewSet, ConnectionViewSet, UndoActionGroupView


router = DefaultRouter()
router.register(r'arguments', ArgumentViewSet)
router.register(r'connections', ConnectionViewSet)


urlpatterns = [
    path('', views.view_argument_map, name="view_argument_maps"),
    path('view_argument_map/', views.view_argument_map, name='view_argument_maps'),  
    path('view_argument_map/<int:id>/', views.view_argument_map, name='view_argument_map'),  
    path('view_argument_map/create/', views.create_argument_map, name='create_argument_map'),
    path('view_argument_map/delete/<int:id>/', views.delete_argument_map, name='delete_argument_map'),
    path('api/undo/', UndoActionGroupView.as_view(), name='undo'),
    path('api/', include(router.urls)),
]
