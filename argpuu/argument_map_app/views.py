from django.shortcuts import render, get_object_or_404, redirect
from .serializers.serializer import ArgumentSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from .models import Argument, ArgumentMap
from django.contrib.auth.decorators import login_required


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

