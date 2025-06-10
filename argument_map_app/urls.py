from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import UserViewSet, ArgumentMapViewSet, ArgumentViewSet, ConnectionViewSet, UndoActionGroupView, OperatorViewSet
from django.conf import settings
from django.contrib.auth.models import User
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'argument_maps', ArgumentMapViewSet)
router.register(r'arguments', ArgumentViewSet)
router.register(r'connections', ConnectionViewSet)
router.register(r'operators', OperatorViewSet)



urlpatterns = [
    path('', views.view_home, name="view_home"),
    path('view_user_argument_maps/', views.view_user_argument_maps, name='view_user_argument_maps'),  
    path('view_user_argument_maps/<int:id>/', views.view_user_argument_maps, name='view_argument_map'),  
    path('view_user_argument_maps/create/', views.create_argument_map, name='create_argument_map'),
    path('view_user_argument_maps/delete/<int:id>/', views.delete_argument_map, name='delete_argument_map'),
    path('view_all_argument_maps/', views.view_all_argument_maps, name='view_all_argument_maps'),  
    path('view_all_argument_maps/<int:id>/react/', views.react_to_argument_map, name='argument_map_react'),
    path('logout/', views.view_logout, name='logout'),
    path('login/', views.view_login, name='login'),
    path('signup/', views.view_signup, name="signup"),
    
    
    path('toggle_publicly_editable/<int:map_id>/', views.toggle_publicly_editable, name='toggle_publicly_editable'),
    path('toggle_public/<int:map_id>/', views.toggle_public, name="toggle_public"),
    path('check-username/', views.view_check_username, name='check_username'),
    
    path('add_editor/<int:map_id>/', views.add_editor, name='add_editor'),
    path('remove_editor/<int:map_id>/', views.remove_editor, name='remove_editor'),
    path('add_viewer/<int:map_id>/', views.add_viewer, name='add_viewer'),
    path('remove_viewer/<int:map_id>/', views.remove_viewer, name='remove_viewer'),
    path('get_viewers/<int:map_id>/', views.get_viewers, name='get_viewers'),
    path('get_editors/<int:map_id>/', views.get_editors, name='get_editors'),
    

    path('api/undo/', UndoActionGroupView.as_view(), name='undo'),
    path('api/', include(router.urls)),
]
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)