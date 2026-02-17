# Spiritual Backend (Python/FastAPI)

Este backend complementa la PWA proporcionando análisis avanzado, base de datos de entidades y scraping de datos.

## Estructura

- `app/main.py`: Punto de entrada de la aplicación FastAPI.
- `app/database/`: Configuración de SQLite y modelos SQLAlchemy.
- `app/routers/`: Definición de endpoints API (e.g., `/entities`).
- `app/scrapers/`: Scripts para recolectar datos (actualmente seed de entidades).

## Cómo Iniciar

### 1. Preparar el Entorno (Solo primera vez)
Abre una terminal en la carpeta `backend` y ejecuta:

```bash
# Crear entorno virtual
python3 -m venv venv

# Activar entorno (Linux/Mac)
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 2. Ejecutar el Servidor
Con el entorno activado:

```bash
uvicorn app.main:app --reload
```

El servidor iniciará en `http://localhost:8000`.

### 3. Verificar
Abre tu navegador en `http://localhost:8000/docs` para ver la documentación interactiva de la API (Swagger UI).
Deberías ver el endpoint `GET /entities` que lista las entidades cargadas automáticamente.
