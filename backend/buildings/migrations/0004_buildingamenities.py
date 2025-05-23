# Generated by Django 5.0.3 on 2025-04-15 18:08

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('amenities', '0001_initial'),
        ('buildings', '0003_alter_buildings_number_of_floors'),
    ]

    operations = [
        migrations.CreateModel(
            name='BuildingAmenities',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('distance', models.FloatField(help_text='Дистанция в метрах')),
                ('amenity', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='amenities.amenities')),
                ('building', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='buildings.buildings')),
            ],
            options={
                'verbose_name': 'Связь здания и удобства',
                'verbose_name_plural': 'building_amenities',
                'db_table': 'building_amenities',
            },
        ),
    ]
