#!/bin/bash
set -e

echo "🚀 Starting Django server..."

# Wait for database using Python (no psql dependency)
echo "⏳ Waiting for database..."
while ! python -c "
import psycopg2
import os
try:
    psycopg2.connect(
        host='postgres',
        port=5432,
        database=os.environ.get('POSTGRES_DB', 'maglabs'),
        user=os.environ.get('POSTGRES_USER', 'maglabs'),
        password=os.environ.get('POSTGRES_PASSWORD', 'maglabs123')
    )
    print('✅ Database connected')
except:
    exit(1)
" 2>/dev/null; do
    echo "Database is not ready yet. Waiting..."
    sleep 2
done

# Run migrations
echo "🗃️ Running database migrations..."
python manage.py migrate

# Create superuser if none exists
echo "👤 Creating superuser if needed..."
python manage.py shell << 'EOF'
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@localhost', 'admin123')
    print("✅ Created superuser: admin/admin123")
else:
    print("ℹ️ Superuser already exists")
EOF

# Collect static files
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput || echo "⚠️ Static collection failed, continuing..."

# Start server
echo "🏃 Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000