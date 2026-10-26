# Backend sugerido (Node + MySQL)

Interfaz que debe cumplir `src/services/*`:
- `get()` → `{ builds:[{id,by,name,model,paint,parts,acc,designs,updatedAt}], likes:{ [userId]:{ [buildId]:true } }, me, ready }`
- `subscribe(fn)` → llama `fn` cuando cambian los datos (polling o websocket); devuelve función para desuscribir
- `publish(doc)`, `toggleLike(buildId)`, `profiles(ids)` → `{ [id]:{ name, isMe } }`

Endpoints: `GET /api/builds`, `POST /api/builds`, `POST /api/builds/:id/like`, `GET /api/profiles?ids=`.

```sql
CREATE TABLE users  (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(60) NOT NULL);
CREATE TABLE builds (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(40), model VARCHAR(60),
  data JSON, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE likes  (user_id INT, build_id INT, PRIMARY KEY (user_id, build_id));
```
