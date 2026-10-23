# АгроМаркет

[![API tests](https://github.com/5ky9/lab_7/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/5ky9/lab_7/actions/workflows/ci.yml)
[![React checks](https://github.com/5ky9/lab_7/actions/workflows/react-ci.yml/badge.svg?branch=main)](https://github.com/5ky9/lab_7/actions/workflows/react-ci.yml)

Full-stack учебный магазин локальных продуктов: React + Vite, Express, PostgreSQL и JWT-аутентификация.

## Возможности

- Публичный каталог с поиском и формой заказа.
- Регистрация и вход; пароли хранятся только в виде bcrypt-хэшей.
- JWT-аутентификация, роли `user`/`admin`, ограничение попыток входа и Helmet.
- Администратор может добавлять, редактировать и удалять товары, просматривать заявки и менять их статус.
- Вошедший покупатель видит свои заявки и может сменить пароль.
- Заказы гостей разрешены, но они не попадают в список личных заказов.
- Postman-коллекция для проверки API, в том числе ответов `401` и `403`.

## Требования

- Node.js 20 или новее и npm.
- Docker Desktop с Compose **или** установленный PostgreSQL.

## Локальный запуск (PowerShell)

1. Запустите базу данных из корня проекта:

   ```powershell
   docker compose up -d db
   ```

   Compose создаёт локальную базу `agromarket` с пользователем `agromarket`. Пароль `agromarket_local` предназначен только для локальной разработки. Чтобы изменить его, задайте `POSTGRES_PASSWORD` перед запуском Compose и используйте тот же пароль в `DATABASE_URL`.

2. Настройте сервер:

   ```powershell
   Copy-Item agromarket-server\.env.example agromarket-server\.env
   cd agromarket-server
   npm install
   ```

   В `agromarket-server\.env` замените `JWT_SECRET` и `ADMIN_PASSWORD`. Сгенерировать ключ можно командой:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   `ADMIN_EMAIL` и `ADMIN_PASSWORD` задают учётную запись администратора, создаваемую при заполнении базы.

3. Создайте схему и демонстрационные данные, затем запустите API:

   ```powershell
   npm run db:init
   npm run dev
   ```

   API работает на `http://localhost:3000`. Проверьте его запросом `GET http://localhost:3000/api/health`.

   **Важно:** `npm run db:init` пересоздаёт таблицы и удаляет текущие товары, пользователей и заявки. Запускайте эту команду только для пустой учебной базы.

4. В отдельном терминале настройте и запустите React:

   ```powershell
   Copy-Item agromarket-react\.env.example agromarket-react\.env
   cd agromarket-react
   npm install
   npm run dev
   ```

   Откройте `http://localhost:5173`. Адрес API можно изменить через `VITE_API_URL`; разрешённые CORS-origin на сервере — через `CORS_ORIGIN`.

## Команды

| Папка | Команда | Назначение |
|---|---|---|
| `agromarket-server` | `npm run dev` | API с перезапуском при изменениях |
| `agromarket-server` | `npm start` | Запуск API |
| `agromarket-server` | `npm run db:init` | Пересоздание схемы и заполнение базы |
| `agromarket-server` | `npm test` | Запуск интеграционных API- и unit-тестов |
| `agromarket-server` | `npm run test:watch` | Запуск Vitest в watch-режиме |
| `agromarket-server` | `npm run test:unit` | Запуск unit-тестов middleware без PostgreSQL |
| `agromarket-server` | `npm run coverage` | Запуск тестов с отчётом покрытия |
| `agromarket-server` | `npm run coverage:unit` | Отчёт покрытия unit-теста middleware |
| `agromarket-server` | `npm run db:init:test` | Безопасный сброс и заполнение только тестовой БД |
| `agromarket-react` | `npm run dev` | Dev-сервер React |
| `agromarket-react` | `npm run build` | Production-сборка в `dist` |
| корень | `docker compose up -d db` | Запуск PostgreSQL |

## API

Все маршруты находятся под `/api`.

| Метод | Маршрут | Доступ | Назначение |
|---|---|---|---|
| `GET` | `/health` | публичный | Проверка API и соединения с БД |
| `POST` | `/auth/register` | публичный | Регистрация покупателя |
| `POST` | `/auth/login` | публичный, ограничение попыток | Вход; выдаёт JWT |
| `GET` | `/auth/me` | JWT | Данные текущего пользователя |
| `PATCH` | `/auth/password` | JWT | Смена пароля с проверкой текущего |
| `GET` | `/products` | публичный | Каталог, опциональный параметр `search` |
| `GET` | `/products/:id` | публичный | Один товар |
| `POST` | `/products` | только admin | Добавить товар |
| `PUT` | `/products/:id` | только admin | Изменить товар |
| `DELETE` | `/products/:id` | только admin | Удалить товар |
| `POST` | `/orders` | публичный; JWT необязателен | Создать заявку |
| `GET` | `/orders/my` | JWT | Заявки текущего пользователя |
| `GET` | `/orders` | только admin | Все заявки покупателей |
| `PATCH` | `/orders/:id` | только admin | Изменить статус заявки |

Для защищённых маршрутов передавайте заголовок `Authorization: Bearer <token>`. `401` означает, что пользователь не аутентифицирован или токен недействителен; `403` — что пользователь вошёл, но у него недостаточно прав.

## Postman

Импортируйте `agromarket-server/postman/agromarket.postman_collection.json`. Установите значения переменных `adminEmail` и `adminPassword` в соответствии с локальным `.env`, затем запустите коллекцию через Collection Runner по порядку. Коллекция сохраняет токены и проверяет доступ без токена (`401`) и с ролью покупателя (`403`).

## Лабораторная 8: тесты, Git workflow и CI

### Запуск тестов API

Тесты используют **отдельную** базу с точным именем `agromarket_test`. Не указывайте адрес рабочей базы: тестовый setup удаляет и заново создаёт таблицы в `agromarket_test` перед каждым запуском.

1. Создайте пустую базу `agromarket_test`. Для PostgreSQL из Docker Compose выполните из корня проекта:

   ```powershell
   docker compose up -d db
   docker compose exec db psql -U agromarket -d agromarket -c "CREATE DATABASE agromarket_test"
   ```

   Если база уже существует, шаг с `CREATE DATABASE` пропустите.

2. Подготовьте настройки тестовой базы:

   ```powershell
   Copy-Item agromarket-server\.env.test.example agromarket-server\.env.test
   cd agromarket-server
   npm ci
   ```

   `.env.test` содержит отдельные тестовые значения и исключён из Git. Тесты прекратят запуск с явной ошибкой, если база отсутствует, секрет слишком короткий или имя базы не `agromarket_test`.

3. Запустите тесты и покрытие:

   ```powershell
   npm test
   npm run coverage
   ```

   Каждый запуск сбрасывает только тестовую схему, подготавливает demo-каталог и отдельного тестового администратора. Набор проверяет health endpoint, поиск и каталог, регистрацию, нижний регистр e-mail, защиту от присвоения роли, вход, дубликаты (`409`), профиль и смену пароля, доступы `401`/`403`, CRUD товара, создание и просмотр своих заявок, смену их статусов и JWT middleware. Для unit-тестов middleware используются mock-объекты; интеграционные тесты обращаются к Express-приложению через Supertest и проверяют работу маршрутов с PostgreSQL.

Unit-only прогон middleware (`npm run coverage:unit`) даёт фактическое покрытие **Lines: 100%**; это значение не является покрытием всего API. Полный процент строк необходимо записать из `npm run coverage`, который требует работающей базы `agromarket_test`; интеграционное покрытие пока не удалось измерить в окружении без PostgreSQL. `middleware/logger.js` вызывается на ответах запросов, однако не входит в измеряемый набор coverage — конфигурация включает маршруты и `middleware/auth.js`.

### Непрерывная интеграция

GitHub Actions запускает `.github/workflows/ci.yml` при Pull Request в `main` и при push в `main`: на чистой Ubuntu поднимается PostgreSQL 16, устанавливаются зависимости через `npm ci`, проходят API-тесты, затем собирается React-приложение. Отдельный `.github/workflows/react-ci.yml` запускает в клиентском приложении `npm ci`, ESLint и production-сборку. Тестовые учётные данные workflow предназначены только для временной базы CI.

### Git workflow и code review

Работайте в отдельной ветке и используйте Conventional Commits:

```text
git switch -c feature/api-tests
git status
git add .
git commit -m "test: add API integration coverage"
git push -u origin feature/api-tests
```

Далее откройте Pull Request `feature/api-tests` → `main`, дождитесь зелёного CI и независимого code review. Для обязательного PR и одного approval включите в настройках GitHub репозитория **Settings → Branches → Add branch protection rule** для `main`: включите **Require a pull request before merging** и **Require approvals: 1**; при необходимости отметьте **Require status checks to pass before merging** и выберите CI job `test`. Эти настройки применяются на GitHub, а не файлами в локальном проекте.

Шаблон PR находится в `.github/pull_request_template.md`. CI также проверяет production-сборку клиентского React-приложения.

### Ответы по заданию

- Если убрать защиту `adminOnly`, тесты создания/изменения/удаления товара без JWT или с токеном пользователя перестанут получать ожидаемые `401`/`403`; проверки доступа к заявкам обнаружат аналогичное нарушение.
- Unit-тест вызывает middleware отдельно с mock-объектами `req`/`res` и изолированно проверяет логику. Интеграционный тест проходит через настоящий HTTP-роут Express, middleware, запросы PostgreSQL и проверяет итоговый ответ API.
- Тест удаления пользователя после выдачи JWT проходит ветку `404` в `/auth/me` и смене пароля: действительная подпись ещё не означает, что запись пользователя существует. `npm run coverage` покажет другие конкретные непокрытые строки по результатам полного API-прогона.
- Покрытие `logger.js` намеренно не включено в метрику: это технический middleware логирования, а целевое покрытие лабораторной — маршруты и авторизация. Поэтому `0%` по logger не является признаком сбоя тестов.
- Тестовое имя БД проверяется до выполнения SQL со сбросом схемы; рабочую базу приложение не должно очищать тестами.
- React читает адрес API из `VITE_API_URL` (см. `agromarket-react/.env.example`); для production адрес задаётся переменной окружения сборки, секреты в `VITE_*` помещать нельзя.

## Ответы на контрольные вопросы

1. **Почему пароль хранится как хэш, а не как текст или обратимое шифрование?** При утечке базы хэш не раскрывает исходный пароль. bcrypt добавляет соль и намеренно замедляет перебор; при входе сервер сравнивает пароль с хэшем через `bcrypt.compare`.
2. **Из чего состоит JWT и можно ли скрыть его содержимое?** JWT состоит из заголовка, payload и подписи. Payload обычно можно прочитать, поэтому в него нельзя помещать пароль или секреты. Подпись позволяет серверу обнаружить изменение claims; без ключа нельзя легитимно изменить роль.
3. **Что произойдёт при утечке `JWT_SECRET`?** Злоумышленник сможет подписывать токены от имени пользователей, в том числе администратора. Секрет нельзя публиковать; при утечке его нужно заменить, после чего ранее выданные токены перестанут проходить проверку.
4. **Где клиент хранит токен и как выполняет выход?** Учебный клиент хранит токен в `localStorage`, передаёт его как Bearer-токен и удаляет при выходе. `localStorage` доступен JavaScript, поэтому XSS может привести к краже токена; для production предпочтительнее продуманная схема с `HttpOnly`, `Secure`, `SameSite` cookie и защитой от CSRF.
5. **Почему недостаточно скрыть форму администратора в React?** Клиент полностью контролируется пользователем. Проверки `requireAuth` и `requireRole('admin')` на сервере защищают сами API-операции, даже если запрос отправлен вручную.
6. **Чем отличаются `401` и `403`?** `401` — не предоставлена действительная аутентификация; `403` — аутентификация есть, но доступ запрещён ролью.

## Перед публикацией на GitHub

- Не добавляйте `.env`, пароли, production-секреты, токены или дамп базы. `.gitignore` уже исключает локальные env-файлы и зависимости.
- Замените все локальные значения секретов и используйте отдельные переменные окружения на хостинге.
- После публикации настройте production `DATABASE_URL`, случайный `JWT_SECRET`, `ADMIN_PASSWORD`, `CORS_ORIGIN` и `VITE_API_URL`. У `VITE_API_URL` не должно быть секретов: переменные Vite видны браузеру.
- Для production используйте HTTPS, резервное копирование PostgreSQL и хранение JWT в соответствии с моделью угроз проекта.

Проект подготовлен локально. Создание удалённого GitHub-репозитория и публикация в нём не выполняются автоматически.
