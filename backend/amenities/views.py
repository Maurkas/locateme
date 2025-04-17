from django.contrib import messages
from django.urls import reverse
import subprocess
from django.http import HttpResponseRedirect
from django.contrib.admin.views.decorators import staff_member_required


@staff_member_required
def run_parser_view(request):
    try:
        subprocess.Popen(['python', 'amenities/parsers/parsers.py'])
        messages.success(request, "Парсер успешно запущен!")
    except Exception as e:
        messages.error(request, f"Ошибка при запуске парсера: {str(e)}")

    return HttpResponseRedirect(reverse('admin:amenities_amenities_changelist'))
