"""
Domain configuration for different environments

Handles the mapping between:
- Internal API domains (for django-tenants routing)
- User-facing domains (for frontend access)
- Email invitation URLs
"""

from django.conf import settings
import os


class DomainConfig:
    """Domain configuration based on environment"""
    
    def __init__(self):
        self.env = getattr(settings, 'DJANGO_ENV', 'dev')
        self.debug = getattr(settings, 'DEBUG', True)
        
        # Domain configurations per environment
        self.configs = {
            'dev': {
                'api_domain': 'maglabs.api',
                'user_domain': 'maglabs.local',
                'ai_domain': 'ai.maglabs.local',
                'frontend_port': None,
                'api_port': None,
                'protocol': 'http',
                'cors_origins': [
                    'http://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://localhost:8080',
                    'http://127.0.0.1:8080',
                    'http://*.maglabs.local'
                ]
            },
            'prod': {
                'api_domain': os.environ.get('PROD_API_DOMAIN', 'yourdomain-api.com'),
                'user_domain': os.environ.get('PROD_USER_DOMAIN', 'yourdomain.com'),
                'ai_domain': os.environ.get('PROD_AI_DOMAIN', 'ai-api.yourdomain.com'),
                'frontend_port': None,
                'api_port': None,
                'protocol': 'https',
                'cors_origins': [
                    f"https://*.{os.environ.get('PROD_USER_DOMAIN', 'yourdomain.com')}",
                    f"https://{os.environ.get('PROD_USER_DOMAIN', 'yourdomain.com')}"
                ]
            },
            'staging': {
                'api_domain': os.environ.get('STAGING_API_DOMAIN', 'staging-api.yourdomain.com'),
                'user_domain': os.environ.get('STAGING_USER_DOMAIN', 'staging.yourdomain.com'),
                'ai_domain': os.environ.get('STAGING_AI_DOMAIN', 'ai-api.staging.yourdomain.com'),
                'frontend_port': None,
                'api_port': None,
                'protocol': 'https',
                'cors_origins': [
                    f"https://*.{os.environ.get('STAGING_USER_DOMAIN', 'staging.yourdomain.com')}",
                    f"https://{os.environ.get('STAGING_USER_DOMAIN', 'staging.yourdomain.com')}"
                ]
            }
        }
    
    @property
    def current_config(self):
        """Get current environment configuration"""
        return self.configs.get(self.env, self.configs['dev'])
    
    def get_api_domain(self, tenant_schema=None):
        """Get API domain (for django-tenants internal routing)"""
        config = self.current_config
        base_domain = config['api_domain']
        
        if tenant_schema:
            return f"{tenant_schema}.{base_domain}"
        return base_domain
    
    def get_user_domain(self, tenant_schema=None):
        """Get user-facing domain (for frontend access)"""
        config = self.current_config
        base_domain = config['user_domain']
        
        if tenant_schema:
            return f"{tenant_schema}.{base_domain}"
        return base_domain
    
    def get_ai_domain(self):
        """Get AI service domain"""
        config = self.current_config
        return config.get('ai_domain', 'ai-api.yourdomain.com')
    
    def get_frontend_url(self, tenant_schema, path=''):
        """Generate frontend URL for user access"""
        config = self.current_config
        protocol = config['protocol']
        domain = self.get_user_domain(tenant_schema)
        port = f":{config['frontend_port']}" if config['frontend_port'] else ''
        
        path = path.lstrip('/')
        if path:
            path = f"/{path}"
        
        return f"{protocol}://{domain}{port}{path}"
    
    def get_api_url(self, tenant_schema=None, path=''):
        """Generate API URL"""
        config = self.current_config
        protocol = config['protocol']
        
        if tenant_schema:
            domain = self.get_api_domain(tenant_schema)
        else:
            domain = self.get_api_domain()
        
        port = f":{config['api_port']}" if config['api_port'] else ''
        
        path = path.lstrip('/')
        if path:
            path = f"/{path}"
        
        return f"{protocol}://{domain}{port}{path}"
    
    def get_onboarding_url(self, tenant_schema, token):
        """Generate onboarding URL for email invitations"""
        return self.get_frontend_url(tenant_schema, f"onboarding/{token}")
    
    def get_dashboard_url(self, tenant_schema):
        """Generate dashboard URL"""
        return self.get_frontend_url(tenant_schema, "dashboard")
    
    def get_cors_origins(self):
        """Get CORS origins for current environment"""
        return self.current_config['cors_origins']
    
    def is_valid_tenant_domain(self, domain):
        """Check if domain matches expected tenant pattern"""
        config = self.current_config
        api_domain = config['api_domain']
        user_domain = config['user_domain']
        
        # Check both API and user domain patterns
        return (
            domain.endswith(f".{api_domain}") or
            domain.endswith(f".{user_domain}")
        )
    
    def extract_tenant_schema(self, domain):
        """Extract tenant schema from domain"""
        config = self.current_config
        api_domain = config['api_domain']
        user_domain = config['user_domain']
        
        if domain.endswith(f".{api_domain}"):
            return domain.replace(f".{api_domain}", "")
        elif domain.endswith(f".{user_domain}"):
            return domain.replace(f".{user_domain}", "")
        
        return None
    
    def get_environment_info(self):
        """Get current environment information"""
        config = self.current_config
        return {
            'environment': self.env,
            'debug': self.debug,
            'api_domain': config['api_domain'],
            'user_domain': config['user_domain'],
            'protocol': config['protocol'],
            'frontend_port': config['frontend_port'],
            'api_port': config['api_port']
        }


# Global instance
domain_config = DomainConfig()


# Convenience functions
def get_onboarding_url(tenant_schema, token):
    """Generate onboarding URL for tenant"""
    return domain_config.get_onboarding_url(tenant_schema, token)


def get_dashboard_url(tenant_schema):
    """Generate dashboard URL for tenant"""
    return domain_config.get_dashboard_url(tenant_schema)


def get_user_domain(tenant_schema):
    """Get user-facing domain for tenant"""
    return domain_config.get_user_domain(tenant_schema)


def get_api_domain(tenant_schema):
    """Get API domain for tenant"""
    return domain_config.get_api_domain(tenant_schema)


def get_frontend_url(tenant_schema, path=''):
    """Generate frontend URL for tenant"""
    return domain_config.get_frontend_url(tenant_schema, path)