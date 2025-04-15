from django.shortcuts import render, get_object_or_404, redirect
from .serializers.serializer import ArgumentSerializer, ConnectionSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework import viewsets
from .models import Argument, ArgumentMap, Connection
from django.contrib.auth.decorators import login_required
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


@login_required
def view_argument_map(request, id=None):
    if id:
        # Specific argument map view
        argument_map = get_object_or_404(ArgumentMap, id=id)
        return render(request, "view_argument_map.html", {"argument_map": argument_map})
    else:
        # List view / create form
        argument_maps = ArgumentMap.objects.filter(author=request.user).order_by('-created_at')
        print(argument_maps)
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
        
        return redirect('view_argument_map', id=argument_map.id)
    
    return redirect('view_argument_maps')



class ArgumentViewSet(viewsets.ModelViewSet):
    queryset = Argument.objects.all()
    serializer_class = ArgumentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['argument_map']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Argument.objects.filter(author=self.request.user)

    def create(self, request, *args, **kwargs):
        print("Request Data:", request.data)

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer Errors:", serializer.errors)
            return Response(serializer.errors, status=400)

        self.perform_create(serializer)
        return Response(serializer.data, status=201)


class ConnectionViewSet(viewsets.ModelViewSet):  
    queryset = Connection.objects.all()
    serializer_class = ConnectionSerializer

    def list(self, request, *args, **kwargs):
        """
        Allows filtering connections by argument IDs using a query parameter.
        Example: /api/connections/?arguments=1,2,3
        """
        argument_ids = request.GET.get('arguments')
        
        if argument_ids:
            argument_ids = [int(arg_id) for arg_id in argument_ids.split(',') if arg_id.isdigit()]
            queryset = self.queryset.filter(
                Q(source_argument__id__in=argument_ids) & Q(target_argument__id__in=argument_ids)
            )
        else:
            queryset = self.queryset

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)