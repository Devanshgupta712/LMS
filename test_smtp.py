import smtplib
from email.mime.text import MIMEText

def test_smtp():
    print("Testing SMTP connection...")
    try:
        msg = MIMEText("This is a test email.", "plain")
        msg["Subject"] = "SMTP Test"
        msg["From"] = "devanshdd124g@gmail.com"
        msg["To"] = "devanshdd124g@gmail.com"
        
        # Test with spaces
        print("Trying to login...")
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.set_debuglevel(1)
            server.starttls()
            server.login("devanshdd124g@gmail.com", "dhnrkttnxjsddgrc") # spaces removed
            server.sendmail("devanshdd124g@gmail.com", "devanshdd124g@gmail.com", msg.as_string())
        
        print("Success! Email sent.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_smtp()
