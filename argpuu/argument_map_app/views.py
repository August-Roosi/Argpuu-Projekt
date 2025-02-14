from django.shortcuts import render
from rest_framework import generics
from rest_framework.viewsets import ModelViewSet
from .models import Argument, Operator, Connection
from .serializers.serializer import ArgumentSerializer



def index(request):
    return render(request, 'index.html')

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
