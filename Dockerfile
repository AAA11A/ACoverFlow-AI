FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV MUSIC_FOLDER=/music_source
ENV OUTPUT_FOLDER=/music_output
ENV WEB_PORT=3004

EXPOSE 3004

CMD ["python", "webserver.py"]

