#!/usr/bin/env python
"""
Test script to debug the students API issue
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
from courses.models import Course
from courses.instructor_views import get_all_students
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

User = get_user_model()

def test_students_api():
    print("=== Testing Students API ===")
    
    # Get the instructor
    try:
        instructor = User.objects.get(email='instructor@nclexprep.com')
        print(f"✅ Instructor found: {instructor.email} (Role: {instructor.role})")
    except User.DoesNotExist:
        print("❌ Instructor not found!")
        return
    
    # Get students
    students = User.objects.filter(role='student', is_active=True)
    print(f"✅ Found {students.count()} students in database")
    
    for student in students:
        print(f"  - {student.email} ({student.full_name})")
    
    # Get instructor courses
    instructor_courses = Course.objects.filter(created_by=instructor)
    print(f"✅ Instructor has {instructor_courses.count()} courses")
    
    for course in instructor_courses:
        print(f"  - {course.title}")
    
    # Test the API function
    print("\n=== Testing API Function ===")
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/admin/students/')
    request.user = instructor
    
    try:
        response = get_all_students(request)
        print(f"✅ API Response Status: {response.status_code}")
        
        if hasattr(response, 'data'):
            print(f"✅ Response Data Keys: {list(response.data.keys())}")
            print(f"✅ Students Count: {response.data.get('total_students', 0)}")
            print(f"✅ Students Data: {len(response.data.get('students', []))}")
            
            if response.data.get('students'):
                print("✅ First student data:")
                first_student = response.data['students'][0]
                print(f"  - Email: {first_student.get('email')}")
                print(f"  - Name: {first_student.get('full_name')}")
                print(f"  - Courses Available: {first_student.get('total_courses_available')}")
        else:
            print("❌ No response data")
            
    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_students_api()
