from django.core.management.base import BaseCommand
from apps.ideas.models import ChatTemplate


class Command(BaseCommand):
    help = 'Creates default chat templates'

    def handle(self, *args, **options):
        # Since conversation_type field still exists in DB, let's work around it
        from django.db import connection
        
        # Check if conversation_type column exists
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='ideas_chattemplate' AND column_name='conversation_type'
            """)
            has_conversation_type = cursor.fetchone() is not None
            
        templates = [
            {
                'name': 'New Product Feature',
                'description': 'Brainstorm innovative features for existing products or services',
                'initial_prompt': "I'd like to brainstorm new features for our product/service. Can you help me explore creative ideas that could improve user experience or add value?",
                'conversation_type': 'brainstorm' if has_conversation_type else None,
            },
            {
                'name': 'Process Improvement',
                'description': 'Generate ideas to streamline and improve existing workflows',
                'initial_prompt': "I want to improve our current processes and workflows. Can you help me identify inefficiencies and brainstorm solutions?",
                'conversation_type': 'problem_solving' if has_conversation_type else None,
            },
            {
                'name': 'Customer Experience',
                'description': 'Develop ideas to improve customer satisfaction and engagement',
                'initial_prompt': "How can we enhance our customer experience? I'd like to explore ideas that make our customers happier and more engaged.",
                'conversation_type': 'brainstorm' if has_conversation_type else None,
            },
            {
                'name': 'Cost Reduction',
                'description': 'Identify opportunities to reduce costs without compromising quality',
                'initial_prompt': "I need to find ways to reduce costs in our operations. Can you help me identify areas where we might be overspending or inefficient?",
                'conversation_type': 'problem_solving' if has_conversation_type else None,
            },
            {
                'name': 'Technology Innovation',
                'description': 'Explore how emerging technologies could benefit the organization',
                'initial_prompt': "What emerging technologies could we leverage to stay competitive? I want to explore innovative tech solutions for our business.",
                'conversation_type': 'feature_design' if has_conversation_type else None,
            },
            {
                'name': 'General Discussion',
                'description': 'Open-ended conversation about any topic',
                'initial_prompt': "",
                'conversation_type': 'brainstorm' if has_conversation_type else None,
            },
        ]

        created_count = 0
        for template_data in templates:
            defaults = {
                'description': template_data['description'],
                'initial_prompt': template_data['initial_prompt'],
                'is_active': True,
            }
            
            # Add conversation_type if column exists
            if has_conversation_type and template_data.get('conversation_type'):
                defaults['conversation_type'] = template_data['conversation_type']
                
            template, created = ChatTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=defaults
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created template: {template.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Template already exists: {template.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nTotal templates created: {created_count}'))