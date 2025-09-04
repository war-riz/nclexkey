from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()

class Command(BaseCommand):
    help = 'Check if there are any students in the database'

    def handle(self, *args, **options):
        self.stdout.write("Checking database for students...")
        
        # Check total users
        total_users = User.objects.count()
        self.stdout.write(f"Total users: {total_users}")
        
        # Check students
        students = User.objects.filter(role='student', is_active=True)
        student_count = students.count()
        self.stdout.write(f"Active students: {student_count}")
        
        if student_count > 0:
            self.stdout.write("Student details:")
            for student in students[:5]:  # Show first 5 students
                self.stdout.write(f"  - {student.email} ({student.full_name}) - Joined: {student.date_joined}")
        else:
            self.stdout.write("No students found in database")
        
        # Check courses
        courses = Course.objects.all()
        course_count = courses.count()
        self.stdout.write(f"Total courses: {course_count}")
        
        if course_count > 0:
            self.stdout.write("Course details:")
            for course in courses[:5]:  # Show first 5 courses
                self.stdout.write(f"  - {course.title} - Created by: {course.created_by.email if course.created_by else 'None'}")
        
        self.stdout.write(self.style.SUCCESS("Database check completed"))
