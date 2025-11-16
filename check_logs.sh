#!/bin/bash
echo "Проверка логов сервиса acoverflow-ai:"
journalctl -u acoverflow-ai -n 50 --no-pager

