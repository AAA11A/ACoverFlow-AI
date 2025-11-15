FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV MUSIC_FOLDER=/music_source
ENV OUTPUT_FOLDER=/music_output
ENV WEB_PORT=3003

EXPOSE 3003

CMD ["python", "webserver.py"]

