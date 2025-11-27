import uuid
# from django_daraja.mpesa.core import MpesaClient

class MpesaGateway:
    @staticmethod
    def trigger_b2c(phone_number, amount, reference):
        """
        Performs the actual B2C Payment.
        """
        # -------------------------------------------------------
        # REAL PRODUCTION CODE (Uncomment when you have Keys):
        # -------------------------------------------------------
        # client = MpesaClient()
        # response = client.business_payment(
        #    phone_number=phone_number,
        #    amount=amount,
        #    transaction_desc="Withdrawal",
        #    occassion="Payout"
        # )
        # return response.conversation_id
        # -------------------------------------------------------

        # SIMULATION
        print(f"💸 [M-PESA B2C] Sending KES {amount} to {phone_number} (Ref: {reference})... SUCCESS.")
        return f"B2C-{uuid.uuid4().hex[:10].upper()}"