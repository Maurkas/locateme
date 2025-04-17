from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from .models import Favorite, SearchQuery
from .serializers import FavoriteSerializer, SearchQuerySerializer
from announcements.models import Announcements


class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
class UserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, announcement_id):
        try:

            favorite, created = Favorite.objects.get_or_create(
                user=request.user,
                announcement_id=announcement_id
            )
            if not created:
                favorite.delete()
                return Response({'status': 'removed'}, status=status.HTTP_200_OK)
                
            return Response({'status': 'added'}, status=status.HTTP_201_CREATED)
        
        except Announcements.DoesNotExist:
            return Response(
                {'error': f'Объявление с ID {announcement_id} не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class FavoriteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('announcement')
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)
    
class SavedSearchView(APIView):
    permission_classes = [IsAuthenticated]

    # Получить все сохраненные поиски
    def get(self, request):
        searches = SearchQuery.objects.filter(user=request.user)
        serializer = SearchQuerySerializer(searches, many=True)
        return Response(serializer.data)

    # Сохранить новый поиск
    def post(self, request):
        serializer = SearchQuerySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    # Удалить поиск
    def delete(self, request, search_id):
        try:
            search = SearchQuery.objects.get(id=search_id, user=request.user)
            search.delete()
            return Response(status=204)
        except SearchQuery.DoesNotExist:
            return Response({'error': 'Поиск не найден'}, status=404)
    