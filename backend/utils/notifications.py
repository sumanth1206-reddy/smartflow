from backend.models.notification import Notification
from backend.extensions import db

def create_notification(type_val, title, message):
    """
    Helper function to log notification records in the database.
    Does not run db.session.commit() so that the calling endpoint's
    transaction boundaries are respected, or commits directly if used stand-alone.
    """
    try:
        new_note = Notification(
            type=type_val,
            title=title,
            message=message,
            read=False
        )
        db.session.add(new_note)
        return new_note
    except Exception as e:
        print(f"Error logging notification alert: {e}")
        return None
