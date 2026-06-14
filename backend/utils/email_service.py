import os
import smtplib
from email.message import EmailMessage
import mimetypes

def send_statement_email(to_email: str, ticker: str, pdf_path: str):
    """Sends the PDF statement to the user's email if credentials exist."""
    
    SMTP_EMAIL = os.getenv("SMTP_EMAIL")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

    # If no credentials, we simulate sending (useful for demo without exposing passwords)
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"[SIMULATED EMAIL] Sending {pdf_path} to {to_email}...")
        return {"status": "simulated", "message": "Email simulated successfully (credentials not provided)."}

    try:
        msg = EmailMessage()
        msg['Subject'] = f'Your FinAgentX Trade Statement: {ticker.upper()}'
        msg['From'] = f"FinAgentX <{SMTP_EMAIL}>"
        msg['To'] = to_email
        
        msg.set_content(f"Hello,\n\nYour trade for {ticker.upper()} has been successfully executed.\n\nPlease find your official PDF statement attached.\n\nBest,\nThe FinAgentX Team")

        # Attach PDF
        with open(pdf_path, 'rb') as f:
            pdf_data = f.read()
            
        msg.add_attachment(pdf_data, maintype='application', subtype='pdf', filename=os.path.basename(pdf_path))

        # Connect and send
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SMTP_EMAIL, SMTP_PASSWORD)
            smtp.send_message(msg)

        print(f"[EMAIL] Sent {pdf_path} to {to_email} successfully.")
        return {"status": "success", "message": "Email sent successfully."}

    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email: {e}")
        return {"status": "error", "message": str(e)}
