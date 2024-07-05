# api/views.py

from django.contrib.auth import get_user_model
from rest_framework import generics
from .models import Workspace, Task, SubTask, UserWorkspaceRole
from .serializers import UserSerializer, WorkspaceSerializer, TaskSerializer, SubTaskSerializer, \
    UserWorkspaceRoleSerializer, RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import AllowAny

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class WorkspaceListCreateView(generics.ListCreateAPIView):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer


class WorkspaceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Workspace.objects.all()
    serializer_class = WorkspaceSerializer


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        return Task.objects.filter(workspace_id=workspace_id)

    def perform_create(self, serializer):
        workspace_id = self.kwargs['workspace_id']
        serializer.save(workspace_id=workspace_id)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        return Task.objects.filter(workspace_id=workspace_id)


class SubTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = SubTaskSerializer

    def get_queryset(self):
        task_id = self.kwargs['task_id']
        return SubTask.objects.filter(task_id=task_id)

    def perform_create(self, serializer):
        task_id = self.kwargs['task_id']
        serializer.save(task_id=task_id)


class SubTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubTaskSerializer

    def get_queryset(self):
        task_id = self.kwargs['task_id']
        return SubTask.objects.filter(task_id=task_id)


class UserWorkspaceRoleListCreateView(generics.ListCreateAPIView):
    serializer_class = UserWorkspaceRoleSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        return UserWorkspaceRole.objects.filter(workspace_id=workspace_id)

    def perform_create(self, serializer):
        workspace_id = self.kwargs['workspace_id']
        serializer.save(workspace_id=workspace_id)


class UserWorkspaceRoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserWorkspaceRoleSerializer

    def get_queryset(self):
        workspace_id = self.kwargs['workspace_id']
        return UserWorkspaceRole.objects.filter(workspace_id=workspace_id)
