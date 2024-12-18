FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Делаем файл исполняемым
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]
