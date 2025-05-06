from django.shortcuts import render, get_object_or_404, redirect
from .serializers.serializer import ArgumentSerializer, ConnectionSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework import viewsets
from .models import Argument, ArgumentMap, Connection, Log, Operator
from .serializers.serializer import OperatorSerializer
from django.contrib.auth.decorators import login_required
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction, models
from .utils.create_log import create_log
from .utils.deserialize_connection_data import deserialize_connection_data

@login_required
def view_argument_map(request, id=None):
    if id:
        # Specific argument map view
        argument_map = get_object_or_404(ArgumentMap, id=id)
        return render(request, "view_argument_map.html", {"argument_map": argument_map})
    else:
        # List view / create form
        argument_maps = ArgumentMap.objects.filter(author=request.user).order_by('-created_at')
        return render(request, "list_argument_maps.html", {"argument_maps": argument_maps})

@login_required
def create_argument_map(request):
    if request.method == "POST":
        title = request.POST.get('title')
        description = request.POST.get('description')
        
        
        argument_map = ArgumentMap.objects.create(
            title=title,
            description=description,
            author=request.user  
        )
        Argument.objects.create(
            content="See on sinu juurargument, seda ei saa kustutada aga et muuta tee topelt klõps!",
            author=request.user,
            is_root=True,
            argument_map=argument_map,
        )
        
        return redirect('view_argument_map', id=argument_map.id)
    
    return redirect('view_argument_maps')

@login_required
def delete_argument_map(request, id):
    if request.method == "POST":
        argument_map = get_object_or_404(ArgumentMap, id=id)
        if argument_map.author == request.user:  
            argument_map.delete()
    return redirect('view_argument_maps') 


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
        print("User:", self.request.user)
        print("Request Data:", self.request.query_params)

        queryset = Argument.objects.filter(author=self.request.user)

        # Exclude specific argument map
        exclude_map_id = self.request.query_params.get('exclude_argument_map')
        if exclude_map_id is not None:  
            if exclude_map_id.isdigit():
                queryset = queryset.exclude(argument_map__id=int(exclude_map_id))
            else:
                queryset = queryset.none() 

        # Filter by specific argument IDs
        argument_ids = self.request.query_params.get('ids')
        print(argument_ids)
        if argument_ids is not None:
            id_list = [int(arg_id) for arg_id in argument_ids.split(',') if arg_id.strip().isdigit()]
            if id_list:
                queryset = queryset.filter(id__in=id_list)
            else:
                queryset = queryset.none()  

        # Filter by a specific argument_map ID
        filter_map_id = self.request.query_params.get('argument_map')
        if filter_map_id is not None:
            if filter_map_id.isdigit():
                queryset = queryset.filter(argument_map__id=int(filter_map_id))
            else:
                queryset = queryset.none() 

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

    