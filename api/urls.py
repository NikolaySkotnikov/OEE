from django.urls import path
from .views import ParametrsView, DrumCounterView, DowntimeFilterView


urlpatterns = [
    path('parametrs-order/', ParametrsView.as_view()),
    path('drums/', DrumCounterView.as_view()),
    path('downtime-filter/', DowntimeFilterView.as_view()),
]