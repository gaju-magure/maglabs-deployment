#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# Enable debugpy for VSCode debugging if DEBUGPY_ENABLE=1
if os.environ.get("DEBUGPY_ENABLE") == "1":
    import debugpy
    debugpy.listen(("0.0.0.0", 5678))
    print("debugpy is listening on 0.0.0.0:5678")


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
