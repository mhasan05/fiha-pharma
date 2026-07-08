"""Push + in-app notification helpers.

Delivers device notifications directly through Firebase Cloud Messaging (FCM)
using the firebase-admin SDK — no Expo project / Expo push gateway involved.
Sending is best-effort: a push failure never breaks the calling business flow.

Setup: place a Firebase service-account JSON on the server and point to it with
the FIREBASE_CREDENTIALS env var (defaults to <project_backend>/firebase-service-account.json).
"""
import logging
import os

logger = logging.getLogger(__name__)

_fcm_ready = False


def _firebase_credentials_path():
    path = os.environ.get("FIREBASE_CREDENTIALS")
    if path:
        return path
    # Default: project_backend/firebase-service-account.json
    return os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "firebase-service-account.json",
    )


def _init_fcm():
    """Initialise the firebase-admin app once. Returns True if FCM is usable."""
    global _fcm_ready
    if _fcm_ready:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            cred_path = _firebase_credentials_path()
            if not os.path.exists(cred_path):
                logger.warning("FCM credentials not found at %s", cred_path)
                return False
            firebase_admin.initialize_app(credentials.Certificate(cred_path))
        _fcm_ready = True
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("FCM init failed: %s", exc)
        return False


def send_fcm_push(tokens, title, body, data=None):
    """Send a notification to one or more FCM device tokens. Silently ignores
    empty tokens, cleans up tokens FCM reports as unregistered, and never raises."""
    valid = [t for t in (tokens or []) if t]
    if not valid or not _init_fcm():
        return

    from firebase_admin import messaging

    # FCM data payload values must be strings.
    data_str = {str(k): str(v) for k, v in (data or {}).items()}

    for token in valid:
        try:
            message = messaging.Message(
                token=token,
                notification=messaging.Notification(title=title, body=body),
                data=data_str,
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        channel_id="default", sound="default"
                    ),
                ),
            )
            messaging.send(message)
        except Exception as exc:  # noqa: BLE001
            # Drop tokens the device/app no longer owns so the table stays clean.
            unregistered = getattr(messaging, "UnregisteredError", ())
            if unregistered and isinstance(exc, unregistered):
                from .models import PushToken
                PushToken.objects.filter(token=token).delete()
            else:
                logger.warning("FCM push failed: %s", exc)


def notify_user(user, title, message, data=None):
    """Create an in-app Notification AND push it to the user's devices.

    Safe to call from anywhere; does nothing if `user` is None.
    """
    if user is None:
        return

    # Imported here to avoid import cycles at app-load time.
    from .models import Notification, PushToken

    try:
        Notification.objects.create(user=user, title=title, message=message)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to store in-app notification: %s", exc)

    tokens = list(PushToken.objects.filter(user=user).values_list("token", flat=True))
    send_fcm_push(tokens, title, message, data=data)
