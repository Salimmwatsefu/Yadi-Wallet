from decimal import Decimal
from django.db import migrations

def create_system_wallets(apps, schema_editor):
    Wallet = apps.get_model('finance', 'Wallet')
    Currency = apps.get_model('finance', 'Currency')

    # Make sure KES currency exists
    kes, _ = Currency.objects.get_or_create(
        code='KES',
        defaults={'name': 'Kenyan Shilling', 'symbol': 'KSh'}
    )

    # List of system wallets to create
    system_wallets = [
        ('MASTER', 'Master Liquidity (Paybill)'),
        ('SETTLEMENT', 'Settlement (Incoming)'),
        ('REVENUE', 'Yadi Revenue (Profit)'),
        ('SUSPENSE', 'Suspense (Held Funds)'),
        ('RESERVE', 'Reserve (Bank Vault)'),
    ]

    for wallet_type, label in system_wallets:
        Wallet.objects.get_or_create(
            wallet_type=wallet_type,
            currency=kes,  # ✅ assign currency
            defaults={
                'balance': Decimal('0.00'),
                'label': label,
                'is_primary': False,
            }
        )

class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0004_feeconfiguration_transaction_external_reference_and_more'),
    ]

    operations = [
        migrations.RunPython(create_system_wallets),
    ]
