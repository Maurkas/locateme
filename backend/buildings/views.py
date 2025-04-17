from django.contrib import messages
from django.urls import reverse
import subprocess, os
from django.http import HttpResponseRedirect
from django.contrib.admin.views.decorators import staff_member_required


@staff_member_required
def run_distance_calculator_view(request):
    try:
        # Для Windows
        if os.name == 'nt':
            subprocess.Popen(['python', 'buildings/services/DistanceCalculatorApp.py'])
            messages.success(request, "Сервис успешно запущен!")
    except Exception as e:
        messages.error(request, f"Ошибка при запуске сервиса: {str(e)}")

    return HttpResponseRedirect(reverse('admin:buildings_buildingamenities_changelist'))