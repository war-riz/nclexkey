# courses/admin_email_service.py
from django.utils import timezone
from django.conf import settings
from courses.models import CourseEnrollment
from users.models import User
from utils.auth import EmailService
import logging
import json

logger = logging.getLogger(__name__)


class AdminEmailService:
    """Email service for admin notifications"""
    
    @staticmethod
    def notify_course_created(course, admin_user):
        """Notify admins when a new course is created"""
        try:
            admin_users = User.objects.filter(role='admin', is_active=True).exclude(id=admin_user.id)
            
            subject = f"New Course Created: {course.title}"
            context = {
                'course': course,
                'created_by': admin_user,
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}",
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }
            
            # Send to each admin
            for admin in admin_users:
                EmailService._send_email(
                    user=admin,
                    email_type='course_created',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/instructor/course_created.html', context),
                    plain_message=f"A new course '{course.title}' has been created by {admin_user.full_name}."
                )
            
            logger.info(f"Course creation notification sent to {admin_users.count()} admins")
            
        except Exception as e:
            logger.error(f"Failed to send course creation notification: {str(e)}")

    @staticmethod
    def notify_course_creator_confirmation(course, instructor):
        """Notify course creator that course was created successfully"""
        try:
            subject = f"Course Created Successfully: {course.title}"
            context = {
                'course': course,
                'instructor': instructor,
                'status': 'pending_approval',
                'dashboard_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}",
                'expected_approval_time': '24-48 hours'
            }

            EmailService._send_email(
                user=instructor,
                email_type='course_created_confirmation',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/course_created_confirmation.html', context),
                plain_message=f"Your course '{course.title}' has been created successfully and is pending approval."
            )

        except Exception as e:
            logger.error(f"Failed to send course creation confirmation: {str(e)}")

    @staticmethod
    def notify_course_creator_decision(course, action, reason=''):
        """Notify course creator about approval/rejection decision"""
        try:
            subject = f"Course {action.title()}: {course.title}"
            context = {
                'course': course,
                'instructor': course.created_by,
                'action': action,
                'reason': reason,
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}",
                'support_email': 'support@nclexvirtualschool.com',
                'reviewed_at': course.moderated_at or timezone.now()
            }

            EmailService._send_email(
                user=course.created_by,
                email_type=f'course_{action}',
                subject=subject,
                html_message=AdminEmailService._render_template(f'emails/instructor/course_{action}.html', context),
                plain_message=f"Your course '{course.title}' has been {action}. {reason}"
            )

        except Exception as e:
            logger.error(f"Failed to send course decision notification: {str(e)}")

    @staticmethod
    def notify_super_admins_course_updated(course, admin_user, changes):
        """Notify super admins of significant course changes"""
        try:
            super_admins = User.objects.filter(role='super_admin', is_active=True)

            subject = f"Course Updated: {course.title}"
            context = {
                'course': course,
                'updated_by': admin_user,
                'changes': changes,
                'course_url': f"{settings.FRONTEND_URL}/super-admin/courses/{course.id}",
            }

            for super_admin in super_admins:
                EmailService._send_email(
                    user=super_admin,
                    email_type='course_updated_super_admin',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/course_updated.html', context),
                    plain_message=f"Course '{course.title}' has been updated by {admin_user.full_name}."
                )

        except Exception as e:
            logger.error(f"Failed to notify super admins of course update: {str(e)}")
    

    @staticmethod
    def notify_course_updated(course, admin_user, changes):
        """Notify course instructor and super admins (if necessary) when a course is updated"""
        try:
            # Notify instructor
            if hasattr(course, 'instructor') and course.instructor:
                context = {
                    'course': course,
                    'updated_by': admin_user,  # full object needed for full_name
                    'changes': changes,
                    'course_url': f"{settings.FRONTEND_URL}/instructor/courses/{course.id}",
                }
    
                EmailService._send_email(
                    user=course.instructor,
                    email_type='course_updated_instructor',
                    subject=f"Your Course Was Updated: {course.title}",
                    html_message=AdminEmailService._render_template('emails/instructor/course_updated.html', context),
                    plain_message=f"Your course '{course.title}' was updated by {admin_user.full_name}."
                )
    
            # Notify super admins if significant fields changed
            if any(change['field'] in ['title', 'price', 'course_type'] for change in changes):
                AdminEmailService.notify_super_admins_course_updated(course, admin_user, changes)
    
        except Exception as e:
            logger.error(f"Failed to notify course instructor or super admins: {str(e)}")


    @staticmethod
    def notify_course_updated_by_admin(course, admin_user, changes):
        """Notify course creator when admin updates their course"""
        try:
            if course.created_by == admin_user:
                return  # Don't notify if admin is updating their own course

            subject = f"Your Course Has Been Updated: {course.title}"
            context = {
                'course': course,
                'instructor': course.created_by,
                'admin_user': admin_user,
                'changes': changes,
                'course_url': f"{settings.FRONTEND_URL}/instructor/courses/{course.id}",
                'support_email': 'support@nclexvirtualschool.com',
                'updated_at': timezone.now()
            }

            EmailService._send_email(
                user=course.created_by,
                email_type='course_updated_by_admin',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/course_updated_by_admin.html', context),
                plain_message=f"Your course '{course.title}' has been updated by an administrator."
            )

            logger.info(f"Course update notification sent to instructor {course.created_by.email}")

        except Exception as e:
            logger.error(f"Failed to send course update notification: {str(e)}")

    @staticmethod
    def notify_platform_admins_course_modified(course, modifier_admin, changes):
        """Notify platform admins when regular admin modifies a course"""
        try:
            platform_admins = User.objects.filter(
                role='super_admin', 
                is_superuser=True, 
                is_active=True
            ).exclude(id=modifier_admin.id)

            subject = f"Course Modified by Admin: {course.title}"
            context = {
                'course': course,
                'modifier_admin': modifier_admin,
                'changes': changes,
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}",
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard",
                'modified_at': timezone.now()
            }

            for admin in platform_admins:
                EmailService._send_email(
                    user=admin,
                    email_type='course_modified_by_admin',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/course_modified_by_admin.html', context),
                    plain_message=f"Course '{course.title}' was modified by {modifier_admin.full_name}."
                )

            logger.info(f"Course modification notification sent to {platform_admins.count()} platform admins")

        except Exception as e:
            logger.error(f"Failed to send course modification notification: {str(e)}")

    @staticmethod
    def notify_students_course_deactivated(course, admin_user):
        """Notify enrolled students when their course is deactivated"""
        try:
            # Get all users who have progress in this course
            enrolled_users = User.objects.filter(
                course_progress__course=course,
                is_active=True
            ).distinct()

            subject = f"Course Update: {course.title}"
            context = {
                'course': course,
                'admin_user': admin_user,
                'deactivated_at': timezone.now(),
                'support_email': 'support@nclexvirtualschool.com',
                'alternative_courses_url': f"{settings.FRONTEND_URL}/courses",
                'contact_support_url': f"{settings.FRONTEND_URL}/support"
            }

            for user in enrolled_users:
                context['user'] = user
                EmailService._send_email(
                    user=user,
                    email_type='course_deactivated',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/student/course_deactivated.html', context),
                    plain_message=f"The course '{course.title}' you were enrolled in has been temporarily deactivated."
                )

            logger.info(f"Course deactivation notification sent to {enrolled_users.count()} students")

        except Exception as e:
            logger.error(f"Failed to send course deactivation notification: {str(e)}")

    @staticmethod
    def notify_instructor_course_deactivated(course, admin_user):
        """Notify instructor when their course is deactivated"""
        try:
            if course.created_by == admin_user:
                return  # Don't notify if admin is deactivating their own course

            subject = f"Your Course Has Been Deactivated: {course.title}"
            context = {
                'course': course,
                'instructor': course.created_by,
                'admin_user': admin_user,
                'deactivated_at': timezone.now(),
                'course_url': f"{settings.FRONTEND_URL}/instructor/courses/{course.id}",
                'support_email': 'support@nclexvirtualschool.com',
                'appeal_url': f"{settings.FRONTEND_URL}/instructor/appeals/create"
            }

            EmailService._send_email(
                user=course.created_by,
                email_type='course_deactivated_instructor',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/course_deactivated.html', context),
                plain_message=f"Your course '{course.title}' has been deactivated."
            )

            logger.info(f"Course deactivation notification sent to instructor {course.created_by.email}")

        except Exception as e:
            logger.error(f"Failed to send instructor deactivation notification: {str(e)}")

    @staticmethod
    def notify_instructor_course_deleted(course_title, instructor, admin_user):
        """Notify instructor when their course is permanently deleted"""
        try:
            if instructor == admin_user:
                return  # Don't notify if admin is deleting their own course

            subject = f"Your Course Has Been Deleted: {course_title}"
            context = {
                'course_title': course_title,
                'instructor': instructor,
                'admin_user': admin_user,
                'deleted_at': timezone.now(),
                'support_email': 'support@nclexvirtualschool.com',
                'create_new_course_url': f"{settings.FRONTEND_URL}/instructor/courses/create"
            }

            EmailService._send_email(
                user=instructor,
                email_type='course_deleted_instructor',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/course_deleted.html', context),
                plain_message=f"Your course '{course_title}' has been permanently deleted."
            )

            logger.info(f"Course deletion notification sent to instructor {instructor.email}")

        except Exception as e:
            logger.error(f"Failed to send instructor deletion notification: {str(e)}")

    @staticmethod
    def notify_platform_admins_course_deactivated(course, admin_user):
        """Notify platform admins when course is deactivated"""
        try:
            platform_admins = User.objects.filter(
                role='super_admin', 
                is_superuser=True, 
                is_active=True
            ).exclude(id=admin_user.id)

            subject = f"Course Deactivated: {course.title}"
            context = {
                'course': course,
                'admin_user': admin_user,
                'deactivated_at': timezone.now(),
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}",
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }

            for admin in platform_admins:
                EmailService._send_email(
                    user=admin,
                    email_type='course_deactivated_admin',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/course_deactivated.html', context),
                    plain_message=f"Course '{course.title}' was deactivated by {admin_user.full_name}."
                )

            logger.info(f"Course deactivation notification sent to {platform_admins.count()} platform admins")

        except Exception as e:
            logger.error(f"Failed to send platform admin deactivation notification: {str(e)}")

    @staticmethod
    def notify_platform_admins_course_deleted(course_title, instructor, admin_user):
        """Notify platform admins when course is deleted"""
        try:
            platform_admins = User.objects.filter(
                role='super_admin', 
                is_superuser=True, 
                is_active=True
            ).exclude(id=admin_user.id)

            subject = f"Course Deleted: {course_title}"
            context = {
                'course_title': course_title,
                'instructor': instructor,
                'admin_user': admin_user,
                'deleted_at': timezone.now(),
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }

            for admin in platform_admins:
                EmailService._send_email(
                    user=admin,
                    email_type='course_deleted_admin',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/course_deleted.html', context),
                    plain_message=f"Course '{course_title}' was permanently deleted by {admin_user.full_name}."
                )

            logger.info(f"Course deletion notification sent to {platform_admins.count()} platform admins")

        except Exception as e:
            logger.error(f"Failed to send platform admin deletion notification: {str(e)}")

    @staticmethod
    def notify_instructor_bulk_course_action(instructor, action, courses, admin_user):
        """Notify instructor when admin performs bulk actions on their courses"""
        try:
            if instructor == admin_user:
                return  # Don't notify if admin is acting on their own courses

            action_past_tense = {
                'activate': 'activated',
                'deactivate': 'deactivated',
                'feature': 'featured',
                'unfeature': 'unfeatured',
                'update_category': 'category updated',
                'apply_discount': 'discount applied',
                'remove_discount': 'discount removed'
            }

            subject = f"Your Courses Have Been {action_past_tense.get(action, action.title())}"
            context = {
                'instructor': instructor,
                'admin_user': admin_user,
                'action': action,
                'action_past_tense': action_past_tense.get(action, action),
                'courses': list(courses.values('id', 'title', 'course_type')),
                'courses_count': courses.count(),
                'action_date': timezone.now(),
                'instructor_dashboard_url': f"{settings.FRONTEND_URL}/instructor/dashboard",
                'support_email': 'support@nclexvirtualschool.com'
            }

            EmailService._send_email(
                user=instructor,
                email_type='bulk_course_action_instructor',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/bulk_course_action.html', context),
                plain_message=f"{courses.count()} of your courses have been {action_past_tense.get(action, action)} by an administrator."
            )

            logger.info(f"Bulk action notification sent to instructor {instructor.email}")

        except Exception as e:
            logger.error(f"Failed to send bulk action notification: {str(e)}")

    @staticmethod
    def notify_platform_admins_bulk_action(action, courses_count, admin_user):
        """Notify platform admins about bulk actions performed"""
        try:
            platform_admins = User.objects.filter(
                role='super_admin', 
                is_superuser=True, 
                is_active=True
            ).exclude(id=admin_user.id)

            subject = f"Bulk Action Performed: {action.title()} on {courses_count} Courses"
            context = {
                'admin_user': admin_user,
                'action': action,
                'courses_count': courses_count,
                'action_date': timezone.now(),
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }

            for admin in platform_admins:
                EmailService._send_email(
                    user=admin,
                    email_type='bulk_action_admin',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/bulk_action_performed.html', context),
                    plain_message=f"{admin_user.full_name} performed bulk {action} on {courses_count} courses."
                )

            logger.info(f"Bulk action notification sent to {platform_admins.count()} platform admins")

        except Exception as e:
            logger.error(f"Failed to send platform admin bulk action notification: {str(e)}")

    @staticmethod
    def notify_platform_admins_bulk_delete(deleted_count, deactivated_count, admin_user):
        """Notify platform admins about bulk deletion results"""
        try:
            platform_admins = User.objects.filter(
                role='super_admin', 
                is_superuser=True, 
                is_active=True
            ).exclude(id=admin_user.id)

            subject = f"Bulk Deletion Completed: {deleted_count} Deleted, {deactivated_count} Deactivated"
            context = {
                'admin_user': admin_user,
                'deleted_count': deleted_count,
                'deactivated_count': deactivated_count,
                'action_date': timezone.now(),
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }

            for admin in platform_admins:
                EmailService._send_email(
                    user=admin,
                    email_type='bulk_delete_admin',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/bulk_delete_completed.html', context),
                    plain_message=f"Bulk deletion completed: {deleted_count} courses deleted, {deactivated_count} deactivated."
                )

            logger.info(f"Bulk delete notification sent to {platform_admins.count()} platform admins")

        except Exception as e:
            logger.error(f"Failed to send platform admin bulk delete notification: {str(e)}")

    @staticmethod
    def notify_platform_admins_instructor_activity(instructor, action, courses_count):
        """Notify platform admins when instructors perform bulk actions"""
        try:
            platform_admins = User.objects.filter(
                role='super_admin', 
                is_superuser=True, 
                is_active=True
            )

            subject = f"Instructor Bulk Action: {instructor.full_name} {action} {courses_count} Courses"
            context = {
                'instructor': instructor,
                'action': action,
                'courses_count': courses_count,
                'action_date': timezone.now(),
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard",
                'instructor_profile_url': f"{settings.FRONTEND_URL}/admin/instructors/{instructor.id}"
            }

            for admin in platform_admins:
                EmailService._send_email(
                    user=admin,
                    email_type='instructor_bulk_activity',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/instructor_bulk_activity.html', context),
                    plain_message=f"Instructor {instructor.full_name} performed bulk {action} on {courses_count} courses."
                )

            logger.info(f"Instructor activity notification sent to {platform_admins.count()} platform admins")

        except Exception as e:
            logger.error(f"Failed to send instructor activity notification: {str(e)}")

    @staticmethod
    def notify_instructor_exam_created(exam, admin_user):
        """Notify course instructor when admin creates exam for their course"""
        try:
            instructor = exam.course.created_by

            if instructor == admin_user:
                return  # Don't notify if admin is creating exam for their own course

            subject = f"New Exam Created for Your Course: {exam.course.title}"
            context = {
                'exam': exam,
                'course': exam.course,
                'instructor': instructor,
                'admin_user': admin_user,
                'exam_url': f"{settings.FRONTEND_URL}/instructor/courses/{exam.course.id}/exams/{exam.id}",
                'course_url': f"{settings.FRONTEND_URL}/instructor/courses/{exam.course.id}",
                'created_at': timezone.now()
            }

            EmailService._send_email(
                user=instructor,
                email_type='exam_created_by_admin',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/exam_created_by_admin.html', context),
                plain_message=f"A new exam '{exam.title}' has been created for your course '{exam.course.title}'."
            )

            logger.info(f"Exam creation notification sent to instructor {instructor.email}")

        except Exception as e:
            logger.error(f"Failed to send exam creation notification: {str(e)}")

    @staticmethod
    def notify_instructor_manual_enrollment(user, course, admin_user):
        """Notify instructor when admin manually enrolls someone in their course"""
        try:
            instructor = course.created_by

            if instructor == admin_user:
                return  # Don't notify if admin is enrolling in their own course

            subject = f"New Student Manually Enrolled: {course.title}"
            context = {
                'student': user,
                'course': course,
                'instructor': instructor,
                'admin_user': admin_user,
                'enrollment_date': timezone.now(),
                'course_url': f"{settings.FRONTEND_URL}/instructor/courses/{course.id}",
                'student_profile_url': f"{settings.FRONTEND_URL}/instructor/students/{user.id}"
            }

            EmailService._send_email(
                user=instructor,
                email_type='manual_enrollment_instructor',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/manual_enrollment.html', context),
                plain_message=f"{user.full_name} has been manually enrolled in your course '{course.title}'."
            )

            logger.info(f"Manual enrollment notification sent to instructor {instructor.email}")

        except Exception as e:
            logger.error(f"Failed to send manual enrollment notification: {str(e)}")

    @staticmethod
    def notify_instructor_lesson_added(lesson, admin_user):
        """Notify instructor when admin adds lesson to their course"""
        try:
            instructor = lesson.section.course.created_by

            if instructor == admin_user:
                return  # Don't notify if admin is adding lesson to their own course

            subject = f"New Lesson Added to Your Course: {lesson.section.course.title}"
            context = {
                'lesson': lesson,
                'section': lesson.section,
                'course': lesson.section.course,
                'instructor': instructor,
                'admin_user': admin_user,
                'lesson_url': f"{settings.FRONTEND_URL}/instructor/courses/{lesson.section.course.id}/sections/{lesson.section.id}/lessons/{lesson.id}",
                'course_url': f"{settings.FRONTEND_URL}/instructor/courses/{lesson.section.course.id}",
                'added_at': timezone.now()
            }

            EmailService._send_email(
                user=instructor,
                email_type='lesson_added_by_admin',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/lesson_added_by_admin.html', context),
                plain_message=f"A new lesson '{lesson.title}' has been added to your course '{lesson.section.course.title}'."
            )

            logger.info(f"Lesson addition notification sent to instructor {instructor.email}")

        except Exception as e:
            logger.error(f"Failed to send lesson addition notification: {str(e)}")

    @staticmethod
    def notify_instructor_pricing_updated(course, admin_user, old_pricing, new_pricing):
        """Notify instructor when admin updates their course pricing"""
        try:
            instructor = course.created_by

            if instructor == admin_user:
                return  # Don't notify if admin is updating their own course pricing

            subject = f"Course Pricing Updated: {course.title}"
            context = {
                'course': course,
                'instructor': instructor,
                'admin_user': admin_user,
                'old_pricing': old_pricing,
                'new_pricing': new_pricing,
                'updated_at': timezone.now(),
                'course_url': f"{settings.FRONTEND_URL}/instructor/courses/{course.id}",
                'support_email': 'support@nclexvirtualschool.com'
            }

            EmailService._send_email(
                user=instructor,
                email_type='pricing_updated_instructor',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/pricing_updated.html', context),
                plain_message=f"The pricing for your course '{course.title}' has been updated."
            )

            logger.info(f"Pricing update notification sent to instructor {instructor.email}")

        except Exception as e:
            logger.error(f"Failed to send pricing update notification: {str(e)}")

    @staticmethod
    def notify_students_pricing_changed(course, old_price, new_price):
        """Notify enrolled students when course pricing changes (for transparency)"""
        try:
            # Only notify if price increased and course is still available for purchase
            if new_price <= old_price:
                return

            enrolled_users = User.objects.filter(
                course_progress__course=course,
                is_active=True
            ).distinct()

            subject = f"Pricing Update: {course.title}"
            context = {
                'course': course,
                'old_price': old_price,
                'new_price': new_price,
                'price_increase': new_price - old_price,
                'updated_at': timezone.now(),
                'course_url': f"{settings.FRONTEND_URL}/courses/{course.id}"
            }

            for user in enrolled_users:
                context['user'] = user
                EmailService._send_email(
                    user=user,
                    email_type='course_pricing_changed',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/student/pricing_changed.html', context),
                    plain_message=f"The pricing for '{course.title}' has been updated."
                )

            logger.info(f"Pricing change notification sent to {enrolled_users.count()} students")

        except Exception as e:
            logger.error(f"Failed to send pricing change notification: {str(e)}")

    @staticmethod
    def notify_platform_admins_pricing_updated(course, admin_user, old_pricing, new_pricing):
        """Notify platform admins about course pricing changes"""
        try:
            platform_admins = User.objects.filter(
                role='super_admin', 
                is_superuser=True, 
                is_active=True
            ).exclude(id=admin_user.id)

            subject = f"Course Pricing Updated: {course.title}"
            context = {
                'course': course,
                'admin_user': admin_user,
                'old_pricing': old_pricing,
                'new_pricing': new_pricing,
                'updated_at': timezone.now(),
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}",
                'admin_dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }

            for admin in platform_admins:
                EmailService._send_email(
                    user=admin,
                    email_type='pricing_updated_admin',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/pricing_updated.html', context),
                    plain_message=f"Course pricing updated for '{course.title}' by {admin_user.full_name}."
                )

            logger.info(f"Pricing update notification sent to {platform_admins.count()} platform admins")

        except Exception as e:
            logger.error(f"Failed to send pricing update notification: {str(e)}")

    @staticmethod
    def get_currency_symbol(currency):
        """Get currency symbol for display"""
        symbols = {
            'NGN': '₦',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'GHS': '₵',
            'KES': 'KSh',
            'ZAR': 'R',
        }
        return symbols.get(currency, f'{currency} ')  # Return currency code if no symbol


    @staticmethod
    def notify_enrollment_by_value(enrollment):
        """Route enrollment notifications based on value tiers"""
        try:
            amount = float(enrollment.amount_paid) if enrollment.amount_paid else 0

            if amount == 0:
                # Free enrollment - notify instructor only
                AdminEmailService.notify_free_enrollment(enrollment)
            elif amount < 50:
                # Low-value enrollment - notify instructor
                AdminEmailService.notify_low_value_enrollment(enrollment)
            elif amount < 100:
                # Medium-value enrollment - notify instructor
                AdminEmailService.notify_medium_value_enrollment(enrollment)
            elif amount < 1000:
                # High-value enrollment - notify instructor (existing function)
                AdminEmailService.notify_high_value_enrollment_to_instructor(enrollment)
            else:
                # Premium enrollment - notify instructor + super admins
                AdminEmailService.notify_high_value_enrollment_to_instructor(enrollment)
                AdminEmailService.notify_super_admins_high_revenue(enrollment)

        except Exception as e:
            logger.error(f"Failed to route enrollment notification: {str(e)}")

    @staticmethod
    def notify_free_enrollment(enrollment):
        """Notify instructor about free enrollment"""
        try:
            instructor = enrollment.course.created_by

            subject = f"New Free Enrollment: {enrollment.course.title}"
            context = {
                'enrollment': enrollment,
                'course': enrollment.course,
                'instructor': instructor,
                'student': enrollment.user,
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{enrollment.course.id}",
                'student_count': enrollment.course.enrollments.filter(is_active=True).count()
            }

            EmailService._send_email(
                user=instructor,
                email_type='free_enrollment_notification',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/free_enrollment.html', context),
                plain_message=f"New student {enrollment.user.full_name} enrolled in your free course '{enrollment.course.title}'"
            )

        except Exception as e:
            logger.error(f"Failed to send free enrollment notification: {str(e)}")

    @staticmethod
    def notify_low_value_enrollment(enrollment):
        """Notify instructor about low-value enrollment ($1-$49)"""
        try:
            instructor = enrollment.course.created_by
            instructor_earnings = float(enrollment.amount_paid) * 0.7

            subject = f"New Enrollment: {enrollment.currency} {enrollment.amount_paid} - {enrollment.course.title}"
            context = {
                'enrollment': enrollment,
                'course': enrollment.course,
                'instructor': instructor,
                'instructor_earnings': instructor_earnings,
                'student': enrollment.user,
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{enrollment.course.id}",
                'tier': 'low_value'
            }

            EmailService._send_email(
                user=instructor,
                email_type='low_value_enrollment_notification',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/enrollment_notification.html', context),
                plain_message=f"New student {enrollment.user.full_name} enrolled in '{enrollment.course.title}' for {enrollment.currency} {enrollment.amount_paid}. Your earnings: {enrollment.currency} instructor_earnings"
            )

        except Exception as e:
            logger.error(f"Failed to send low-value enrollment notification: {str(e)}")

    @staticmethod
    def notify_medium_value_enrollment(enrollment):
        """Notify instructor about medium-value enrollment ($50-$99)"""
        try:
            instructor = enrollment.course.created_by
            instructor_earnings = float(enrollment.amount_paid) * 0.7

            subject = f"Great Sale: {enrollment.currency} {enrollment.amount_paid} - {enrollment.course.title}"
            context = {
                'enrollment': enrollment,
                'course': enrollment.course,
                'instructor': instructor,
                'instructor_earnings': instructor_earnings,
                'student': enrollment.user,
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{enrollment.course.id}",
                'tier': 'medium_value'
            }

            EmailService._send_email(
                user=instructor,
                email_type='medium_value_enrollment_notification',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/enrollment_notification.html', context),
                plain_message=f"Great news! {enrollment.user.full_name} enrolled in '{enrollment.course.title}' for {enrollment.currency} {enrollment.amount_paid}. Your earnings: {enrollment.currency} {instructor_earnings}"
            )

        except Exception as e:
            logger.error(f"Failed to send medium-value enrollment notification: {str(e)}")

    @staticmethod
    def notify_bulk_enrollments_weekly(instructor):
        """Weekly digest of all enrollments for instructors with many low-value sales"""
        try:
            from datetime import timedelta
            from django.utils import timezone

            # Get enrollments from last week
            week_ago = timezone.now() - timedelta(days=7)
            enrollments = CourseEnrollment.objects.filter(
                course__created_by=instructor,
                enrolled_at__gte=week_ago,
                is_active=True
            ).select_related('course', 'user')

            if not enrollments.exists():
                return

            # Calculate summary stats
            total_revenue = sum(float(e.amount_paid or 0) for e in enrollments)
            instructor_earnings = total_revenue * 0.7
            enrollment_count = enrollments.count()
            courses_affected = enrollments.values('course').distinct().count()

            subject = f"Weekly Sales Summary: {enrollments.currency} {total_revenue} from {enrollment_count} enrollments"
            context = {
                'instructor': instructor,
                'enrollments': enrollments,
                'total_revenue': total_revenue,
                'instructor_earnings': instructor_earnings,
                'enrollment_count': enrollment_count,
                'courses_affected': courses_affected,
                'week_start': week_ago,
                'dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }

            EmailService._send_email(
                user=instructor,
                email_type='weekly_enrollment_digest',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/weekly_digest.html', context),
                plain_message=f"Weekly summary: {enrollment_count} new enrollments generating {enrollments.currency} {total_revenue} in revenue (Your earnings: {enrollments.currency} {instructor_earnings})"
            )

        except Exception as e:
            logger.error(f"Failed to send weekly enrollment digest: {str(e)}")

    @staticmethod
    def notify_milestone_enrollments(enrollment):
        """Notify instructor when course reaches enrollment milestones"""
        try:
            course = enrollment.course
            total_enrollments = course.enrollments.filter(is_active=True).count()

            # Define milestones
            milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]

            if total_enrollments in milestones:
                instructor = course.created_by

                subject = f"🎉 Milestone Reached: {total_enrollments} students in {course.title}"
                context = {
                    'course': course,
                    'instructor': instructor,
                    'milestone': total_enrollments,
                    'latest_student': enrollment.user,
                    'course_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}",
                    'analytics_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}/analytics"
                }

                EmailService._send_email(
                    user=instructor,
                    email_type='enrollment_milestone',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/instructor/milestone_reached.html', context),
                    plain_message=f"Congratulations! Your course '{course.title}' has reached {total_enrollments} students!"
                )

        except Exception as e:
            logger.error(f"Failed to send milestone notification: {str(e)}")

    @staticmethod
    def notify_high_value_enrollment_to_instructor(enrollment):
        """Notify course owner of high-value enrollment"""
        try:
            # Currency-specific thresholds
            thresholds = {
                'NGN': 100000,   # 100,000 Naira
                'USD': 100,      # $100 USD
                'EUR': 90,       # €90
                'GBP': 80,       # £80
                'GHS': 1500,     # 1,500 Cedi
                'KES': 13000,    # 13,000 Shilling
                'ZAR': 1800,     # 1,800 Rand
            }

            threshold = thresholds.get(enrollment.currency, 100)  # Default to 100

            if enrollment.amount_paid and enrollment.amount_paid >= threshold:
                instructor = enrollment.course.created_by

                instructor_earnings = float(enrollment.amount_paid) * 0.7  # 70% to instructor

                subject = f"High-Value Sale: {enrollment.currency} {enrollment.amount_paid} - {enrollment.course.title}"
                context = {
                    'enrollment': enrollment,
                    'course': enrollment.course,
                    'instructor': instructor,
                    'instructor_earnings': instructor_earnings,
                    'buyer': enrollment.user,
                    'course_url': f"{settings.FRONTEND_URL}/admin/courses/{enrollment.course.id}",
                    'currency_symbol': AdminEmailService.get_currency_symbol(enrollment.currency),
                    'threshold': thresholds
                }

                EmailService._send_email(
                    user=instructor,
                    email_type='high_value_sale_notification',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/instructor/high_value_sale.html', context),
                    plain_message=f"Great news! {enrollment.user.full_name} purchased your course '{enrollment.course.title}' for {enrollment.currency} {enrollment.amount_paid}. Your earnings: {enrollment.currency} {instructor_earnings}"
                )

        except Exception as e:
            logger.error(f"Failed to send high-value enrollment notification to instructor: {str(e)}")

    @staticmethod
    def notify_super_admins_high_revenue(enrollment):
        """Notify super admins of very high value enrollments"""
        try:
            # Currency-specific thresholds
            thresholds = {
                'NGN': 1000000,  # 1,000,000 Naira
                'USD': 1000,     # $1000 USD
                'EUR': 900,      # €900
                'GBP': 800,      # £800
                'GHS': 15000,    # 15,000 Cedi
                'KES': 130000,   # 130,000 Shilling
                'ZAR': 18000,    # 18,000 Rand
            }
            
            threshold = thresholds.get(enrollment.currency, 1000)  # Default to 1000
            
            if enrollment.amount_paid and enrollment.amount_paid >= threshold:
                super_admins = User.objects.filter(role='super_admin', is_active=True)
                
                platform_share = float(enrollment.amount_paid) * 0.30
                
                subject = f"High Revenue Alert: {enrollment.currency} {enrollment.amount_paid} Enrollment"
                context = {
                    'enrollment': enrollment,
                    'platform_revenue': platform_share,
                    'commission_rate': '30%',
                    'currency_symbol': AdminEmailService.get_currency_symbol(enrollment.currency),
                    'threshold': thresholds
                }
                
                for super_admin in super_admins:
                    EmailService._send_email(
                        user=super_admin,
                        email_type='high_revenue_alert',
                        subject=subject,
                        html_message=AdminEmailService._render_template('emails/platform_admin/high_revenue_alert.html', context),
                        plain_message=f"High value enrollment: {enrollment.currency} {enrollment.amount_paid} (Platform share: {enrollment.currency} {platform_share})"
                    )
                    
        except Exception as e:
            logger.error(f"Failed to send high revenue alert: {str(e)}")
    
    @staticmethod
    def notify_high_value_enrollment(enrollment):
        """Main enrollment notification router"""
        try:
            # Route by value
            AdminEmailService.notify_enrollment_by_value(enrollment)

            # Check for milestones
            AdminEmailService.notify_milestone_enrollments(enrollment)

            # Log for analytics
            logger.info(f"Enrollment notification sent: {enrollment.user.email} -> {enrollment.course.title} ({enrollment.currency} {enrollment.amount_paid})")

        except Exception as e:
            logger.error(f"Failed to process enrollment notifications: {str(e)}")
    
    @staticmethod
    def notify_video_upload_success(course, admin_user, video_info):
        """Notify admin when video upload is successful"""
        try:
            subject = f"Video Upload Successful: {course.title}"
            context = {
                'course': course,
                'admin_user': admin_user,
                'video_info': video_info,
                'course_url': f"{settings.FRONTEND_URL}/admin/courses/{course.id}"
            }
            
            EmailService._send_email(
                user=admin_user,
                email_type='video_upload_success',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/video_upload_success.html', context),
                plain_message=f"Video upload successful for course: {course.title}"
            )
            
        except Exception as e:
            logger.error(f"Failed to send video upload success notification: {str(e)}")
    
    @staticmethod
    def notify_video_upload_failure(course_title, admin_user, error_message):
        """Notify admin when video upload fails"""
        try:
            subject = f"Video Upload Failed: {course_title}"
            context = {
                'course_title': course_title,
                'admin_user': admin_user,
                'error_message': error_message,
                'support_email': 'support@nclexvirtualschool.com'
            }
            
            EmailService._send_email(
                user=admin_user,
                email_type='video_upload_failure',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/video_upload_failure.html', context),
                plain_message=f"Video upload failed for course: {course_title}. Error: {error_message}"
            )
            
        except Exception as e:
            logger.error(f"Failed to send video upload failure notification: {str(e)}")

    @staticmethod
    def notify_exam_created(exam, admin_user):
        """Notify ONLY the admin who created the exam"""
        try:
            subject = f"New Exam Created: {exam.title} for {exam.course.title}"

            exam_type_classes = {
                'quiz': 'exam-type-quiz',
                'assignment': 'exam-type-assignment',
                'midterm': 'exam-type-midterm',
                'final': 'exam-type-final',
            }
            difficulty_classes = {
                'easy': 'difficulty-easy',
                'medium': 'difficulty-medium',
                'hard': 'difficulty-hard',
            }

            context = {
                'exam': exam,
                'course': exam.course,
                'created_by': admin_user,
                'exam_url': f"{settings.FRONTEND_URL}/admin/courses/{exam.course.id}/exams/{exam.id}",
                'type_class': exam_type_classes.get(exam.exam_type, 'exam-type-default'),
                'difficulty_class': difficulty_classes.get(exam.difficulty_level, 'difficulty-default'),
            }

            EmailService._send_email(
                user=admin_user,
                email_type='exam_created',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/exam_created.html', context),
                plain_message=f"You have successfully created a new exam '{exam.title}' for course '{exam.course.title}'."
            )

        except Exception as e:
            logger.error(f"Failed to send exam creation notification: {str(e)}")

    @staticmethod
    def send_new_review_notification(review):
        """Send notification to admins about new course review"""
        admin_users = User.objects.filter(
            role='super_admin',
            is_active=True
        )

        if not admin_users.exists():
            return

        context = {
            'review': review,
            'course': review.course,
            'user': review.user,
            'admin_url': f"{settings.FRONTEND_URL}/admin/courses/{review.course.id}/reviews/{review.id}",
            'course_url': f"{settings.FRONTEND_URL}/courses/{review.course.id}",
            'site_url': settings.FRONTEND_URL
        }

        subject = f"New Course Review - {review.course.title}"

        for admin_user in admin_users:
            try:
                EmailService._send_email(
                    user=admin_user,
                    email_type='new_review_notification',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/new_review_notification.html', context),
                    plain_message=f"New review for course '{review.course.title}' by {review.user.full_name}. Rating: {review.rating}/5"
                )
            except Exception as e:
                logger.error(f"Failed to send review notification to {admin_user.email}: {str(e)}")

    @staticmethod
    def notify_super_admins_new_course(course, instructor):
        """Notify super admins when new course is created"""
        try:
            super_admins = User.objects.filter(role='super_admin', is_active=True)

            subject = f"New Course Pending Approval: {course.title}"
            context = {
                'course': course,
                'instructor': instructor,
                'review_url': f"{settings.FRONTEND_URL}/super-admin/courses/{course.id}/moderate",
                'instructor_profile_url': f"{settings.FRONTEND_URL}/super-admin/instructors/{instructor.id}",
                'course_details_url': f"{settings.FRONTEND_URL}/super-admin/courses/{course.id}"
            }

            for super_admin in super_admins:
                EmailService._send_email(
                    user=super_admin,
                    email_type='new_course_pending_approval',
                    subject=subject,
                    html_message=AdminEmailService._render_template('emails/platform_admin/new_course_pending.html', context),
                    plain_message=f"New course '{course.title}' by {instructor.full_name} requires approval before it can be published."
                )

        except Exception as e:
            logger.error(f"Failed to notify super admins: {str(e)}")
    
    @staticmethod
    def send_instructor_payout_notification(instructor, payout, period):
        """Send payout notification to instructor"""
        try:
            # Get formatted amount from the payout object
            formatted_amount = payout.get_formatted_amount()

            subject = f"Your Earnings Payout: {formatted_amount}"
            context = {
                'instructor': instructor,
                'payout': payout,
                'formatted_amount': formatted_amount,
                'period': period,
                'dashboard_url': f"{settings.FRONTEND_URL}/admin/dashboard"
            }

            EmailService._send_email(
                user=instructor,
                email_type='instructor_payout',
                subject=subject,
                html_message=AdminEmailService._render_template('emails/instructor/payout_notification.html', context),
                plain_message=f"Your earnings payout of {formatted_amount} for {period} has been processed."
            )

        except Exception as e:
            logger.error(f"Failed to send payout notification: {str(e)}")

    @staticmethod
    def _render_template(template_path, context):
        """Helper method to render email templates"""
        from django.template.loader import render_to_string
        try:
            return render_to_string(template_path, context)
        except Exception as e:
            logger.warning(f"Template {template_path} not found: {str(e)}")
            # Return a simple HTML fallback
            return f"""
            <h3>{context.get('subject', 'Notification')}</h3>
            <p>This is an automated notification from NCLEX Virtual School.</p>
            <pre>{json.dumps(context, indent=2, default=str)}</pre>
            """