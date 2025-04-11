## 🚀 Развертывание проекта

### Системные требования
- Docker 20.10+
- Docker Compose 2.0+
- Python 3.12 (только для локальной разработки)

### 🐳 Запуск через Docker

**Сборка и запуск контейнеров**:
```bash
docker-compose up --build
```

### 🔄 Миграции базы данных
**Применить все миграции** (если не сработало автоматически):
```bash 
docker exec -it diplom-backend-1 python manage.py migrate
```

## 👑 Создание суперпользователя
```bash 
docker-compose exec backend python manage.py createsuperuser
```
