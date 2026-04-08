import os
import resend
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL     = os.getenv("FROM_EMAIL", "DriftOwl <onboarding@resend.dev>")
DEV_MODE       = not RESEND_API_KEY

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def _send(to: str, subject: str, html: str) -> bool:
    if DEV_MODE:
        print(f"\n{'='*50}")
        print(f"[EMAIL - DEV MODE] To: {to}")
        print(f"Subject: {subject}")
        # Extract plain text from html for readability
        import re
        text = re.sub(r'<[^>]+>', '', html)
        print(text.strip())
        print('='*50 + '\n')
        return True
    try:
        resend.Emails.send({"from": FROM_EMAIL, "to": to, "subject": subject, "html": html})
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def send_verification_email(to: str, first_name: str, code: str) -> bool:
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="font-size: 24px; font-weight: 800; color: #0A0A0F; margin-bottom: 8px;">
        Verify your email
      </h2>
      <p style="color: #6E6E73; margin-bottom: 32px;">
        Hi {first_name}, enter this code in DriftOwl to confirm your account.
      </p>
      <div style="background: #F6F8FC; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 32px;">
        <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #0A0A0F;">
          {code}
        </span>
      </div>
      <p style="font-size: 13px; color: #AEAEB2;">
        This code expires in 60 minutes. If you didn't create a DriftOwl account, ignore this email.
      </p>
    </div>
    """
    return _send(to, "Your DriftOwl verification code", html)


def send_reset_email(to: str, first_name: str, reset_url: str) -> bool:
    html = f"""
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h2 style="font-size: 24px; font-weight: 800; color: #0A0A0F; margin-bottom: 8px;">
        Reset your password
      </h2>
      <p style="color: #6E6E73; margin-bottom: 32px;">
        Hi {first_name}, click the button below to set a new password. This link expires in 30 minutes.
      </p>
      <a href="{reset_url}" style="
        display: inline-block; padding: 14px 32px;
        background: #1C6EF3; color: #fff;
        font-size: 15px; font-weight: 700;
        border-radius: 12px; text-decoration: none;
        margin-bottom: 32px;
      ">Reset password →</a>
      <p style="font-size: 13px; color: #AEAEB2;">
        If you didn't request a password reset, ignore this email. Your password won't change.
      </p>
    </div>
    """
    return _send(to, "Reset your DriftOwl password", html)
