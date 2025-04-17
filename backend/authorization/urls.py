from django.urls import path
from .views import RegisterView, LoginView, FavoriteToggleView, FavoriteListView, UserView, SavedSearchView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('user/', UserView.as_view(), name='user'),
    path('favorites/<int:announcement_id>/', FavoriteToggleView.as_view(), name='favorite-toggle'),
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('searches/', SavedSearchView.as_view()),
    path('searches/<int:search_id>/', SavedSearchView.as_view()),
]