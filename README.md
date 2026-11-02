# Music Player (modelo inicial)

Player de músicas (somente áudio) em **arquitetura MVC** com Node.js + Express no backend, EJS + Bootstrap 5 no frontend e MySQL como banco.

## Requisitos

- Node.js 18+
- MySQL 8+

## Como rodar

```bash
npm install
cp .env.example .env      # ajuste usuário/senha do MySQL
npm run db:init           # cria o banco "music_player" e as tabelas
npm run db:seed           # gêneros, artista padrão e uma playlist de exemplo
npm run dev               # http://localhost:3000
```

Outros scripts:

| Script             | O que faz                                              |
|--------------------|--------------------------------------------------------|
| `npm run db:reset` | **apaga** o banco e recria (drop + schema + seed)      |
| `npm start`        | inicia sem watch                                       |

Os arquivos `database/*.sql` também podem ser executados direto no MySQL:

```bash
mysql -u root -p < database/01_schema.sql
mysql -u root -p < database/02_seed.sql
```

> O nome do banco (`music_player`) está fixo nos `.sql`. Se mudar `DB_NAME` no `.env`, altere-o nos scripts também.

## Estrutura

```
server.js                  # ponto de entrada
scripts/db.js              # executor dos scripts SQL (init/seed/reset)
database/                  # 00_drop.sql, 01_schema.sql, 02_seed.sql
public/                    # css, js (player.js), img (capa padrão)
uploads/                   # áudios e capas enviados (audio/, covers/)
src/
  app.js                   # configuração do Express
  config/                  # pool MySQL, pastas de upload
  models/                  # Model   -> Track, Artist, Album, Genre, Playlist
  controllers/             # Controller -> trackController, playlistController
  views/                   # View    -> EJS + Bootstrap
  routes/                  # mapeamento de rotas
  middlewares/             # upload (multer), tratamento de erros
  services/                # leitura de metadados do áudio (ID3 etc.)
  utils/
```

## Modelo de dados (genérico)

- `artists` 1—N `albums`, `artists` 1—N `tracks`
- `albums` 1—N `tracks`, `genres` 1—N `tracks`
- `playlists` N—N `tracks` via `playlist_tracks` (com `position`)

## Capa da faixa

A imagem estática exibida no player vem do banco, nesta ordem:

1. `tracks.cover_path` — capa enviada no formulário **ou** extraída da capa embutida no arquivo de áudio
2. `albums.cover_path` — capa do álbum
3. `public/img/default-cover.svg`

Servida em `GET /tracks/:id/cover`.

## Rotas

| Método | Rota                                       | Descrição                          |
|--------|--------------------------------------------|------------------------------------|
| GET    | `/`                                        | biblioteca (busca com `?q=`)       |
| GET    | `/tracks/new`                              | formulário de upload               |
| POST   | `/tracks`                                  | cria faixa (multipart: `audio`, `cover`) |
| POST   | `/tracks/:id/delete`                       | exclui faixa e arquivos            |
| GET    | `/tracks/:id/stream`                       | stream do áudio (suporta `Range`)  |
| GET    | `/tracks/:id/cover`                        | imagem de capa                     |
| GET    | `/playlists`                               | lista playlists                    |
| POST   | `/playlists`                               | cria playlist                      |
| GET    | `/playlists/:id`                           | detalhes da playlist               |
| POST   | `/playlists/:id/delete`                    | exclui playlist                    |
| POST   | `/playlists/:id/tracks`                    | adiciona faixa (`track_id`)        |
| POST   | `/playlists/:id/tracks/:trackId/delete`    | remove faixa da playlist           |
| GET    | `/api/tracks`, `/api/tracks/:id`           | JSON                               |
| POST   | `/api/tracks/:id/play`                     | incrementa contador de reproduções |

## Atalhos do player

- `Espaço` tocar/pausar · `Shift + →` próxima · `Shift + ←` anterior
- Duplo clique numa faixa para tocar
