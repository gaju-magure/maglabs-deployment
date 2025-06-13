from django.core.management.base import BaseCommand
from apps.ideas.models import ChatTemplate

class Command(BaseCommand):
    help = 'Create default chat templates with MagLabs configurations'

    def handle(self, *args, **options):
        templates = [
            {
                'name': 'Creative Brainstorming',
                'description': 'Generate innovative solutions and creative ideas without constraints',
                'conversation_type': 'brainstorm',
                'initial_prompt': 'I want to brainstorm creative and innovative solutions for a challenge I\'m facing. Let\'s think outside the box!',
                'maglabs_interview_type': 'business_idea',
                'expected_stages': ['user_profiling', 'solution_brainstorming', 'value_proposition'],
                'stage_prompts': {
                    'solution_brainstorming': 'Generate 10 wildly creative ideas. No idea is too crazy!',
                    'value_proposition': 'Now let\'s evaluate which ideas have the most potential'
                },
                'conversation_goals': 'Generate multiple creative solutions and identify the most promising ones',
                'temperature': 0.9,
                'focus_stages': ['solution_brainstorming']
            },
            {
                'name': 'Systematic Problem Analysis',
                'description': 'Break down complex problems using structured analytical approaches',
                'conversation_type': 'problem_solving',
                'initial_prompt': 'I have a complex problem that needs systematic analysis. Help me break it down step by step.',
                'maglabs_interview_type': 'business_idea',
                'expected_stages': ['user_profiling', 'problem_capture', 'problem_clarification', 'solution_brainstorming'],
                'stage_prompts': {
                    'problem_capture': 'Let\'s identify and document the core problem systematically',
                    'problem_clarification': 'Now let\'s dig deeper into the root causes and implications',
                    'solution_brainstorming': 'Based on our analysis, let\'s develop structured solutions'
                },
                'conversation_goals': 'Thoroughly understand the problem and develop evidence-based solutions',
                'temperature': 0.5,
                'focus_stages': ['problem_capture', 'problem_clarification']
            },
            {
                'name': 'Comprehensive Idea Refinement',
                'description': 'Take an existing idea through detailed development and refinement',
                'conversation_type': 'refine',
                'initial_prompt': 'I have an idea that needs thorough development and refinement. Let\'s work together to make it stronger.',
                'maglabs_interview_type': 'business_idea',
                'expected_stages': 'all',
                'stage_prompts': {
                    'problem_clarification': 'Let\'s ensure we fully understand the problem this idea solves',
                    'solution_brainstorming': 'How can we improve and expand on this idea?',
                    'value_proposition': 'What makes this idea valuable and unique?',
                    'report_generation': 'Let\'s create a comprehensive plan for moving forward'
                },
                'conversation_goals': 'Develop a well-rounded, implementable idea with clear next steps',
                'temperature': 0.7,
                'focus_stages': 'all'
            },
            {
                'name': 'Technical Feature Design',
                'description': 'Design and specify new product features with technical details',
                'conversation_type': 'feature_design',
                'initial_prompt': 'I want to design a new product feature. Help me think through the technical specifications and user experience.',
                'maglabs_interview_type': 'business_idea',
                'expected_stages': ['user_profiling', 'solution_brainstorming', 'value_proposition'],
                'stage_prompts': {
                    'solution_brainstorming': 'Let\'s design the feature functionality and technical architecture',
                    'value_proposition': 'How does this feature provide value to users and the business?'
                },
                'conversation_goals': 'Create detailed feature specifications with clear technical requirements',
                'temperature': 0.6,
                'focus_stages': ['solution_brainstorming', 'value_proposition']
            },
            {
                'name': 'Strategic Business Planning',
                'description': 'Develop business strategy and long-term planning',
                'conversation_type': 'strategy_planning',
                'initial_prompt': 'I need help developing a business strategy and roadmap. Let\'s think about market positioning and growth.',
                'maglabs_interview_type': 'business_idea',
                'expected_stages': ['user_profiling', 'problem_capture', 'value_proposition', 'report_generation'],
                'stage_prompts': {
                    'problem_capture': 'What market opportunities and challenges are we addressing?',
                    'value_proposition': 'What\'s our unique value proposition and competitive advantage?',
                    'report_generation': 'Let\'s create a strategic roadmap with clear milestones'
                },
                'conversation_goals': 'Develop a comprehensive business strategy with actionable roadmap',
                'temperature': 0.6,
                'focus_stages': ['value_proposition', 'report_generation']
            },
            {
                'name': 'Full Business Interview',
                'description': 'Complete structured interview covering all aspects of business idea development',
                'conversation_type': 'interview',
                'initial_prompt': 'I want to go through a comprehensive business interview to fully develop my idea. Guide me through all the necessary stages.',
                'maglabs_interview_type': 'business_idea',
                'expected_stages': 'all',
                'stage_prompts': {
                    'user_profiling': 'Let\'s understand your background and expertise',
                    'problem_capture': 'What problem are you solving and for whom?',
                    'problem_clarification': 'Let\'s dig deeper into the problem details',
                    'solution_brainstorming': 'How will you solve this problem?',
                    'value_proposition': 'What\'s the business value and market opportunity?',
                    'report_generation': 'Let\'s synthesize everything into an action plan'
                },
                'conversation_goals': 'Complete end-to-end business idea development with detailed documentation',
                'temperature': 0.7,
                'focus_stages': 'all'
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
            self.style.SUCCESS(f'\nCreated {created_count} new templates out of {len(templates)} total')
        )