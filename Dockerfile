FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY . .

CMD python manage.py migrate && \
    gunicorn --bind 0.0.0.0:8000 oee.wsgi:application
