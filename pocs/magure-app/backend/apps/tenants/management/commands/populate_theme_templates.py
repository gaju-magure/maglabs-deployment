"""
Management command to populate default theme templates
"""

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.tenants.branding_models import DefaultThemeTemplate


class Command(BaseCommand):
    help = 'Populate default theme templates for tenant branding'

    def handle(self, *args, **options):
        self.stdout.write('Creating default theme templates...')
        
        templates = [
            {
                'name': 'Corporate Blue',
                'category': 'business',
                'description': 'Professional blue theme perfect for corporate and business environments',
                'industries': ['finance', 'consulting', 'general'],
                'is_default': True,
                'config': {
                    'primary_colors': {
                        '50': '#eff6ff',
                        '100': '#dbeafe',
                        '200': '#bfdbfe',
                        '300': '#93c5fd',
                        '400': '#60a5fa',
                        '500': '#3b82f6',  # Main primary
                        '600': '#2563eb',
                        '700': '#1d4ed8',
                        '800': '#1e40af',
                        '900': '#1e3a8a',
                    },
                    'secondary_colors': {
                        '200': '#e2e8f0',
                        '500': '#64748b',
                        '800': '#334155',
                    },
                    'accent_colors': {
                        'success': '#10b981',
                        'warning': '#f59e0b',
                        'error': '#ef4444',
                        'info': '#3b82f6',
                    },
                    'neutral_palette': {
                        '50': '#f8fafc',
                        '100': '#f1f5f9',
                        '200': '#e2e8f0',
                        '300': '#cbd5e1',
                        '400': '#94a3b8',
                        '500': '#64748b',
                        '600': '#475569',
                        '700': '#334155',
                        '800': '#1e293b',
                        '900': '#0f172a',
                    },
                    'font_config': {
                        'primary': 'Inter, sans-serif',
                        'secondary': 'Inter, sans-serif',
                        'mono': 'JetBrains Mono, monospace',
                    },
                    'font_sizes': {
                        'xs': '0.75rem',
                        'sm': '0.875rem',
                        'base': '1rem',
                        'lg': '1.125rem',
                        'xl': '1.25rem',
                        '2xl': '1.5rem',
                        '3xl': '1.875rem',
                        '4xl': '2.25rem',
                    },
                    'spacing_scale': {
                        'xs': '0.25rem',
                        'sm': '0.5rem',
                        'md': '1rem',
                        'lg': '1.5rem',
                        'xl': '2rem',
                        '2xl': '3rem',
                    },
                    'border_radius': {
                        'sm': '0.125rem',
                        'md': '0.375rem',
                        'lg': '0.5rem',
                        'xl': '0.75rem',
                        'full': '9999px',
                    },
                }
            },
            {
                'name': 'Modern Purple',
                'category': 'creative',
                'description': 'Creative and modern purple theme for innovative companies',
                'industries': ['technology', 'creative', 'general'],
                'is_default': False,
                'config': {
                    'primary_colors': {
                        '50': '#faf5ff',
                        '100': '#f3e8ff',
                        '200': '#e9d5ff',
                        '300': '#d8b4fe',
                        '400': '#c084fc',
                        '500': '#a855f7',  # Main primary
                        '600': '#9333ea',
                        '700': '#7c3aed',
                        '800': '#6b21a8',
                        '900': '#581c87',
                    },
                    'secondary_colors': {
                        '200': '#fecaca',
                        '500': '#f87171',
                        '800': '#dc2626',
                    },
                    'accent_colors': {
                        'success': '#10b981',
                        'warning': '#f59e0b',
                        'error': '#ef4444',
                        'info': '#a855f7',
                    },
                    'neutral_palette': {
                        '50': '#fafafa',
                        '100': '#f4f4f5',
                        '200': '#e4e4e7',
                        '300': '#d4d4d8',
                        '400': '#a1a1aa',
                        '500': '#71717a',
                        '600': '#52525b',
                        '700': '#3f3f46',
                        '800': '#27272a',
                        '900': '#18181b',
                    },
                    'font_config': {
                        'primary': 'Poppins, sans-serif',
                        'secondary': 'Inter, sans-serif',
                        'mono': 'Fira Code, monospace',
                    },
                    'font_sizes': {
                        'xs': '0.75rem',
                        'sm': '0.875rem',
                        'base': '1rem',
                        'lg': '1.125rem',
                        'xl': '1.25rem',
                        '2xl': '1.5rem',
                        '3xl': '1.875rem',
                        '4xl': '2.25rem',
                    },
                    'spacing_scale': {
                        'xs': '0.25rem',
                        'sm': '0.5rem',
                        'md': '1rem',
                        'lg': '1.5rem',
                        'xl': '2rem',
                        '2xl': '3rem',
                    },
                    'border_radius': {
                        'sm': '0.25rem',
                        'md': '0.5rem',
                        'lg': '0.75rem',
                        'xl': '1rem',
                        'full': '9999px',
                    },
                }
            },
            {
                'name': 'Healthcare Clean',
                'category': 'industry',
                'description': 'Clean and trustworthy theme designed for healthcare organizations',
                'industries': ['healthcare'],
                'is_default': False,
                'config': {
                    'primary_colors': {
                        '50': '#ecfdf5',
                        '100': '#d1fae5',
                        '200': '#a7f3d0',
                        '300': '#6ee7b7',
                        '400': '#34d399',
                        '500': '#10b981',  # Main primary
                        '600': '#059669',
                        '700': '#047857',
                        '800': '#065f46',
                        '900': '#064e3b',
                    },
                    'secondary_colors': {
                        '200': '#ddd6fe',
                        '500': '#8b5cf6',
                        '800': '#5b21b6',
                    },
                    'accent_colors': {
                        'success': '#10b981',
                        'warning': '#f59e0b',
                        'error': '#ef4444',
                        'info': '#3b82f6',
                    },
                    'neutral_palette': {
                        '50': '#f9fafb',
                        '100': '#f3f4f6',
                        '200': '#e5e7eb',
                        '300': '#d1d5db',
                        '400': '#9ca3af',
                        '500': '#6b7280',
                        '600': '#4b5563',
                        '700': '#374151',
                        '800': '#1f2937',
                        '900': '#111827',
                    },
                    'font_config': {
                        'primary': 'Source Sans Pro, sans-serif',
                        'secondary': 'Source Sans Pro, sans-serif',
                        'mono': 'Source Code Pro, monospace',
                    },
                    'font_sizes': {
                        'xs': '0.75rem',
                        'sm': '0.875rem',
                        'base': '1rem',
                        'lg': '1.125rem',
                        'xl': '1.25rem',
                        '2xl': '1.5rem',
                        '3xl': '1.875rem',
                        '4xl': '2.25rem',
                    },
                    'spacing_scale': {
                        'xs': '0.25rem',
                        'sm': '0.5rem',
                        'md': '1rem',
                        'lg': '1.5rem',
                        'xl': '2rem',
                        '2xl': '3rem',
                    },
                    'border_radius': {
                        'sm': '0.125rem',
                        'md': '0.25rem',
                        'lg': '0.5rem',
                        'xl': '0.75rem',
                        'full': '9999px',
                    },
                }
            },
            {
                'name': 'Tech Innovation',
                'category': 'industry',
                'description': 'Bold and innovative theme perfect for technology companies',
                'industries': ['technology'],
                'is_default': False,
                'config': {
                    'primary_colors': {
                        '50': '#eff6ff',
                        '100': '#dbeafe',
                        '200': '#bfdbfe',
                        '300': '#93c5fd',
                        '400': '#60a5fa',
                        '500': '#3b82f6',  # Main primary
                        '600': '#2563eb',
                        '700': '#1d4ed8',
                        '800': '#1e40af',
                        '900': '#1e3a8a',
                    },
                    'secondary_colors': {
                        '200': '#fed7aa',
                        '500': '#fb923c',
                        '800': '#ea580c',
                    },
                    'accent_colors': {
                        'success': '#10b981',
                        'warning': '#f59e0b',
                        'error': '#ef4444',
                        'info': '#06b6d4',
                    },
                    'neutral_palette': {
                        '50': '#f8fafc',
                        '100': '#f1f5f9',
                        '200': '#e2e8f0',
                        '300': '#cbd5e1',
                        '400': '#94a3b8',
                        '500': '#64748b',
                        '600': '#475569',
                        '700': '#334155',
                        '800': '#1e293b',
                        '900': '#0f172a',
                    },
                    'font_config': {
                        'primary': 'Roboto, sans-serif',
                        'secondary': 'Roboto, sans-serif',
                        'mono': 'Roboto Mono, monospace',
                    },
                    'font_sizes': {
                        'xs': '0.75rem',
                        'sm': '0.875rem',
                        'base': '1rem',
                        'lg': '1.125rem',
                        'xl': '1.25rem',
                        '2xl': '1.5rem',
                        '3xl': '1.875rem',
                        '4xl': '2.25rem',
                    },
                    'spacing_scale': {
                        'xs': '0.25rem',
                        'sm': '0.5rem',
                        'md': '1rem',
                        'lg': '1.5rem',
                        'xl': '2rem',
                        '2xl': '3rem',
                    },
                    'border_radius': {
                        'sm': '0.125rem',
                        'md': '0.375rem',
                        'lg': '0.5rem',
                        'xl': '0.75rem',
                        'full': '9999px',
                    },
                }
            },
            {
                'name': 'Minimalist Gray',
                'category': 'minimal',
                'description': 'Clean and minimal gray theme for focused, distraction-free interfaces',
                'industries': ['general', 'consulting', 'legal'],
                'is_default': False,
                'config': {
                    'primary_colors': {
                        '50': '#f9fafb',
                        '100': '#f3f4f6',
                        '200': '#e5e7eb',
                        '300': '#d1d5db',
                        '400': '#9ca3af',
                        '500': '#6b7280',  # Main primary
                        '600': '#4b5563',
                        '700': '#374151',
                        '800': '#1f2937',
                        '900': '#111827',
                    },
                    'secondary_colors': {
                        '200': '#e5e7eb',
                        '500': '#6b7280',
                        '800': '#1f2937',
                    },
                    'accent_colors': {
                        'success': '#059669',
                        'warning': '#d97706',
                        'error': '#dc2626',
                        'info': '#0284c7',
                    },
                    'neutral_palette': {
                        '50': '#f9fafb',
                        '100': '#f3f4f6',
                        '200': '#e5e7eb',
                        '300': '#d1d5db',
                        '400': '#9ca3af',
                        '500': '#6b7280',
                        '600': '#4b5563',
                        '700': '#374151',
                        '800': '#1f2937',
                        '900': '#111827',
                    },
                    'font_config': {
                        'primary': 'System, -apple-system, sans-serif',
                        'secondary': 'System, -apple-system, sans-serif',
                        'mono': 'SF Mono, Consolas, monospace',
                    },
                    'font_sizes': {
                        'xs': '0.75rem',
                        'sm': '0.875rem',
                        'base': '1rem',
                        'lg': '1.125rem',
                        'xl': '1.25rem',
                        '2xl': '1.5rem',
                        '3xl': '1.875rem',
                        '4xl': '2.25rem',
                    },
                    'spacing_scale': {
                        'xs': '0.25rem',
                        'sm': '0.5rem',
                        'md': '1rem',
                        'lg': '1.5rem',
                        'xl': '2rem',
                        '2xl': '3rem',
                    },
                    'border_radius': {
                        'sm': '0.125rem',
                        'md': '0.25rem',
                        'lg': '0.375rem',
                        'xl': '0.5rem',
                        'full': '9999px',
                    },
                }
            },
            {
                'name': 'Finance Navy',
                'category': 'business',
                'description': 'Professional navy theme conveying trust and stability for financial services',
                'industries': ['finance'],
                'is_default': False,
                'config': {
                    'primary_colors': {
                        '50': '#f0f9ff',
                        '100': '#e0f2fe',
                        '200': '#bae6fd',
                        '300': '#7dd3fc',
                        '400': '#38bdf8',
                        '500': '#0ea5e9',
                        '600': '#0284c7',
                        '700': '#0369a1',  # Main primary
                        '800': '#075985',
                        '900': '#0c4a6e',
                    },
                    'secondary_colors': {
                        '200': '#fecaca',
                        '500': '#ef4444',
                        '800': '#991b1b',
                    },
                    'accent_colors': {
                        'success': '#059669',
                        'warning': '#d97706',
                        'error': '#dc2626',
                        'info': '#0284c7',
                    },
                    'neutral_palette': {
                        '50': '#f8fafc',
                        '100': '#f1f5f9',
                        '200': '#e2e8f0',
                        '300': '#cbd5e1',
                        '400': '#94a3b8',
                        '500': '#64748b',
                        '600': '#475569',
                        '700': '#334155',
                        '800': '#1e293b',
                        '900': '#0f172a',
                    },
                    'font_config': {
                        'primary': 'Helvetica Neue, Arial, sans-serif',
                        'secondary': 'Helvetica Neue, Arial, sans-serif',
                        'mono': 'Monaco, Consolas, monospace',
                    },
                    'font_sizes': {
                        'xs': '0.75rem',
                        'sm': '0.875rem',
                        'base': '1rem',
                        'lg': '1.125rem',
                        'xl': '1.25rem',
                        '2xl': '1.5rem',
                        '3xl': '1.875rem',
                        '4xl': '2.25rem',
                    },
                    'spacing_scale': {
                        'xs': '0.25rem',
                        'sm': '0.5rem',
                        'md': '1rem',
                        'lg': '1.5rem',
                        'xl': '2rem',
                        '2xl': '3rem',
                    },
                    'border_radius': {
                        'sm': '0.125rem',
                        'md': '0.375rem',
                        'lg': '0.5rem',
                        'xl': '0.75rem',
                        'full': '9999px',
                    },
                }
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for template_data in templates:
            slug = slugify(template_data['name'])
            
            template, created = DefaultThemeTemplate.objects.get_or_create(
                template_slug=slug,
                defaults={
                    'template_name': template_data['name'],
                    'template_category': template_data['category'],
                    'template_description': template_data['description'],
                    'target_industries': template_data['industries'],
                    'is_default': template_data['is_default'],
                    'theme_configuration': template_data['config'],
                    'is_active': True,
                    'popularity_score': 10 if template_data['is_default'] else 0,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template_data["name"]}')
                )
            else:
                # Update existing template
                template.template_name = template_data['name']
                template.template_category = template_data['category']
                template.template_description = template_data['description']
                template.target_industries = template_data['industries']
                template.theme_configuration = template_data['config']
                template.is_active = True
                template.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Updated template: {template_data["name"]}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {created_count + updated_count} templates '
                f'({created_count} created, {updated_count} updated)'
            )
        )