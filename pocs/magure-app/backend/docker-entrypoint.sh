#!/bin/bash
set -e

# Wait for database to be ready
wait_for_db() {
    echo "Waiting for database to be ready..."
    while ! python manage.py dbshell --command="SELECT 1;" > /dev/null 2>&1; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    echo "Database is ready!"
}

# Run migrations
run_migrations() {
    echo "Running migrations..."
    python manage.py migrate_schemas --shared
    python manage.py migrate_schemas
    echo "Migrations completed!"
}

# Create superuser if it doesn't exist
create_superuser() {
    echo "Creating superuser if needed..."
    python manage.py shell << EOF
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()
try:
    if not User.objects.filter(is_superuser=True).exists():
        User.objects.create_superuser(
            email='admin@maglabs.com',
            password='admin123',
            name='Admin User'
        )
        print("Superuser created!")
    else:
        print("Superuser already exists!")
except IntegrityError:
    print("Superuser creation failed - user may already exist")
EOF
}

# Load fixtures if in development
load_fixtures() {
    if [ "$DJANGO_SETTINGS_MODULE" = "config.settings.development" ]; then
        echo "Loading development fixtures..."
        python manage.py loaddata fixtures/departments.json || echo "Department fixtures not found"
        python manage.py loaddata fixtures/chat_templates.json || echo "Chat template fixtures not found"
        echo "Fixtures loaded!"
    fi
}

# Collect static files in production
collect_static() {
    if [ "$DJANGO_SETTINGS_MODULE" = "config.settings.production" ]; then
        echo "Collecting static files..."
        python manage.py collectstatic --noinput
        echo "Static files collected!"
    fi
}

# Bootstrap the application
bootstrap() {
    wait_for_db
    run_migrations
    create_superuser
    load_fixtures
    collect_static
}

# Main execution
main() {
    case "$1" in
        bootstrap)
            bootstrap
            ;;
        migrate)
            wait_for_db
            run_migrations
            ;;
        createsuperuser)
            wait_for_db
            create_superuser
            ;;
        collectstatic)
            collect_static
            ;;
        *)
            bootstrap
            exec "$@"
            ;;
    esac
}

# Run main function with all arguments
main "$@"