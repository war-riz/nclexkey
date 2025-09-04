#!/usr/bin/env python
"""
Debug script to find why students are not showing up
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append('/Users/User/Downloads/nclexkeys/nclekkeyswebsite/nclekkeyswebsite/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from courses.models import Course, UserCourseProgress
from django.utils import timezone

User = get_user_model()

def debug_students():
    print("=== Debugging Students Issue ===")
    
    # Get the instructor
    instructor = User.objects.get(email='instructor@nclexprep.com')
    print(f"Instructor: {instructor.email} (ID: {instructor.id})")
    
    # Get students
    students = User.objects.filter(role='student', is_active=True).order_by('-date_joined')
    print(f"Found {students.count()} students")
    
    # Get instructor courses
    instructor_courses = Course.objects.filter(created_by=instructor)
    print(f"Instructor has {instructor_courses.count()} courses")
    
    students_data = []
    for student in students:
        print(f"\nProcessing student: {student.email} (ID: {student.id})")
        
        # Get total courses available to this student
        total_courses = instructor_courses.count()
        print(f"  Total courses available: {total_courses}")
        
        # Get courses this student has accessed/progressed in
        accessed_courses = UserCourseProgress.objects.filter(
            user=student,
            course__created_by=instructor
        ).count()
        print(f"  Courses accessed: {accessed_courses}")
        
        # Get overall progress across all courses
        total_progress = UserCourseProgress.objects.filter(
            user=student,
            course__created_by=instructor
        ).aggregate(
            avg_progress=Avg('progress_percentage')
        )['avg_progress'] or 0
        print(f"  Overall progress: {total_progress}")
        
        # Get last activity across all courses
        last_activity = UserCourseProgress.objects.filter(
            user=student,
            course__created_by=instructor
        ).order_by('-last_activity').first()
        
        last_activity_time = last_activity.last_activity if last_activity else student.date_joined
        print(f"  Last activity: {last_activity_time}")
        
        student_data = {
            'id': str(student.id),
            'full_name': student.full_name,
            'email': student.email,
            'date_joined': student.date_joined,
            'last_activity': last_activity_time,
            'total_courses_available': total_courses,
            'courses_accessed': accessed_courses,
            'overall_progress': round(total_progress, 1),
            'registration_payment_status': 'completed',
            'access_level': 'full_platform_access'
        }
        
        students_data.append(student_data)
        print(f"  Student data prepared: {student_data['email']} - {student_data['full_name']}")
    
    print(f"\n=== Final Result ===")
    print(f"Total students processed: {len(students_data)}")
    
    response_data = {
        'students': students_data,
        'total_students': len(students_data),
        'total_courses_available': instructor_courses.count(),
        'platform_access_students': len(students_data)
    }
    
    print(f"Response data: {response_data}")

if __name__ == '__main__':
    from django.db.models import Avg
    debug_students()
