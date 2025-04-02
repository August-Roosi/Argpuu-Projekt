from django.shortcuts import render, get_object_or_404
from rest_framework import generics
from rest_framework.viewsets import ModelViewSet
from .models import ArgumentMap, Argument, Operator, Connection
from .serializers.serializer import ArgumentSerializer




def view_argument_map(request, id):
    argument_map = get_object_or_404(ArgumentMap, id=id)
    return render(request, "view_argument_map.html", {"argument_map": argument_map})

def list_argument_maps(request):
    maps = ArgumentMap.objects.all()
    return render(request, "list_argument_maps.html", {"maps": maps})


from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action

class ArgumentViewSet(viewsets.ModelViewSet):
    queryset = Argument.objects.all()
    serializer_class = ArgumentSerializer

    @action(detail=False, methods=['get'])
    def topics(self, request):
        """Custom endpoint to fetch only topics"""
        topics = Argument.objects.filter(is_topic=True)
        serializer = self.get_serializer(topics, many=True)
        return Response(serializer.data)
