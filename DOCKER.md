# Запуск через Docker

## Что понадобится

- Docker Engine с Compose v2 или запущенный Docker Desktop в режиме Linux-контейнеров.
- Git для клонирования. Node.js 20+ нужен только для удобной команды npm run up; сервер и фронтенд собираются внутри Docker на Node.js 22.
- Внешний образ orders-mock:3 из материалов задания: orders-mock-amd64.tar.gz для x86-64 либо orders-mock-arm64.tar.gz для ARM64. Этот сторонний бинарный образ поставляется вместе с заданием отдельно и не включён в Git.
- Свободные порты 3000, 3001, 4000 и 5432.

## Быстрый запуск

Клонируйте репозиторий.

```bash
git clone https://github.com/BorisenkoDmitry/testorders.git
cd testorders
```

Положите подходящий архив внешнего образа в testorders/ либо в соседний каталог. Из корня выполните.

```bash
npm run up
```

Устанавливать npm-зависимости на хост перед этой командой не требуется. Скрипт проверит Docker, при необходимости загрузит внешний образ, соберёт приложения и дождётся готовности всех четырёх сервисов. Если образ orders-mock:3 уже загружен, архив не требуется.

## Запуск без Node.js на компьютере

Сначала загрузите внешний образ, выбрав одну команду под свою архитектуру Docker.

```bash
# x86-64
docker load -i orders-mock-amd64.tar.gz

# Либо ARM64
docker load -i orders-mock-arm64.tar.gz
```

Затем поднимите все контейнеры.

```bash
docker compose up -d --build --wait --wait-timeout 180
docker compose ps
```

| Сервис | Назначение | Адрес |
| --- | --- | --- |
| frontend | React и Nginx, прокси /api к серверу | [http://localhost:3000](http://localhost:3000) |
| api | Наш сервер, миграции применяются при старте | [http://localhost:3001/health](http://localhost:3001/health) |
| orders-api | Внешний тестовый магазин из задания | http://localhost:4000 |
| postgres | PostgreSQL 16, базы orders и orders_test | localhost:5432 |

Страницы интерфейса: [заказы](http://localhost:3000/orders) и [логи](http://localhost:3000/logs). На новой базе таблица пуста до синхронизации. Нажмите «Обновить заказы» или выполните POST /sync ниже.

В Compose уже заданы настройки локального тестового окружения; создавать .env для Docker-запуска не требуется. backend/.env.example относится к запуску сервера на хосте. Пароль PostgreSQL в Compose предназначен для локального задания.

## Синхронизация, вебхуки и result.json

В репозитории уже есть готовый result.json. Для воспроизведения используйте чистую тестовую БД и выполняйте шаги последовательно: сначала дождитесь полного ответа sync, затем завершения вебхуков, затем сохраняйте статистику. Синхронизация может идти несколько минут из-за ограничений внешнего API.

Bash / Linux / macOS / Git Bash.

```bash
curl --fail --request POST http://localhost:3001/sync
docker compose run --rm orders-api webhooks --target http://api:3000/webhooks/order
curl --fail "http://localhost:3001/customers/c_7/daily-totals?from=2026-03-27&to=2026-03-31" --output result.json
```

В Windows PowerShell используйте curl.exe, чтобы вызвать настоящий curl, а не старый PowerShell-псевдоним.

```powershell
curl.exe --fail --request POST http://localhost:3001/sync
docker compose run --rm orders-api webhooks --target http://api:3000/webhooks/order
curl.exe --fail "http://localhost:3001/customers/c_7/daily-totals?from=2026-03-27&to=2026-03-31" --output result.json
```

Адрес api:3000 в команде вебхуков — имя нашего сервера внутри Docker-сети. С компьютера наш API доступен через localhost:3001. Поле total равно gross; обе даты входят в период, дни определяются в часовом поясе клиента по createdAt.

Если тестовое окружение уже использовалось, обычная остановка сохраняет заказы. Для полного повторного прогона можно удалить только данные этого Compose-проекта следующей командой. Она безвозвратно удалит его локальный Docker volume с базами orders и orders_test; используйте её только для одноразовых тестовых данных, которые готовы пересоздать.

```bash
docker compose down --volumes
docker compose up -d --build --wait --wait-timeout 180
```

После этого повторите sync, вебхуки и GET статистики. Для обычного использования сброс базы не нужен.

## Тесты

```bash
docker compose --profile test run --build --rm tests
```

Или npm run test:docker из корня. Контейнер запускает 60 тестов бэкенда в отдельной базе orders_test; рабочая база orders в тестах не очищается. Тестовый контейнер удаляется после завершения. PostgreSQL остаётся запущенным.

## Логи и остановка

```bash
docker compose ps
docker compose logs -f api frontend
docker compose logs -f orders-api postgres
docker compose down
```

Последняя команда сохраняет данные. Повторный npm run up или docker compose up -d --build --wait запускает окружение с прежней базой.

Если нет образа orders-mock:3, положите архив из задания рядом с проектом и повторите npm run up либо docker load. При занятом порте освободите соответствующий порт перед стартом. Для диагностики ошибки сборки запускайте docker compose up --build без -d и смотрите вывод.
