# api/urls.py

from django.urls import path
from .views import UserListCreateView, UserDetailView, WorkspaceListCreateView, WorkspaceDetailView, TaskListCreateView, TaskDetailView, SubTaskListCreateView, SubTaskDetailView, UserWorkspaceRoleListCreateView, UserWorkspaceRoleDetailView, RegisterView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('workspaces/', WorkspaceListCreateView.as_view(), name='workspace-list-create'),
    path('workspaces/<int:pk>/', WorkspaceDetailView.as_view(), name='workspace-detail'),
    path('workspaces/<int:workspace_id>/tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('workspaces/<int:workspace_id>/tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:task_id>/subtasks/', SubTaskListCreateView.as_view(), name='subtask-list-create'),
    path('tasks/<int:task_id>/subtasks/<int:pk>/', SubTaskDetailView.as_view(), name='subtask-detail'),
    path('workspaces/<int:workspace_id>/users/', UserWorkspaceRoleListCreateView.as_view(), name='user-workspace-role-list-create'),
    path('workspaces/<int:workspace_id>/users/<int:pk>/', UserWorkspaceRoleDetailView.as_view(), name='user-workspace-role-detail'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/signup/', RegisterView.as_view(), name='register'),

]
