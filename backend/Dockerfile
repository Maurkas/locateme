FROM python:3.12-slim

WORKDIR /app

# Устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

RUN mkdir -p /app/staticfiles && chmod -R 755 /app/staticfiles

# Команда для запуска
CMD ["sh", "-c", "python manage.py wait_for_db && python manage.py migrate && python manage.py collectstatic --noinput && gunicorn locateme.wsgi:application --bind 0.0.0.0:8000"]
#CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && python manage.py runserver"]