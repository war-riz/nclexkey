from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()

class Command(BaseCommand):
    help = 'Check instructor user and their courses'

    def handle(self, *args, **options):
        self.stdout.write("Checking instructor user...")
        
        # Check instructor user
        instructor_email = "instructor@nclexprep.com"
        try:
            instructor = User.objects.get(email=instructor_email)
            self.stdout.write(f"Instructor found: {instructor.email}")
            self.stdout.write(f"Role: {instructor.role}")
            self.stdout.write(f"ID: {instructor.id}")
            self.stdout.write(f"Active: {instructor.is_active}")
        except User.DoesNotExist:
            self.stdout.write(f"Instructor {instructor_email} not found!")
            return
        
        # Check courses created by this instructor
        courses = Course.objects.filter(created_by=instructor)
        self.stdout.write(f"Courses created by instructor: {courses.count()}")
        
        for course in courses:
            self.stdout.write(f"  - {course.title} (ID: {course.id})")
            self.stdout.write(f"    Created by: {course.created_by.email if course.created_by else 'None'}")
            self.stdout.write(f"    Active: {course.is_active}")
        
        # Check if there are any courses without created_by
        orphaned_courses = Course.objects.filter(created_by__isnull=True)
        if orphaned_courses.exists():
            self.stdout.write(f"Orphaned courses (no created_by): {orphaned_courses.count()}")
            for course in orphaned_courses:
                self.stdout.write(f"  - {course.title} (ID: {course.id})")
        
        self.stdout.write(self.style.SUCCESS("Instructor check completed"))
