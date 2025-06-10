from django.shortcuts import render, get_object_or_404, redirect
from .serializers.serializer import UserSerializer, ArgumentMapSerializer, ArgumentSerializer, ConnectionSerializer, OperatorSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework import viewsets
from .models import Argument, ArgumentMap, Connection, Log, Operator
from django.contrib.auth.decorators import login_required
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction, models
from .utils.create_log import create_log
from .utils.deserialize_connection_data import deserialize_connection_data
from rest_framework.decorators import api_view
from django.contrib.auth import logout, authenticate, login
from django.contrib import messages
from .forms import CustomSignupForm
from django.http import JsonResponse
from django.contrib.auth.models import User
import json



def view_home(request):
    return render(request, "home.html")

@login_required
def view_user_argument_maps(request, id=None):
    if id:
        # Specific argument map view
        argument_map = get_object_or_404(ArgumentMap, id=id)
        
        is_author = argument_map.author == request.user
        is_publicly_editable = argument_map.is_publicly_editable
        
        
        if is_author or is_publicly_editable or request.user in argument_map.editors.all():
            is_read_only = False
        else:
            is_read_only = True
            

            
        return render(request, "view_argument_map.html", context={"argument_map": argument_map, "is_read_only": is_read_only, "is_author": is_author})
    else:
        # List view / create form
        argument_maps = ArgumentMap.objects.filter(
            author=request.user
        ).order_by('-created_at')
        return render(request, "list_user_argument_maps.html", {"argument_maps": argument_maps})


@login_required
def view_all_argument_maps(request):
    toggle = request.GET.get("toggle")  
    user = request.user 
    
    if toggle == "shared":
        argument_maps = ArgumentMap.objects.filter(
                Q(editors=user) | Q(viewers=user)
            ).distinct()
    else:
        argument_maps = ArgumentMap.objects.filter(is_public=True).order_by('-created_at')
        

    for map in argument_maps:
        map.likes_count = map.likes.count()  
        map.dislikes_count = map.dislikes.count()  
        map.total_likes = map.likes_count - map.dislikes_count  
        map.user_reaction = "neutral"   

        if map.likes.filter(id=user.id).exists():
            map.user_reaction = "liked"  
        elif map.dislikes.filter(id=user.id).exists():
            map.user_reaction = "disliked"  
            
    argument_maps = sorted(argument_maps, key=lambda x: x.total_likes, reverse=True)

    return render(request, "list_all_argument_maps.html", {"argument_maps": argument_maps, "toggle": toggle})


@login_required
def create_argument_map(request):
    if request.method == "POST":
        title = request.POST.get('title')
        description = request.POST.get('description')
        is_public = request.POST.get('is_public')
        is_publicly_editable = request.POST.get('is_publicly_editable')
    
        if is_public == "on":
            is_public = True
        else:
            is_public = False
        if is_publicly_editable == "on":
            is_publicly_editable = True
        else:
            is_publicly_editable = False
        
        
        argument_map = ArgumentMap.objects.create(
            title=title,
            description=description,
            author=request.user,
            is_public=is_public,
            is_publicly_editable=is_publicly_editable,
        )
        Argument.objects.create(
            content="See on sinu juurargument, seda ei saa kustutada aga et muuta tee topelt klõps!",
            author=request.user,
            is_root=True,
            argument_map=argument_map,
        )
        
        return redirect('view_argument_map', id=argument_map.id)
    
    return redirect('view_user_argument_maps')

@login_required
def delete_argument_map(request, id):
    if request.method == "POST":
        argument_map = get_object_or_404(ArgumentMap, id=id)
        if argument_map.author == request.user:  
            argument_map.delete()
    return redirect('view_user_argument_maps') 

@api_view(['POST'])
@login_required
def react_to_argument_map(request, id):
    """Toggle like/dislike/neutral on an argument map"""
    try:
        argument_map = ArgumentMap.objects.get(id=id)
    except ArgumentMap.DoesNotExist:
        return Response({"detail": "Argument map not found."}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    action = request.data.get("action")

    if action == "like":
        if argument_map.likes.filter(id=user.id).exists():
            # User already liked, remove like
            argument_map.likes.remove(user)
            action = "neutral"
        else:
            argument_map.likes.add(user)
            
        if argument_map.dislikes.filter(id=user.id).exists():
            # User disliked before, remove dislike
            argument_map.dislikes.remove(user)
    elif action == "dislike":
        if argument_map.dislikes.filter(id=user.id).exists():
            # User already disliked, remove dislike
            argument_map.dislikes.remove(user)
            action = "neutral"
        else: 
            argument_map.dislikes.add(user)
            
        if argument_map.likes.filter(id=user.id).exists():
            # User liked before, remove like
            argument_map.likes.remove(user)
    else:
        return Response({"detail": "Invalid action. Must be 'like' or 'dislike'."},
                        status=status.HTTP_400_BAD_REQUEST)

    return Response({
        "action": action,
        "total_likes": argument_map.likes.count() - argument_map.dislikes.count(),
        "user_likes": argument_map.likes.filter(id=user.id).exists(),
        "user_dislikes": argument_map.dislikes.filter(id=user.id).exists(),
        
    }, status=status.HTTP_200_OK)
    
    
@api_view(['POST'])
@login_required
def toggle_publicly_editable(request, map_id):
    try:
        argument_map = ArgumentMap.objects.get(id=map_id, author=request.user)
        argument_map.is_publicly_editable = not argument_map.is_publicly_editable
        argument_map.save()
        return JsonResponse({
            "success": True,
            "is_publicly_editable": argument_map.is_publicly_editable
        })
    except ArgumentMap.DoesNotExist:
        return JsonResponse({"success": False, "error": "Kaarti ei leitud või sul puudub õigus."})

@api_view(['POST'])
@login_required
def toggle_public(request, map_id):
    try:
        argument_map = ArgumentMap.objects.get(id=map_id, author=request.user)
        argument_map.is_public = not argument_map.is_public
        argument_map.save()
        return JsonResponse({"success": True, "is_public": argument_map.is_public})
    except ArgumentMap.DoesNotExist:
        return JsonResponse({"success": False, "error": "Kaart ei leitud või puudub luba."}, status=403)

def view_logout(request):
    if request.method == 'POST':
        logout(request)
    return redirect('view_home')  

def view_login(request):
    next_url = request.GET.get('next', 'view_home') 

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect(request.POST.get('next', next_url))
        else:
            messages.error(request, "Vale kasutajanimi või parool.")

    return render(request, 'login.html', {'next': next_url})



def view_signup(request):
    if request.method == "POST":
        form = CustomSignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("view_home") 
        else:
            print(form.errors)
    
            return render(request, "signup.html", {"form": form})
    else:
        form = CustomSignupForm()
    return render(request, "signup.html", {"form": form})

def view_check_username(request):
    username = request.GET.get("username", "")
    exists = User.objects.filter(username=username).exists()
    return JsonResponse({"exists": exists})

def add_editor(request, map_id):
    if request.method == "POST":
        argument_map = get_object_or_404(ArgumentMap, id=map_id)
        if argument_map.author == request.user: 
            data = json.loads(request.body) 
            user_id = data.get('user_id')
            try:
                print(request.body, "Adding editor with user_id:", user_id, flush=True)
                user = User.objects.get(id=user_id)
                argument_map.editors.add(user)
                return redirect('view_argument_map', id=map_id)
            except User.DoesNotExist:
                print(request, "Kasutajat ei leitud.", flush=True)
        else:
            print(request, "Sul puudub õigus lisada toimetajaid.")
    return redirect('view_argument_map', id=map_id)
def remove_editor(request, map_id):
    if request.method == "POST":
        argument_map = get_object_or_404(ArgumentMap, id=map_id)
        if argument_map.author == request.user:  
            data = json.loads(request.body) 
            user_id = data.get('user_id')
            try:
                user = User.objects.get(id=user_id)
                argument_map.editors.remove(user)
                return redirect('view_argument_map', id=map_id)
            except User.DoesNotExist:
                print(request, "Kasutajat ei leitud.")
        else:
            print(request, "Sul puudub õigus eemaldada toimetajaid.")
    return redirect('view_argument_map', id=map_id)

def add_viewer(request, map_id):
    if request.method == "POST":
        argument_map = get_object_or_404(ArgumentMap, id=map_id)
        if argument_map.author == request.user:  
            data = json.loads(request.body) 
            user_id = data.get('user_id')
            try:
                user = User.objects.get(id=user_id)
                argument_map.viewers.add(user)
                return redirect('view_argument_map', id=map_id)
            except User.DoesNotExist:
                print(request, "Kasutajat ei leitud.")
        else:
            print(request, "Sul puudub õigus lisada vaatlejaid.")
    return redirect('view_argument_map', id=map_id)
def remove_viewer(request, map_id):
    if request.method == "POST":
        argument_map = get_object_or_404(ArgumentMap, id=map_id)
        if argument_map.author == request.user:  
            data = json.loads(request.body) 
            user_id = data.get('user_id')
            try:
                user = User.objects.get(id=user_id)
                argument_map.viewers.remove(user)
                argument_map.editors.remove(user) 
                return redirect('view_argument_map', id=map_id)
            except User.DoesNotExist:
                print(request, "Kasutajat ei leitud.")
        else:
            print(request, "Sul puudub õigus eemaldada vaatlejaid.")
    return redirect('view_argument_map', id=map_id)


def get_viewers(request, map_id):
    argument_map = get_object_or_404(ArgumentMap, id=map_id)
    viewers = argument_map.viewers.all()
    return JsonResponse({
        "viewers": [{"id": user.id, "username": user.username} for user in viewers]
    })
def get_editors(request, map_id):
    argument_map = get_object_or_404(ArgumentMap, id=map_id)
    editors = argument_map.editors.all()
    return JsonResponse({
        "editors": [{"id": user.id, "username": user.username} for user in editors]
    })


class UserViewSet(viewsets.ReadOnlyModelViewSet):  
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    def get_queryset(self):
        return User.objects.exclude(id=self.request.user.id)


class ArgumentMapViewSet(viewsets.ModelViewSet):  
    permission_classes = [IsAuthenticated]
    queryset = ArgumentMap.objects.all()
    serializer_class = ArgumentMapSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['title', 'description', 'author', 'is_public', 'is_publicly_editable']
    
    def get_queryset(self):
        print("User:", self.request.user)
        print("Request Data:", self.request.body)
        return super().get_queryset()

class ArgumentViewSet(viewsets.ModelViewSet):
    queryset = Argument.objects.all()
    serializer_class = ArgumentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['argument_map']
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        action_group_id = self.request.headers.get('X-Action-Group-Id')
        argument_map_id = self.request.headers.get('X-Argument-Map-Id')

        context['action_group_id'] = action_group_id
        context['argument_map_id'] = argument_map_id
        return context

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer Errors:", serializer.errors)
            return Response(serializer.errors, status=400)

        self.perform_create(serializer)
        return Response(serializer.data, status=201)
    
    def get_queryset(self):

        queryset = Argument.objects.filter(author=self.request.user)

        # Exclude specific argument map
        exclude_map_id = self.request.query_params.get('exclude_argument_map')
        if exclude_map_id is not None and exclude_map_id.isdigit():
            exclude_map_id = int(exclude_map_id)

            operators = Operator.objects.filter(argument_map=exclude_map_id)

            from itertools import chain
            argument_ids_to_exclude = list(chain.from_iterable(
                operator.arguments.values_list('id', flat=True) for operator in operators
            ))
            
            return queryset.exclude(
            Q(id__in=argument_ids_to_exclude) |
            Q(argument_map__isnull=False)
                )


        # Filter by specific argument IDs
        queryset = Argument.objects.filter()
        
        argument_ids = self.request.query_params.get('ids')
        if argument_ids is not None:
            id_list = [int(arg_id) for arg_id in argument_ids.split(',') if arg_id.strip().isdigit()]
            if id_list:
                print("ID List:", id_list)
                return queryset.filter(id__in=id_list)
            else:
                return queryset.none()  
                

        # Filter by a specific argument_map ID
        queryset = Argument.objects.filter()
        
        filter_map_id = self.request.query_params.get('argument_map')
        if filter_map_id is not None:
            if filter_map_id.isdigit():
                return queryset.filter(argument_map__id=int(filter_map_id))
            else:
                return queryset.none() 

        return queryset
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        print("Deleting instance:", instance)
        before = ArgumentSerializer(instance).data
        argument_map_id = request.headers.get('X-Argument-Map-Id')
        argument_map = ArgumentMap.objects.get(id=argument_map_id)

        create_log(
            user=request.user,
            instance=instance,
            argument_map=argument_map,
            change_type="argument_deleted",
            description="Deleted an argument",
            data_before=before,
            data_after={},
            group_id=request.headers.get('X-Action-Group-Id') 
        )
        self.perform_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)


    
class ConnectionViewSet(viewsets.ModelViewSet):  
    queryset = Connection.objects.all()
    serializer_class = ConnectionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['argument_map', 'source_argument', 'target_operator']
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        action_group_id = self.request.headers.get('X-Action-Group-Id')
        argument_map_id = self.request.headers.get('X-Argument-Map-Id')

        context['action_group_id'] = action_group_id
        context['argument_map_id'] = argument_map_id
        return context
    
    def get_queryset(self):
        print("User:", self.request.user)
        print("Request Data:", self.request.body)
        return super().get_queryset()
    
    def create(self, request, *args, **kwargs):
        print("CREATE REQUEST")
        print("Request method:", request.method)
        print("Request data:", request.data)

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer Errors:", serializer.errors)
            return Response(serializer.errors, status=400)

        self.perform_create(serializer)
        return Response(serializer.data, status=201)
    
    def list(self, request, *args, **kwargs):
        argument_ids = request.GET.get('arguments')
        argument_map_id = request.GET.get('argument_map')

        queryset = self.queryset

        if argument_ids:
            argument_ids = [int(arg_id) for arg_id in argument_ids.split(',') if arg_id.isdigit()]
            queryset = queryset.filter(
                Q(source_argument__id__in=argument_ids) &
                Q(target_operator__id__in=argument_ids)
            )
        if argument_map_id and argument_map_id.isdigit():
            queryset = queryset.filter(argument_map=argument_map_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        print("dele")
        instance = self.get_object()
        print("Deleting instance:", instance)
        before = ConnectionSerializer(instance).data
        argument_map_id = request.headers.get('X-Argument-Map-Id')
        argument_map = ArgumentMap.objects.get(id=argument_map_id)

        if argument_map.author is not self.context['request'].user:
            argument_map.contributors.add(self.context['request'].user)

        create_log(
            user=request.user,
            instance=instance,
            argument_map=argument_map,
            change_type="connection_deleted",
            description="Deleted a connection",
            data_before=before,
            data_after={},
            group_id=request.headers.get('X-Action-Group-Id') 
        )
        self.perform_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)


class OperatorViewSet(viewsets.ModelViewSet):
    queryset = Operator.objects.all()
    serializer_class = OperatorSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        action_group_id = self.request.headers.get('X-Action-Group-Id')
        argument_map_id = self.request.headers.get('X-Argument-Map-Id')

        context['action_group_id'] = action_group_id
        context['argument_map_id'] = argument_map_id
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()
        argument_map_id = self.request.query_params.get('argument_map')

        if argument_map_id:
            queryset = queryset.filter(argument_map_id=argument_map_id)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)  
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class UndoActionGroupView(APIView):
    def post(self, request):
        user = request.user
        argument_map_id = self.request.headers.get('X-Argument-Map-Id')
        argument_map = ArgumentMap.objects.get(id=argument_map_id)

        # Get the most recent action that hasn't been undone yet
        latest_log = Log.objects.filter(user=user, argument_map=argument_map, undone=False).order_by('-created_at').first()

        if not latest_log:
            return Response({'detail': 'No actions to undo.'}, status=204)

        # If there is an action_group_id, undo all logs from the group
        if latest_log.action_group_id:
            logs = Log.objects.filter(
                user=user,
                argument_map=argument_map,
                action_group_id=latest_log.action_group_id,
                undone=False
            ).order_by('-created_at')
        else:
            # Otherwise, undo just the single latest log
            logs = [latest_log]

        with transaction.atomic():
            for log in logs:
                model_class = log.content_type.model_class()

                try:
                    instance = model_class.objects.filter(id=log.object_id).first()
                    result = deserialize_connection_data(instance, log)
                    if isinstance(result, dict):
                        data = result
                    else:
                        instance = result
                    print("Instance:", result)
                    if log.change_type.endswith("_created"):
                        print("Deleting instance:", instance)
                        instance.delete()

                    elif log.change_type.endswith("_updated"):
                        instance.save()

                    elif log.change_type.endswith("_deleted"):
                        model_class.objects.create(**data)

                    log.undone = True
                    log.save()

                except Exception as e:
                    return Response({'error': f'Failed to undo log {log.id}: {str(e)}'}, status=500)

        return Response({'detail': 'Undo successful.'}, status=200)

    