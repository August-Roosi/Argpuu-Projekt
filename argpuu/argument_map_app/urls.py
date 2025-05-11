from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import ArgumentViewSet, ConnectionViewSet, UndoActionGroupView, OperatorViewSet


router = DefaultRouter()
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
    path('toggle_publicly_editable/<int:map_id>/', views.toggle_publicly_editable, name='toggle_publicly_editable'),
    path('toggle_public/<int:map_id>/', views.toggle_public, name="toggle_public"),
    path('logout/', views.view_logout, name='logout'),
    path('login/', views.view_login, name='login'),
    path('signup/', views.view_signup, name="signup"),
    path('check-username/', views.view_check_username, name='check_username'),


    path('api/undo/', UndoActionGroupView.as_view(), name='undo'),
    path('api/', include(router.urls)),
]
