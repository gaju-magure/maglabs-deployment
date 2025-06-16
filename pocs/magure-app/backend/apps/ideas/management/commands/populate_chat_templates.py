from django.core.management.base import BaseCommand
from apps.ideas.models import ChatTemplate


class Command(BaseCommand):
    help = 'Populate sample chat templates for better user experience'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'New Product Feature Brainstorm',
                'description': 'Brainstorm innovative features for existing products or services',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['solution_brainstorming', 'value_proposition'],
                'temperature': 0.9,
                'initial_prompt': "I'd like to brainstorm new features for our product/service. Can you help me explore creative ideas that could improve user experience or add value?",
                'conversation_goals': 'Generate creative, innovative product features through structured brainstorming'
            },
            {
                'name': 'Process Improvement Ideas',
                'description': 'Generate ideas to streamline and improve existing workflows',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['problem_capture', 'problem_clarification', 'solution_brainstorming'],
                'temperature': 0.7,
                'initial_prompt': "I want to improve our current processes and workflows. Can you help me identify inefficiencies and brainstorm solutions?",
                'conversation_goals': 'Identify process inefficiencies and develop practical improvement solutions'
            },
            {
                'name': 'Customer Experience Enhancement',
                'description': 'Develop ideas to improve customer satisfaction and engagement',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['user_profiling', 'problem_capture', 'solution_brainstorming'],
                'temperature': 0.8,
                'initial_prompt': "How can we enhance our customer experience? I'd like to explore ideas that make our customers happier and more engaged.",
                'conversation_goals': 'Enhance customer satisfaction through targeted experience improvements'
            },
            {
                'name': 'Cost Reduction Strategies',
                'description': 'Identify opportunities to reduce costs without compromising quality',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['problem_capture', 'problem_clarification', 'solution_brainstorming'],
                'temperature': 0.6,
                'initial_prompt': "I need to find ways to reduce costs in our operations. Can you help me identify areas where we might be overspending or inefficient?",
                'conversation_goals': 'Identify cost reduction opportunities while maintaining quality standards'
            },
            {
                'name': 'Technology Innovation Ideas',
                'description': 'Explore how emerging technologies could benefit the organization',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['solution_brainstorming', 'value_proposition'],
                'temperature': 0.9,
                'initial_prompt': "What emerging technologies could we leverage to stay competitive? I want to explore innovative tech solutions for our business.",
                'conversation_goals': 'Explore emerging technology applications for competitive advantage'
            },
            {
                'name': 'Team Collaboration Improvement',
                'description': 'Enhance teamwork and communication within the organization',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['problem_capture', 'solution_brainstorming'],
                'temperature': 0.7,
                'initial_prompt': "How can we improve collaboration and communication within our team? I'm looking for practical ideas to enhance teamwork.",
                'conversation_goals': 'Improve team collaboration through practical communication solutions'
            },
            {
                'name': 'Marketing Campaign Ideas',
                'description': 'Develop creative marketing strategies and campaign concepts',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['user_profiling', 'solution_brainstorming', 'value_proposition'],
                'temperature': 0.8,
                'initial_prompt': "I need fresh marketing ideas for our upcoming campaign. Can you help me brainstorm creative approaches to reach our target audience?",
                'conversation_goals': 'Develop creative and effective marketing campaign strategies'
            },
            {
                'name': 'Employee Engagement Initiatives',
                'description': 'Create ideas to boost employee satisfaction and retention',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['user_profiling', 'problem_capture', 'solution_brainstorming'],
                'temperature': 0.8,
                'initial_prompt': "What initiatives could we implement to improve employee engagement and satisfaction? I want to create a better workplace culture.",
                'conversation_goals': 'Boost employee engagement through targeted workplace initiatives'
            },
            {
                'name': 'Sustainability and Green Initiatives',
                'description': 'Develop environmentally friendly business practices',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['problem_capture', 'solution_brainstorming', 'value_proposition'],
                'temperature': 0.7,
                'initial_prompt': "How can we make our organization more sustainable and environmentally friendly? I'm looking for practical green initiatives we could implement.",
                'conversation_goals': 'Develop practical sustainability initiatives that benefit both environment and business'
            },
            {
                'name': 'Digital Transformation Ideas',
                'description': 'Modernize business processes through digital solutions',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['problem_capture', 'solution_brainstorming', 'value_proposition'],
                'temperature': 0.6,
                'initial_prompt': "We need to digitally transform our business processes. Can you help me identify areas where digital solutions could make the biggest impact?",
                'conversation_goals': 'Identify digital transformation opportunities for process modernization'
            },
            {
                'name': 'Idea Refinement Session',
                'description': 'Polish and develop an existing idea into a concrete proposal',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['solution_brainstorming', 'value_proposition', 'report_generation'],
                'temperature': 0.7,
                'initial_prompt': "I have a rough idea that I'd like to develop further. Can you help me refine it and turn it into a more detailed, actionable proposal?",
                'conversation_goals': 'Refine and structure existing ideas into actionable proposals'
            },
            {
                'name': 'Competitive Analysis Discussion',
                'description': 'Analyze competitive landscape and identify opportunities',
                'maglabs_interview_type': 'business_idea',
                'focus_stages': ['problem_capture', 'problem_clarification', 'value_proposition'],
                'temperature': 0.6,
                'initial_prompt': "I want to better understand our competitive position and identify opportunities to differentiate ourselves. Can you help me think through this strategically?",
                'conversation_goals': 'Analyze competitive landscape and identify strategic differentiation opportunities'
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