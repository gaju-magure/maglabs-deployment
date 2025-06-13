from django.core.management.base import BaseCommand
from apps.ideas.models import ChatTemplate


class Command(BaseCommand):
    help = 'Populate sample chat templates for better user experience'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'New Product Feature Brainstorm',
                'description': 'Brainstorm innovative features for existing products or services',
                'conversation_type': 'brainstorm',
                'initial_prompt': "I'd like to brainstorm new features for our product/service. Can you help me explore creative ideas that could improve user experience or add value?",
                'system_prompt_override': 'You are a creative product strategist helping brainstorm innovative features. Ask probing questions about user needs, market gaps, and technical possibilities. Encourage wild ideas before refining them.'
            },
            {
                'name': 'Process Improvement Ideas',
                'description': 'Generate ideas to streamline and improve existing workflows',
                'conversation_type': 'problem_solving',
                'initial_prompt': "I want to improve our current processes and workflows. Can you help me identify inefficiencies and brainstorm solutions?",
                'system_prompt_override': 'You are a process optimization expert. Help identify bottlenecks, redundancies, and areas for automation. Focus on practical, implementable improvements.'
            },
            {
                'name': 'Customer Experience Enhancement',
                'description': 'Develop ideas to improve customer satisfaction and engagement',
                'conversation_type': 'brainstorm',
                'initial_prompt': "How can we enhance our customer experience? I'd like to explore ideas that make our customers happier and more engaged.",
                'system_prompt_override': 'You are a customer experience specialist. Focus on understanding customer pain points, expectations, and opportunities for delight. Consider the entire customer journey.'
            },
            {
                'name': 'Cost Reduction Strategies',
                'description': 'Identify opportunities to reduce costs without compromising quality',
                'conversation_type': 'problem_solving',
                'initial_prompt': "I need to find ways to reduce costs in our operations. Can you help me identify areas where we might be overspending or inefficient?",
                'system_prompt_override': 'You are a financial optimization consultant. Help identify cost-saving opportunities while maintaining quality and employee satisfaction. Consider both short-term and long-term strategies.'
            },
            {
                'name': 'Technology Innovation Ideas',
                'description': 'Explore how emerging technologies could benefit the organization',
                'conversation_type': 'brainstorm',
                'initial_prompt': "What emerging technologies could we leverage to stay competitive? I want to explore innovative tech solutions for our business.",
                'system_prompt_override': 'You are a technology innovation advisor. Stay current with emerging tech trends and help identify practical applications. Consider AI, automation, cloud services, and other relevant technologies.'
            },
            {
                'name': 'Team Collaboration Improvement',
                'description': 'Enhance teamwork and communication within the organization',
                'conversation_type': 'problem_solving',
                'initial_prompt': "How can we improve collaboration and communication within our team? I'm looking for practical ideas to enhance teamwork.",
                'system_prompt_override': 'You are an organizational development expert. Focus on communication tools, meeting efficiency, knowledge sharing, and team dynamics. Consider both remote and in-person collaboration.'
            },
            {
                'name': 'Marketing Campaign Ideas',
                'description': 'Develop creative marketing strategies and campaign concepts',
                'conversation_type': 'brainstorm',
                'initial_prompt': "I need fresh marketing ideas for our upcoming campaign. Can you help me brainstorm creative approaches to reach our target audience?",
                'system_prompt_override': 'You are a creative marketing strategist. Help develop campaigns that are both creative and data-driven. Consider various channels, messaging strategies, and audience segments.'
            },
            {
                'name': 'Employee Engagement Initiatives',
                'description': 'Create ideas to boost employee satisfaction and retention',
                'conversation_type': 'brainstorm',
                'initial_prompt': "What initiatives could we implement to improve employee engagement and satisfaction? I want to create a better workplace culture.",
                'system_prompt_override': 'You are an HR innovation specialist. Focus on employee wellbeing, professional development, recognition programs, and work-life balance. Consider diverse employee needs and preferences.'
            },
            {
                'name': 'Sustainability and Green Initiatives',
                'description': 'Develop environmentally friendly business practices',
                'conversation_type': 'brainstorm',
                'initial_prompt': "How can we make our organization more sustainable and environmentally friendly? I'm looking for practical green initiatives we could implement.",
                'system_prompt_override': 'You are a sustainability consultant. Help identify eco-friendly practices that also make business sense. Consider energy efficiency, waste reduction, and sustainable sourcing.'
            },
            {
                'name': 'Digital Transformation Ideas',
                'description': 'Modernize business processes through digital solutions',
                'conversation_type': 'feature_design',
                'initial_prompt': "We need to digitally transform our business processes. Can you help me identify areas where digital solutions could make the biggest impact?",
                'system_prompt_override': 'You are a digital transformation consultant. Focus on practical digitization opportunities that improve efficiency and customer experience. Consider automation, data analytics, and digital tools.'
            },
            {
                'name': 'Idea Refinement Session',
                'description': 'Polish and develop an existing idea into a concrete proposal',
                'conversation_type': 'refine',
                'initial_prompt': "I have a rough idea that I'd like to develop further. Can you help me refine it and turn it into a more detailed, actionable proposal?",
                'system_prompt_override': 'You are an idea development specialist. Help structure rough concepts into clear, actionable proposals. Focus on feasibility, implementation steps, and potential challenges.'
            },
            {
                'name': 'Competitive Analysis Discussion',
                'description': 'Analyze competitive landscape and identify opportunities',
                'conversation_type': 'problem_solving',
                'initial_prompt': "I want to better understand our competitive position and identify opportunities to differentiate ourselves. Can you help me think through this strategically?",
                'system_prompt_override': 'You are a competitive strategy analyst. Help identify competitive advantages, market gaps, and differentiation opportunities. Focus on actionable insights and strategic positioning.'
            }
        ]

        created_count = 0
        for template_data in templates:
            template, created = ChatTemplate.objects.get_or_create(
                name=template_data['name'],
                defaults=template_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created template: {template.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Template already exists: {template.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new chat templates')
        )